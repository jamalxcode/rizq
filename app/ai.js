// Rizq: Animal behavior, plus auto-explore, travel and resting.
// Loaded as a classic script, in order, from index.html. All files share one global scope.
'use strict';
// ================= MONSTER AI =================
function stepDown(m,d){
 const cur=d[idx(m.x,m.y)];let best=null,bv=cur;
 for(const[dx,dy]of shuffle(DIRS.slice())){const nx=m.x+dx,ny=m.y+dy;if(!inb(nx,ny))continue;const j=idx(nx,ny);
  if(!monPass(j)||monAt(nx,ny)||(P.x===nx&&P.y===ny)||diagBlocked(m.x,m.y,nx,ny))continue;
  if(d[j]<bv){bv=d[j];best=[nx,ny];}}
 if(best){m.x=best[0];m.y=best[1];return true;}return false;
}
function randomStep(m){
 for(const[dx,dy]of shuffle(DIRS.slice())){const nx=m.x+dx,ny=m.y+dy;if(!inb(nx,ny))continue;const j=idx(nx,ny);
  if(!monPass(j)||monAt(nx,ny)||(P.x===nx&&P.y===ny)||diagBlocked(m.x,m.y,nx,ny))continue;
  if(L.t[j]===T.DOWN||L.t[j]===T.UP||L.t[j]===T.HOME)continue;
  m.x=nx;m.y=ny;return true;}return false;
}
function fleeStep(m){
 const cur=distP[idx(m.x,m.y)];let best=null,bv=cur;
 for(const[dx,dy]of shuffle(DIRS.slice())){const nx=m.x+dx,ny=m.y+dy;if(!inb(nx,ny))continue;const j=idx(nx,ny);
  if(!monPass(j)||monAt(nx,ny)||(P.x===nx&&P.y===ny)||diagBlocked(m.x,m.y,nx,ny))continue;
  if(distP[j]>bv&&distP[j]<32767){bv=distP[j];best=[nx,ny];}}
 if(best){m.x=best[0];m.y=best[1];return true;}return false;
}
const moveCost=m=>(MT[m.k].speed||100)*(TD[L.t[idx(m.x,m.y)]].slow?2:1);
const adjacentP=m=>cheb(m.x,m.y,P.x,P.y)===1&&!diagBlocked(m.x,m.y,P.x,P.y);
function monAttack(m,tgt,mult){
 const t=MT[m.k];const isP=tgt===P;const tn=isP?null:MT[tgt.k];
 const armor=isP?playerArmor():tn.def;
 const seen=vis[idx(m.x,m.y)];
 const who=m.state==='ally'||m.state==='herd'?`Your ${t.name}`:`The ${t.name}`;
 if(t.hitrun)m.fear=2; // crows peck, then flap back out of reach
 if(!chance(hitPct(t.acc,armor)/100)){if(isP)msg(`The ${t.name} misses you.`);else if(seen)msg(`${who} misses the ${tn.name}.`);return 100;}
 let dmg=ri(t.dmg[0],t.dmg[1])+(m.temp?Math.floor((m.pw||1)/2):0);
 // Pack hunters bite harder when packmates are also next to the target.
 if(t.howl){const tx=tgt.x,ty=tgt.y;dmg+=L.mons.filter(o=>o!==m&&o.k===m.k&&isHostile(o)&&cheb(o.x,o.y,tx,ty)===1).length;}
 if(mult)dmg=Math.round(dmg*mult);
 if(isP){
  msg(`The ${t.name} ${t.verb||'hits'} you${mult?' hard':''}.`,'bad');
  if(t.poison){P.poison+=t.poison;msg('You’ve been poisoned!','bad');}
  if(t.stealMoney&&P.dinars>0&&!m.carry){
   if(rune('outfit')==='pockets'){revealRune('outfit');msg(`The ${t.name} tugs at your zipped pockets and gets nothing.`);}
   else{const amt=Math.min(P.dinars,ri(10,40)*G.depth);P.dinars-=amt;m.carry=amt;m.state='flee';m.fear=0;msg(`The ${t.name} snatches ${fmt(amt)} KD and makes a run for it! (Banked money is safe.)`,'bad');}}
  if(t.stealFood&&!m.food){const dt=P.inv.find(i=>i.k==='dates');if(dt){removeOne(dt);m.food=1;m.state='flee';msg(`The ${t.name} grabs your dates and runs!`,'bad');}}
  if(rune('outfit')==='thorny'&&m.state!=='npc'){m.hp-=ri(1,3);revealRune('outfit');if(m.hp<=0){damagePlayer(dmg,`${/^[aeiou]/i.test(t.name)?'an':'a'} ${t.name}`);driveOff(m,'The burrs on your outfit are too much.',true);return 100;}}
  damagePlayer(dmg,`${/^[aeiou]/i.test(t.name)?'an':'a'} ${t.name}`);
 }else{
  tgt.hp-=dmg;flash(tgt.x,tgt.y,isFriend(tgt)?[230,60,50]:[255,250,235],170);
  if(seen)msg(`${who} ${t.verb||'hits'} the ${tn.name}.`,isFriend(tgt)?'warn':'');
  if(isHostile(tgt)&&tgt.state!=='flee')tgt.state='hunt';
  if(tgt.hp<=0)driveOff(tgt,null);
 }
 return 100;
}
// "X notices you" once per kind of animal every few turns, so a pack doesn't flood the log.
function noticeMsg(m,woke){
 const t=MT[m.k],n=t.name;G.noticed=G.noticed||{};
 if(G.turn-(G.noticed[m.k]??-99)<6){G.noticed[m.k]=G.turn;return;}
 G.noticed[m.k]=G.turn;
 const lines=t.hidden&&woke?[`The ${n} bursts out of hiding!`,`The sand shifts. A ${n} was buried right there!`]
  :woke?[`The ${n} wakes up and notices you!`,`The ${n} stirs, then stares right at you.`,`The ${n} opens one eye. Then both.`]
  :[`The ${n} notices you!`,`The ${n} spots you.`,`The ${n} looks up. It’s seen you.`];
 msg(pick(lines),'warn');
}
// Wolves howl when they find you, and the rest of the pack joins the hunt.
function startHunt(m){
 m.state='hunt';m.lost=0;const t=MT[m.k];
 if(t.howl){let n=0;for(const o of L.mons)if(o!==m&&o.k===m.k&&(o.state==='sleep'||o.state==='wander')){o.state='hunt';o.lost=0;n++;}
  if(!L.howled){L.howled=1;sfx('howl');msg(n?'A wolf howls. The rest of the pack answers, and it’s coming for you.':'A wolf howls.','bad');}}
}
function noticed(m,asleep){
 if(!vis[idx(m.x,m.y)])return false;let sr=stealthRange();if(asleep)sr=Math.max(1,sr/2);
 if(cheb(m.x,m.y,P.x,P.y)>sr)return false;return chance(asleep?.35:.85);
}
function monAct(m){
 const t=MT[m.k];
 if(m.state==='npc')return 100;
 if(m.slowed>0)m.slowed--;if(m.hasted>0)m.hasted--;
 if(m.stun>0){m.stun--;return 100;}
 if(m.conf>0){m.conf--;randomStep(m);return moveCost(m);}
 if(m.winded>0)m.winded--;
 if(m.state==='captive')return 100;
 if(m.temp){m.timer--;if(m.timer<=0){L.mons=L.mons.filter(o=>o!==m);if(vis[idx(m.x,m.y)])msg('Your cousin’s phone rings. His mom needs him. He leaves.');return 100;}}
 if(m.fear>0){m.fear--;if(!fleeStep(m)&&isHostile(m)&&adjacentP(m))return monAttack(m,P);return moveCost(m);}
 switch(m.state){
  case 'neutral':
   if(t.flighty&&cheb(m.x,m.y,P.x,P.y)<=2){fleeStep(m);return moveCost(m);}
   if(chance(t.erratic||.2))randomStep(m);return moveCost(m);
  case 'herd':return followAct(m);
  case 'ally':return allyAct(m);
  case 'sleep':
   if(noticed(m,true)){if(canSee(m)||cheb(m.x,m.y,P.x,P.y)<=2)noticeMsg(m,true);startHunt(m);}
   return 100;
  case 'wander':
   if(noticed(m,false)){noticeMsg(m,false);startHunt(m);return 100;}
   return wanderAct(m);
  case 'hunt':return huntAct(m);
  case 'flee':{
   const d=cheb(m.x,m.y,P.x,P.y);
   if((m.carry||m.food)&&((!vis[idx(m.x,m.y)]&&d>7&&chance(.15))||(t.stealMoney&&d>3&&chance(.12)))){
    L.mons=L.mons.filter(o=>o!==m);
    msg(m.carry?(vis[idx(m.x,m.y)]?`The ${t.name} flies off over the rooftops with your ${fmt(m.carry)} KD.`:`Somewhere, a ${t.name} is ${fmt(m.carry)} KD richer than it was this morning.`):`The ${t.name} got away with your dates.`,'bad');return 100;}
   if(!m.carry&&!m.food&&m.hp>=m.maxHp*.8)m.state='hunt';
   if(!fleeStep(m)&&adjacentP(m))return monAttack(m,P);
   return moveCost(m);}
 }
 return 100;
}
function huntAct(m){
 const t=MT[m.k];const d=cheb(m.x,m.y,P.x,P.y);
 if(t.erratic&&chance(t.erratic)){randomStep(m);return moveCost(m);}
 // Bull camels charge in a straight line, then need a moment to catch their breath.
 if(t.charge&&!m.winded&&d>=2&&d<=6&&vis[idx(m.x,m.y)]){
  const ax=Math.abs(P.x-m.x),ay=Math.abs(P.y-m.y),sx=Math.sign(P.x-m.x),sy=Math.sign(P.y-m.y);
  if(ax===0||ay===0||ax===ay){let ok=true;const path=[];let cx=m.x,cy=m.y;
   for(let s=1;s<d;s++){const nx=m.x+sx*s,ny=m.y+sy*s;if(!monPass(idx(nx,ny))||monAt(nx,ny)||diagBlocked(cx,cy,nx,ny)){ok=false;break;}path.push([nx,ny]);cx=nx;cy=ny;}
   if(ok&&!diagBlocked(cx,cy,P.x,P.y)){trail(path,[214,150,90]);m.x=cx;m.y=cy;m.winded=4;msg(`The ${t.name} charges!`,'bad');const r=monAttack(m,P,1.5);m.stun=1;return r;}}}
 // Hyenas circle until you're hurt, then commit.
 if(t.cautious&&P.hp>P.maxHp*.5&&d<=2){
  if(!m.circled){m.circled=1;if(canSee(m))msg(`The ${t.name} circles you, waiting for you to weaken.`,'warn');}
  if(d===1&&chance(.25))return monAttack(m,P);
  fleeStep(m);return moveCost(m);}
 if(adjacentP(m))return monAttack(m,P);
 for(const[dx,dy]of DIRS){const o=monAt(m.x+dx,m.y+dy);if(o&&isFriend(o)&&!diagBlocked(m.x,m.y,o.x,o.y)&&chance(t.predator&&o.state==='herd'?.85:.5))return monAttack(m,o);}
 // Predators go after your herd when it's closer than you are.
 if(t.predator){let prey=null,pd=d;for(const o of L.mons)if(o.state==='herd'){const od=cheb(o.x,o.y,m.x,m.y);if(od<pd&&od<=8){pd=od;prey=o;}}
  if(prey){if(!m.preyWarned&&canSee(prey)){m.preyWarned=1;msg(`The ${t.name} is going for your ${MT[prey.k].name}!`,'warn');}
   if(!stepDown(m,pathTo(idx(prey.x,prey.y))))randomStep(m);return moveCost(m);}}
 if(vis[idx(m.x,m.y)])m.lost=0;else if(++m.lost>25){m.state='wander';return 100;}
 if(!stepDown(m,distP))randomStep(m);
 return moveCost(m);
}
function wanderAct(m){
 const t=MT[m.k];
 if(t.erratic&&chance(t.erratic)){randomStep(m);return moveCost(m);}
 let c=wanderCache.get(m.id);
 if(!c||(m.x===c.tx&&m.y===c.ty)||chance(.01)){
  const cand=[];for(let a=0;a<40;a++){const i=ri(0,N-1);if(FLOORLIKE.has(L.t[i])){cand.push(i);break;}}
  if(!cand.length){randomStep(m);return moveCost(m);}
  const i=cand[0];c={tx:i%W,ty:(i/W)|0,d:bfs([i],monPass)};wanderCache.set(m.id,c);
  if(wanderCache.size>40)wanderCache.delete(wanderCache.keys().next().value);
 }
 if(!stepDown(m,c.d)){if(chance(.3))wanderCache.delete(m.id);randomStep(m);}
 return moveCost(m);
}
function followAct(m){
 if(m.state==='herd'&&G.herdStay){if(chance(.1))randomStep(m);return moveCost(m);}
 const d=distP[idx(m.x,m.y)];
 if(d>2){if(!stepDown(m,distP))randomStep(m);}
 else if(chance(.15))randomStep(m);
 return moveCost(m);
}
function allyAct(m){
 let best=null,bd=99;
 for(const o of L.mons){if(!isHostile(o))continue;const dd=cheb(o.x,o.y,m.x,m.y);if(dd<=7&&(vis[idx(o.x,o.y)]||dd<=2)&&dd<bd){bd=dd;best=o;}}
 if(best&&distP[idx(m.x,m.y)]<=10){
  if(bd===1&&!diagBlocked(m.x,m.y,best.x,best.y))return monAttack(m,best);
  if(!stepDown(m,pathTo(idx(best.x,best.y))))randomStep(m);return moveCost(m);
 }
 return followAct(m);
}

// ================= AUTO (explore / travel / rest) =================
// Traders stand still; auto-explore and travel path around them.
let npcCells=new Set();
const refreshNpcCells=()=>{npcCells=new Set(L.mons.filter(m=>m.state==='npc').map(m=>idx(m.x,m.y)));};
const walkKnown=i=>(P.x+P.y*W===i)||(L.known[i]&&TD[L.t[i]].pass&&!L.fire[i]&&!npcCells.has(i)&&L.t[i]!==T.DOWN&&L.t[i]!==T.UP&&L.t[i]!==T.HOME);
function visibleThreats(){return L.mons.filter(m=>isHostile(m)&&m.state!=='sleep'&&canSee(m));}
function startAuto(type,goal){
 if(G.over)return;
 const th=visibleThreats().filter(m=>cheb(m.x,m.y,P.x,P.y)<=9&&m.state!=='flee');
 if(th.length&&type!=='travel-force'){msg(`Not now. There’s a ${MT[th[0].k].name} nearby.`,'warn');updateUI();return;}
 auto={type,goal,seen:new Set(L.mons.filter(m=>isHostile(m)&&canSee(m)).map(m=>m.id)),n:0};
 interrupt=false;setTimeout(runAuto,0);
}
function stopAuto(){auto=null;}
function runAuto(){
 if(!auto||G.over){auto=null;return;}
 const hp=P.hp,depth=G.depth;interrupt=false;let ok=false;
 if(auto.type==='explore')ok=exploreStep();
 else if(auto.type==='travel')ok=travelStep();
 else if(auto.type==='rest')ok=restStep();
 if(!auto)return;
 auto.n++;
 if(!ok||G.depth!==depth||auto.n>600){auto=null;updateUI();render();return;}
 const now=L.mons.filter(m=>isHostile(m)&&canSee(m));
 if(now.some(m=>!auto.seen.has(m.id))||P.hp<hp||interrupt){auto=null;interrupt=false;updateUI();render();return;}
 auto.seen=new Set(now.map(m=>m.id));
 setTimeout(runAuto,auto.type==='rest'?4:22);
}
function stepToward(d){
 const cur=d[idx(P.x,P.y)];if(cur>=32767)return null;
 let best=null,bv=cur;
 for(const[dx,dy]of DIRS){const nx=P.x+dx,ny=P.y+dy;if(!inb(nx,ny))continue;const j=idx(nx,ny);if(d[j]<bv&&!diagBlocked(P.x,P.y,nx,ny)){bv=d[j];best=[dx,dy];}}
 return best;
}
function exploreStep(){
 refreshNpcCells();
 const goals=[];
 const room=it=>P.inv.length<26||(STACK.has(IT[it.k]?.cat)&&P.inv.some(o=>o.k===it.k))||it.k==='money';
 for(const it of L.items)if(it.seen&&!it.vault&&!it.noauto&&(!it.left||room(it))&&!(it.x===P.x&&it.y===P.y))goals.push(idx(it.x,it.y));
 let d=goals.length?bfs(goals,walkKnown):null;
 if(!d||d[idx(P.x,P.y)]>=32767||d[idx(P.x,P.y)]>25){
  const g2=[];const me=idx(P.x,P.y);for(let i=0;i<N;i++){if(i===me||!walkKnown(i))continue;const x=i%W,y=(i/W)|0;if(DIRS.some(([dx,dy])=>inb(x+dx,y+dy)&&!L.known[idx(x+dx,y+dy)]))g2.push(i);}
  const d2=g2.length?bfs(goals.concat(g2),walkKnown):null;if(d2)d=d2;
 }
 const s=d&&stepToward(d);
 if(!s){msg(L.down&&L.known[idx(...L.down)]?'Explored everything you can reach. Press > to head onward.':'Explored everything you can reach.');return false;}
 const m=monAt(P.x+s[0],P.y+s[1]);if(m&&(isHostile(m)||m.state==='npc'))return false;
 return playerMove(s[0],s[1]);
}
function travelStep(){
 refreshNpcCells();
 const g=idx(auto.goal[0],auto.goal[1]);
 if(P.x===auto.goal[0]&&P.y===auto.goal[1])return false;
 const pass=i=>i===g||walkKnown(i);
 const d=bfs([g],pass);const s=stepToward(d);
 if(!s){msg('You don’t know a way there yet.');return false;}
 const m=monAt(P.x+s[0],P.y+s[1]);if(m&&(isHostile(m)||m.state==='npc'))return false;
 return playerMove(s[0],s[1]);
}
function restStep(){
 const bad=P.poison>0||P.st.conf||P.st.slow;
 if(P.hp>=P.maxHp&&!bad){msg('You feel rested.');return false;}
 if(auto.n>400)return false;
 rest();return true;
}
function travelStairs(dir){
 if(G.over)return;
 const s=dir>0?L.down:L.up;
 if(dir>0&&!s){msg('There’s nowhere further. Time to head home.');updateUI();return;}
 if(!L.known[idx(s[0],s[1])]){msg(dir>0?'You haven’t found the way onward yet. Exploring…':'You haven’t found the way back yet.');if(dir>0)startAuto('explore');else updateUI();return;}
 startAuto('travel',s);
}


// Rizq: Starting a run, changing depth, the bag, player actions, using items, targeting, and the turn engine.
// Loaded as a classic script, in order, from index.html. All files share one global scope.
'use strict';
// ================= NEW GAME / LEVELS =================
function newGame(seed,daily){
 G={v:SAVE_VERSION,seed:seed>>>0,rs:(seed^0x9e3779b9)>>>0,turn:0,depth:1,levels:{},nextId:1,msgs:[],msgSeq:0,known:{},app:{},stats:{deepest:1,driven:0,tamed:0,sold:0},over:null,lifeDebt:.25,strDebt:.2,envNext:100,zonesSeen:{},bank:0,daily:daily||null,herdStay:false};
 curRng=gameRng;
 const da=shuffle(DRINK_APPS.slice());DRINKS.forEach((k,i)=>G.app[k]=da[i]);
 const ta=shuffle(TIP_APPS.slice());TIPS.forEach((k,i)=>G.app[k]=ta[i]);
 P={x:0,y:0,hp:40,maxHp:40,str:12,thirst:THIRST_MAX,dinars:0,inv:[],eq:{tool:null,outfit:null,acc1:null,acc2:null},st:{},next:0,poison:0,rg:0,rested:false};
 const add=(k,o)=>{const it=Object.assign(makeItem(k),o||{});addInv(it);return it;};
 P.eq.tool=add('stick',{ench:0,known:true,rn:null}).id;
 P.eq.outfit=add('dishdasha',{ench:0,known:true,rn:null}).id;
 add('water',{q:2});add('dates',{q:3});add('pebbles',{q:8});add('flashlight');add('chai');
 G.levels[1]=genLevel(1);L=G.levels[1];
 P.x=L.up[0];P.y=L.up[1];G.zonesSeen[0]=1;
 msg('A new day, a big dream. Time to go out and make your own rizq.','gold');
 msg('Goal: 100,000 KD net worth, then come back through your front door ⌂. Press ? for help.');
 afterTurn(true);
}
function changeLevel(dir){const to=G.depth+dir;if(to<1||to>MAXD)return;goToLevel(to,dir>0?'up':'down',dir);}
// Move to another depth. `arrive` is where you appear: at its way back ('up'), its way onward ('down'), or beside your front door ('home').
function goToLevel(to,arrive,dir){
 if(G.ride&&arrive!=='home'){G.ride=null;msg('You left before the pickup truck arrived. It came and went without you, and the fee is gone.','bad');}
 // Friends always come along; the herd comes unless you told it to stay. A ride home takes everyone with you.
 const near=m=>arrive==='home'||distP[idx(m.x,m.y)]<=12;
 const fol=L.mons.filter(m=>near(m)&&(m.state==='ally'||(m.state==='herd'&&(!G.herdStay||arrive==='home'))));
 const left=L.mons.filter(m=>m.state==='herd'&&!fol.includes(m)).length;
 L.mons=L.mons.filter(m=>!fol.includes(m));
 G.depth=to;
 if(!G.levels[to])G.levels[to]=genLevel(to);
 L=G.levels[to];wanderCache.clear();pathCache.clear();
 const anchor=arrive==='up'?L.up:arrive==='down'?L.down:L.up;
 let[sx,sy]=anchor;
 const taken=new Set(L.mons.map(m=>idx(m.x,m.y)));
 if(arrive==='home'){const s=nearFree(L,idx(sx,sy),2,taken)[0];if(s!==undefined){sx=s%W;sy=(s/W)|0;}}
 P.x=sx;P.y=sy;taken.add(idx(sx,sy));
 const spots=nearFree(L,idx(sx,sy),6,taken);
 for(const m of fol){const s=spots.shift();if(s===undefined)break;m.x=s%W;m.y=(s/W)|0;L.mons.push(m);}
 for(const m of L.mons)m.next=Math.max(m.next,P.next);
 G.stats.deepest=Math.max(G.stats.deepest,to);
 const z=zoneOf(to);
 if(arrive==='home')msg('The pickup truck drops you off outside your house. Your front door ⌂ is right there.','gold');
 else if(!G.zonesSeen[z.id]){G.zonesSeen[z.id]=1;msg(z.arrive,'gold');}
 else msg(dir>0?`You head further out. Depth ${to}.`:`You head back toward home. Depth ${to}.`);
 if(to===MAXD&&dir>0&&!G.saw26){G.saw26=1;msg('This is as far as the road goes. Grab what you can, then head home.','gold');}
 if(HUBS[to]&&!(G.hubSeen||(G.hubSeen={}))[to]){G.hubSeen[to]=1;msg(`${cap(HUBS[to])} is set up right by the way back. Walk into the trader (@) to buy, sell, bank or get a ride home.`,'gold');}
 if(fol.length)msg(`${fol.length===1?'Your '+MT[fol[0].k].name+' follows':'Your '+fol.length+' animals follow'} you.`);
 if(left)msg(`${left===1?'One animal stays':left+' animals stay'} behind where you told them to wait. They don’t count toward your net worth until you collect them.`,'warn');
 auto=null;afterTurn(true);save();
}
const cap=s=>s[0].toUpperCase()+s.slice(1);

// ================= INVENTORY =================
const LETTERS='abcdefghijklmnopqrstuvwxyz';
function addInv(it){
 const d=IT[it.k];
 if(STACK.has(d.cat)){const ex=P.inv.find(o=>o.k===it.k);if(ex){ex.q+=it.q;return ex;}}
 if(d.cat==='treat'){const ex=P.inv.find(o=>o.k===it.k);if(ex){ex.c+=it.c;return ex;}}
 if(P.inv.length>=26)return null;
 const used=new Set(P.inv.map(o=>o.letter));it.letter=[...LETTERS].find(l=>!used.has(l));
 delete it.vault;delete it.seen;delete it.noauto;delete it.left;
 P.inv.push(it);return it;
}
function removeOne(it){it.q=(it.q||1)-1;if(it.q<=0)removeItem(it);}
function removeItem(it){P.inv=P.inv.filter(o=>o!==it);for(const s in P.eq)if(P.eq[s]===it.id)P.eq[s]=null;}
function itemCol(it){if(it.k==='money')return[255,214,90];const d=IT[it.k];if(d.cat==='drink'||d.cat==='tip')return G.app[it.k].col;return d.col;}
function itemCh(it){if(it.k==='money')return'*';const d=IT[it.k];if(d.cat==='drink')return'!';if(d.cat==='tip')return'?';return d.ch;}
function itemName(it){
 if(it.k==='money')return`${fmt(it.amt)} KD`;
 const d=IT[it.k];const q=it.q||1;
 if(d.cat==='drink'||d.cat==='tip'){const ap=G.app[it.k];if(G.known[it.k])return(q>1?q+' × ':'')+d.name;return q>1?`${q} ${ap.pl}`:ap.n;}
 if(STACK.has(d.cat))return q>1?`${q} ${d.plural||d.name+'s'}`:d.name;
 if(d.cat==='tool'||d.cat==='outfit')return(it.known?`${it.ench>=0?'+':''}${it.ench} `:'')+d.name+(it.rn&&(it.known||it.rk)?` (${RUNES[it.rn].name})`:'');
 if(d.cat==='gadget')return`${d.name} +${it.pw} [${it.c}/${it.mx}]`;
 if(d.cat==='treat')return`${d.name} (${it.c} left)`;
 if(d.cat==='acc')return`${d.name} +${it.pw}`;
 if(d.cat==='charm')return`${d.name} +${it.pw}`;
 return d.name;
}
function aName(it){const n=itemName(it);if(it.k==='money'||(it.q||1)>1||/^[+\-\d]/.test(n))return n;if(/^(mom|your|tip)/.test(n))return n;return(/^[aeiou]/i.test(n)?'an ':'a ')+n;}
function pickupHere(manual){
 const here=L.items.filter(it=>it.x===P.x&&it.y===P.y&&(manual||!it.noauto));
 if(!here.length){if(manual)msg('There’s nothing here to pick up.');return;}
 for(const it of here){
  if(it.k==='money'){P.dinars+=it.amt;L.items=L.items.filter(o=>o!==it);const a=fmt(it.amt);
   msg(`${pick([`You find ${a} KD.`,`${a} KD, just lying there. Yours now.`,`Someone dropped ${a} KD. Finders keepers.`,`You pocket ${a} KD.`])} Net worth: ${fmt(netWorth())} KD.`,'gold');flash(P.x,P.y,[255,214,90],260);sfx('coin');}
  else{const vg=it.vault;const name=aName(it);const r=addInv(it);
   if(!r){if(!it.left||manual)msg(`Your bag is full, so you leave ${name} here. Drop something first.`,'warn');it.left=1;continue;}
   delete it.left;
   L.items=L.items.filter(o=>o!==it);
   msg(`You pick up ${name} (${r.letter}).`,'good');
   if(vg){const others=L.items.filter(o=>o.vault===vg);if(others.length){L.items=L.items.filter(o=>o.vault!==vg);msg('You take the deal. The other offers are gone.');}}}
  if(it.k==='money'&&it.vault){const vg=it.vault;const others=L.items.filter(o=>o.vault===vg);if(others.length){L.items=L.items.filter(o=>o.vault!==vg);msg('You take the cash deal. The other offers are gone.');}}
 }
}

// ================= PLAYER ACTIONS =================
function playerMove(dx,dy){
 if(G.over)return false;
 if(dx===0&&dy===0){rest();return true;}
 if(P.st.stuck>0){P.st.stuck--;msg('You pull at your sandal. Still stuck in the sabkha.');endTurn(100);return true;}
 if(P.st.conf>0&&chance(.5)){const d=pick(DIRS);dx=d[0];dy=d[1];}
 const nx=P.x+dx,ny=P.y+dy;if(!inb(nx,ny))return false;
 const m=monAt(nx,ny);
 if(m&&!diagBlocked(P.x,P.y,nx,ny)){bump(m);return true;}
 if(diagBlocked(P.x,P.y,nx,ny))return false;
 const tt=L.t[idx(nx,ny)];const d=TD[tt];
 if(!d.pass){if(P.st.conf)return false;if(tt===T.CAR)msg('A parked car. Nobody’s moving it today.');else if(tt===T.TENT)msg('Someone’s uncle is in that tent watching football. Better not.');return false;}
 const sandy=rune('outfit')==='sand';
 if(sandy&&d.slow)revealRune('outfit');
 P.rested=false;moveTo(nx,ny,d.slow&&!sandy?200:100);return true;
}
function moveTo(nx,ny,cost){
 P.x=nx;P.y=ny;const tt=L.t[idx(nx,ny)];
 if(tt===T.SABKHA&&chance(.3)){if(rune('outfit')==='sand')revealRune('outfit');else{P.st.stuck=ri(1,2);msg('Your foot sinks into the salty mud of the sabkha.','warn');}}
 pickupHere(false);
 if(tt===T.DOWN){changeLevel(1);return;}
 if(tt===T.UP){changeLevel(-1);return;}
 if(tt===T.HOME){
  const nw=netWorth();
  if(nw>=TARGET){win();return;}
  msg(`Mom asks how business is going. You need ${fmt(TARGET-nw)} KD more before you can come home proud.`,'warn');
 }
 endTurn(cost);
}
function bump(m){
 const t=MT[m.k];
 if(m.state==='npc'){if(!auto)openShop(m);return;}
 if(isHostile(m)){playerAttack(m);return;}
 if(m.state==='captive'){m.state='ally';m.next=P.next;G.stats.tamed++;flash(m.x,m.y,[255,214,90],320);sfx('tame');msg(`You untie the ${t.name}. It's yours now! (+${fmt(t.value)} KD net worth)`,'gold');endTurn(100);return;}
 if(m.state==='neutral'&&t.kind==='livestock'){
  const b=P.inv.find(i=>i.k==='dates');const need=t.feed||1;
  if(b&&!auto){
   if(b.q<need)msg(`The ${t.name} sniffs your one handful of dates and wants more. (It takes ${need}.)`);
   else{b.q-=need;if(b.q<=0){removeItem(b);msg('That was the last of your dates.','warn');}
    m.state='herd';G.stats.tamed++;flash(m.x,m.y,[255,214,90],320);sfx('tame');msg(`The ${t.name} eats the dates from your hand and joins your herd. (+${fmt(t.value)} KD net worth)`,'gold');endTurn(100);return;}}
 }
 if(t.flighty){msg(`The ${t.name} flutters off, offended.`);fleeStep(m);m.state='neutral';endTurn(100);return;}
 if(m.state==='neutral'&&t.kind==='livestock'&&!auto)msg(`You squeeze past the ${t.name}. (Dates would win it over.)`);
 const slow=TD[L.t[idx(m.x,m.y)]].slow;
 swapWith(m);P.rested=false;
 const tt=L.t[idx(P.x,P.y)];
 if(tt===T.DOWN||tt===T.UP||tt===T.HOME){moveTo(P.x,P.y,100);return;}
 pickupHere(false);endTurn(slow?200:100);
}
function swapWith(m){const ox=P.x,oy=P.y;P.x=m.x;P.y=m.y;m.x=ox;m.y=oy;}
function playerAttack(m){
 const tool=eqItem('tool');const d=tool?IT[tool.k]:{dmg:[1,2],verb:'punch'};
 const targets=[m];
 if(d.sweep){for(const[dx,dy]of DIRS){const o=monAt(P.x+dx,P.y+dy);if(o&&o!==m&&isHostile(o)&&!diagBlocked(P.x,P.y,o.x,o.y))targets.push(o);}}
 if(d.reach){const bx=m.x+(m.x-P.x),by=m.y+(m.y-P.y);const o=inb(bx,by)&&monAt(bx,by);if(o&&isHostile(o))targets.push(o);}
 for(const o of targets)attackOne(o,tool,d);
 for(const o of L.mons)if(o.state==='sleep'&&cheb(o.x,o.y,P.x,P.y)<=5&&chance(.25))o.state='hunt';
 let cost=d.slow?200:100;if(rune('tool')==='quick'){cost/=2;revealRune('tool');}
 P.rested=false;endTurn(cost);
}
function attackOne(m,tool,d){
 const t=MT[m.k];const sneak=m.state==='sleep'||m.state==='wander'||m.stun>0;
 const hit=sneak||chance(hitPct(playerAcc(),t.def)/100);
 if(t.swarm)for(const o of L.mons)if(MT[o.k].swarm&&isHostile(o)&&cheb(o.x,o.y,m.x,m.y)<=8)o.state='hunt';
 if(!hit){msg(pick([`You miss the ${t.name}.`,`The ${t.name} dodges.`,`You swing at the ${t.name} and hit air.`]));sfx('miss');if(m.state!=='flee')m.state='hunt';return;}
 let dmg=(ri(d.dmg[0],d.dmg[1]))*Math.pow(1.065,(tool?tool.ench:0)-strPen(tool));
 if(sneak)dmg*=3;dmg=Math.max(1,Math.round(dmg));
 m.hp-=dmg;flash(m.x,m.y,[255,250,235],170);sfx('hit');
 if(tool&&!tool.known){tool.hits++;if(tool.hits>=20){tool.known=true;msg(`You've got the feel of your ${IT[tool.k].name} now: it's ${tool.ench>=0?'+':''}${tool.ench}${tool.rn?` and ${RUNES[tool.rn].name}`:''}.`,'good');}}
 if(m.hp<=0){driveOff(m,sneak?`You catch the ${t.name} off guard!`:null,true);return;}
 msg(sneak?`You catch the ${t.name} off guard and ${d.verb} it hard!`:`You ${d.verb} the ${t.name}.`);
 if(rune('tool')==='stun'&&chance(.25)){m.stun=Math.max(m.stun,2);revealRune('tool');msg(`The ${t.name} is dazed.`);}
 if(m.state!=='flee')m.state='hunt';
 if(t.fleeAt&&m.hp<m.maxHp*t.fleeAt)m.state='flee';
}
function driveOff(m,pre,byPlayer){
 const t=MT[m.k];
 L.mons=L.mons.filter(o=>o!==m);wanderCache.delete(m.id);
 if(m.carry){const it=moneyItem(m.carry);it.x=m.x;it.y=m.y;L.items.push(it);}
 if(m.food){const it=makeItem('dates');it.q=m.food;it.x=m.x;it.y=m.y;L.items.push(it);}
 if(m.state==='herd'||m.state==='ally'){msg(`Your ${t.name} panics and runs off for good!`,'bad');return;}
 G.stats.driven++;
 if(byPlayer&&rune('tool')==='fortune'&&chance(.4)){const it=moneyItem(ri(5,15)*G.depth);it.x=m.x;it.y=m.y;it.seen=1;L.items.push(it);revealRune('tool');}
 const seen=vis[idx(m.x,m.y)];
 if(seen)msg(`${pre?pre+' ':''}The ${t.name} ${t.off||'runs off and won’t be back.'}${m.carry?' It drops your money!':''}`,'good');
 for(const a of L.mons)if(a.state==='ally'&&cheb(a.x,a.y,m.x,m.y)<=2&&!a.temp){a.maxHp+=2;a.hp+=2;}
}
function rest(){P.rested=true;endTurn(100);}

// ================= ITEM USE =================
function useItem(it){
 const d=IT[it.k];
 switch(d.cat){
  case 'drink':return drink(it);
  case 'tip':return readTip(it);
  case 'course':return takeCourse(it);
  case 'water':removeOne(it);P.thirst=THIRST_MAX;msg('You drink the whole bottle. Ahh, cold water.','good');return endTurn(100);
  case 'dates':removeOne(it);P.thirst=Math.min(THIRST_MAX,P.thirst+700);P.hp=Math.min(P.maxHp,P.hp+3);msg('You eat a handful of dates. Sweet and sticky.','good');return endTurn(100);
  case 'machboos':removeOne(it);P.maxHp+=10;P.hp=P.maxHp;P.poison=0;msg("Mom's machboos, still warm in its foil. You feel loved. (+10 max energy)",'gold');return endTurn(100);
  case 'gift':removeOne(it);P.hp=Math.min(P.maxHp,P.hp+8);P.thirst=Math.min(THIRST_MAX,P.thirst+150);msg('You eat the ma’amoul yourself. No regrets.','good');return endTurn(100);
  case 'protein':removeOne(it);P.str++;msg(`You chug the protein shake. Fitness ${P.str}. Your gym friend would be proud.`,'gold');return endTurn(100);
  case 'tool':case 'outfit':case 'acc':return toggleEquip(it);
  case 'gadget':return useGadget(it);
  case 'treat':return throwTreat(it);
  case 'charm':return useCharm(it);
  case 'pebbles':return throwPebble(it);
 }
}
function drink(it){
 const k=it.k;const was=G.known[k];G.known[k]=true;removeOne(it);
 switch(k){
  case 'juice':P.hp=P.maxHp;P.poison=0;msg('Fresh orange juice! You feel completely refreshed.','good');break;
  case 'laban':P.hp=Math.min(P.maxHp,P.hp+Math.round(P.maxHp*.4));P.poison=0;P.thirst=Math.min(THIRST_MAX,P.thirst+600);msg('Cold laban. Your mother would approve.','good');break;
  case 'energy':P.st.haste=15;P.st.slow=0;msg('Energy drink! You’re moving faster than traffic on the Fifth Ring Road. (A low bar, but still.)','good');break;
  case 'mint':P.st.tele=300;msg('Ice-cold mint lemonade. Your senses sharpen. You can feel every animal around.','good');break;
  case 'spoiled':P.st.conf=10;msg('That juice was not fresh. The world spins.','bad');break;
  case 'soda':P.st.slow=10;P.st.haste=0;msg('Way too much sugar. You crash and move like it’s 2 p.m. in August.','bad');break;
 }
 if(!was)msg(`(It was ${IT[k].name}.)`);
 endTurn(100);
}
function readTip(it){
 const k=it.k;const was=G.known[k];G.known[k]=true;removeOne(it);
 const ident=()=>{if(!was)msg(`(That was ${IT[k].name}.)`);};
 switch(k){
  case 'shortcut':{const c=[];for(let i=0;i<N;i++)if(FLOORLIKE.has(L.t[i])&&!L.mons.some(m=>idx(m.x,m.y)===i)&&cheb(i%W,(i/W)|0,P.x,P.y)>10)c.push(i);const i=pick(c);P.x=i%W;P.y=(i/W)|0;msg('Your uncle’s voice note is seven minutes long, but minute six has a real shortcut.','good');break;}
  case 'maptip':for(let i=0;i<N;i++){const x=i%W,y=(i/W)|0;if(TD[L.t[i]].pass||DIRS.some(([dx,dy])=>inb(x+dx,y+dy)&&TD[L.t[idx(x+dx,y+dy)]].pass))L.known[i]=1;}msg('Finally, someone sends a pin location instead of “turn left after the old co-op.”','good');break;
  case 'ask':{ident();const unk=P.inv.filter(isUnknown);
   if(!unk.length){msg('You have nothing left to ask about. Your friend tells you about his car instead.');return endTurn(100);}
   if(unk.length===1){identify(unk[0]);return endTurn(100);}
   endTurn(100);openInv({mode:'select',title:'Ask about which item?',filter:isUnknown,onPick:x=>{identify(x);updateUI();render();}});return;}
  case 'lucky':for(const o of P.inv){if(IT[o.k].cat==='gadget')o.c=o.mx;if(IT[o.k].cat==='charm')o.cd=0;}msg('Lucky break! Someone lends you a power bank and refills your flask.','good');break;
  case 'loud':for(const m of L.mons)if(isHostile(m)){m.state='hunt';m.lost=0;}msg('Someone posts your plans in the family group chat. Every animal around knows where you are.','bad');break;
  case 'wrong':{const n=ri(2,3);const sp=nearFree(L,idx(P.x,P.y),2,new Set(L.mons.map(m=>idx(m.x,m.y))));for(let c=0;c<n&&sp.length;c++){const s=sp.shift();const m=makeMon(pickHostile(G.depth),s%W,(s/W)|0,G.depth);m.state='hunt';L.mons.push(m);}msg('These directions lead straight into trouble!','bad');break;}
 }
 ident();endTurn(100);
}
function pickHostile(depth){for(let a=0;a<30;a++){const k=pickSpawn(depth);if(MT[k].kind==='hostile')return k;}return'dog';}
const isUnknown=it=>{const d=IT[it.k];if(d.cat==='drink'||d.cat==='tip')return!G.known[it.k];if(d.cat==='tool'||d.cat==='outfit')return!it.known;return false;};
function identify(it){const d=IT[it.k];if(d.cat==='drink'||d.cat==='tip'){G.known[it.k]=true;}else it.known=true;msg(`Your friend who “knows a guy” actually knows: it's ${aName(it)}.`,'good');}
const canImprove=it=>['tool','outfit','gadget','acc','treat','charm'].includes(IT[it.k].cat);
function takeCourse(it){
 if(!P.inv.some(canImprove)){msg('You have nothing to improve.');return;}
 openInv({mode:'select',title:'Which item does this course improve?',filter:canImprove,onPick:x=>{
  const d=IT[x.k];removeOne(it);
  switch(d.cat){case 'tool':case 'outfit':x.ench++;break;case 'gadget':x.pw++;x.mx++;x.c++;break;case 'acc':case 'charm':x.pw++;break;case 'treat':x.c+=1;break;}
  msg(`You finish “${pick(COURSES)}.” Your ${d.name} is better now.`,'gold');endTurn(100);}});
}
function toggleEquip(it){
 const d=IT[it.k];
 if(isEquipped(it)){
  if(d.cat==='tool'){P.eq.tool=null;msg(`You put away your ${d.name}. Bare hands it is.`);}
  else if(d.cat==='outfit'){P.eq.outfit=null;msg(`You take off the ${d.name}.`);}
  else{for(const s of['acc1','acc2'])if(P.eq[s]===it.id)P.eq[s]=null;msg(`You take off the ${d.name}.`);}
  return endTurn(100);
 }
 if(d.cat==='tool')P.eq.tool=it.id;
 else if(d.cat==='outfit')P.eq.outfit=it.id;
 else{if(!P.eq.acc1)P.eq.acc1=it.id;else if(!P.eq.acc2)P.eq.acc2=it.id;else P.eq.acc1=it.id;}
 const pen=strPen(it);
 msg(`You ${d.cat==='tool'?'ready':'put on'} the ${itemName(it)}.${pen?` It’s too heavy for your fitness (needs ${d.str}).`:''}`,pen?'warn':'');
 endTurn(100);
}
function useGadget(it){
 const d=IT[it.k];
 if(it.c<=0){msg(`Your ${d.name} is out of battery. It recharges over time.`,'warn');return;}
 if(it.k==='flashlight'){
  startTarget(`Dazzle which animal?`,10,(x,y)=>{const path=boltPath(P.x,P.y,x,y,10);trail(path,[255,246,190]);const last=path[path.length-1];const m=last&&monAt(last[0],last[1]);it.c--;
   if(m){m.stun=3+2*it.pw;msg(`You blast the ${MT[m.k].name} with your flashlight. It’s dazzled!`,'good');}else msg('The beam hits nothing.');endTurn(100);});return;
 }
 it.c--;
 if(it.k==='airhorn'){let n=0;for(const m of L.mons){if(cheb(m.x,m.y,P.x,P.y)<=4+it.pw&&(isHostile(m)||m.state==='neutral')){m.fear=6+2*it.pw;if(isHostile(m))m.state='hunt';n++;}else if(m.state==='sleep'&&cheb(m.x,m.y,P.x,P.y)<=12)m.state='hunt';}
  msg(`HOOOOONK. ${n?'Everything nearby scatters!':'The whole neighborhood heard that.'}`,'good');}
 else if(it.k==='cousin'){const sp=nearFree(L,idx(P.x,P.y),2,new Set(L.mons.map(m=>idx(m.x,m.y))));
  if(!sp.length){it.c++;msg('There’s no room for your cousin to stand.');return;}
  const n=it.pw>=3&&sp.length>1?2:1;
  for(let c=0;c<n;c++){const s=sp[c];const m=makeMon('cousin',s%W,(s/W)|0,G.depth);m.maxHp=m.hp=30+10*it.pw;m.temp=true;m.timer=20+10*it.pw;m.pw=it.pw;L.mons.push(m);flash(m.x,m.y,[120,184,255],300);}
  msg(n>1?'You call your cousin. He brings his brother. Neither of them asks why.':'You call your cousin. He said “five minutes,” and somehow he actually shows up.','good');}
 else if(it.k==='drone'){const r=9+3*it.pw;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(Math.hypot(x-P.x,y-P.y)<=r){L.known[idx(x,y)]=1;}for(const o of L.items)if(Math.hypot(o.x-P.x,o.y-P.y)<=r)o.seen=1;
  if(it.pw>=2){P.st.tele=Math.max(P.st.tele||0,10*it.pw);msg('Your drone buzzes overhead, maps the area and spots every animal around.','good');}
  else msg('Your drone buzzes overhead and maps the area.','good');}
 endTurn(100);
}
function useCharm(it){
 const d=IT[it.k];
 if(it.cd>0){msg(`Your ${d.name} isn’t ready yet (${it.cd} more turns).`,'warn');return;}
 it.cd=Math.round(d.cd*Math.pow(.85,it.pw-1));
 if(it.k==='chai'){const h=Math.round(P.maxHp*(.3+.1*(it.pw-1)));P.hp=Math.min(P.maxHp,P.hp+h);P.thirst=Math.min(THIRST_MAX,P.thirst+300);msg('You pour strong tea into your istikana. Small glass, big comfort.','good');}
 else if(it.k==='gahwa'){P.st.haste=8+2*it.pw;P.st.slow=0;msg('A few small cups of gahwa from the dalla. You’re sharp as a falcon.','good');}
 else if(it.k==='carkeys'){const[ux,uy]=L.up;const sp=nearFree(L,idx(ux,uy),2,new Set(L.mons.map(m=>idx(m.x,m.y))));const s=sp[0];if(s!==undefined){P.x=s%W;P.y=(s/W)|0;}msg('You hop in the car and drive back to the way up. The AC is glorious.','good');}
 endTurn(100);
}
function throwPebble(it){
 startTarget('Throw a pebble at what?',8,(x,y)=>{
  const path=boltPath(P.x,P.y,x,y,8);let land=[P.x,P.y];let hitM=null;
  for(const p of path){if(!TD[L.t[idx(p[0],p[1])]].pass)break;land=p;const m=monAt(p[0],p[1]);if(m){hitM=m;break;}}
  trail(path,[214,204,190]);
  removeOne(it);const peb=makeItem('pebbles');peb.q=1;peb.x=land[0];peb.y=land[1];
  if(hitM&&hitM.state==='npc'){msg('You think better of throwing stones at a trader.');hitM=null;}
  if(hitM){const t=MT[hitM.k];const sneak=hitM.state==='sleep'||hitM.stun>0;
   if(sneak||chance(hitPct(playerAcc(),t.def)/100)){let dmg=ri(2,4)*(sneak?3:1);hitM.hp-=dmg;sfx('hit');if(hitM.hp<=0)driveOff(hitM,null,true);else{msg(`Your pebble hits the ${t.name}.`);if(isHostile(hitM))hitM.state='hunt';}}
   else{msg(`Your pebble misses the ${t.name}.`);sfx('miss');if(isHostile(hitM))hitM.state='hunt';}}
  const ex=L.items.find(o=>o.k==='pebbles'&&o.x===peb.x&&o.y===peb.y);if(ex)ex.q++;else L.items.push(peb);
  endTurn(100);});
}
function throwTreat(it){
 if(it.k==='dogtreats'){
  startTarget('Throw a treat to which animal?',8,(x,y)=>{const path=boltPath(P.x,P.y,x,y,8);trail(path,[206,134,82]);let m=null;for(const p of path){if(!TD[L.t[idx(p[0],p[1])]].pass)break;m=monAt(p[0],p[1]);if(m)break;}
   it.c--;if(it.c<=0){removeItem(it);}
   if(m&&MT[m.k].canine&&(isHostile(m)||m.state==='neutral')){m.state='ally';m.fear=0;m.carry=0;G.stats.tamed++;flash(m.x,m.y,[255,214,90],320);sfx('tame');msg(`The ${MT[m.k].name} wolfs down the treat and decides you're its human now.`,'gold');}
   else if(m)msg(`The ${MT[m.k].name} isn’t interested in dog treats.`);else msg('The treat lands in the dust.');
   if(it.c<=0)msg('That was your last dog treat.');endTurn(100);});return;
 }
 if(it.k==='firecrackers'){
  startTarget('Throw firecrackers where?',8,(x,y)=>{const path=boltPath(P.x,P.y,x,y,8);let land=[P.x,P.y];for(const p of path){if(!TD[L.t[idx(p[0],p[1])]].pass)break;land=p;if(monAt(p[0],p[1]))break;}
   trail(path,[236,72,60]);it.c--;if(it.c<=0)removeItem(it);explode(land[0],land[1]);endTurn(100);});
 }
}
function explode(x,y){
 msg('BANG! BANG-BANG-BANG! Firecrackers!','warn');interrupt=false;sfx('boom');shake();
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(!inb(nx,ny))continue;ignite(idx(nx,ny));flash(nx,ny,[255,150,40],380,120);
  const m=monAt(nx,ny);if(m&&!isFriend(m)&&m.state!=='npc'){m.hp-=ri(3,6);if(m.hp<=0)driveOff(m,null,true);}
  if(P.x===nx&&P.y===ny)damagePlayer(ri(2,5),'your own firecrackers');}
 for(const m of L.mons)if(cheb(m.x,m.y,x,y)<=4&&!isFriend(m)&&m.state!=='npc'){m.fear=8;if(isHostile(m))m.state='hunt';}
}
// Throw a drink: it splashes everything in a 3×3 area. Bad drinks become weapons; good ones heal your animals.
function throwDrink(it){
 startTarget(`Throw the ${itemName(it)} where?`,8,(x,y)=>{
  const path=boltPath(P.x,P.y,x,y,8);let land=[P.x,P.y];for(const p of path){if(!TD[L.t[idx(p[0],p[1])]].pass)break;land=p;if(monAt(p[0],p[1]))break;}
  const k=it.k;const col=G.app[k].col;const was=G.known[k];G.known[k]=true;removeOne(it);trail(path,col);
  let n=0;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=land[0]+dx,ny=land[1]+dy;if(!inb(nx,ny))continue;flash(nx,ny,col,420,140);
   const m=monAt(nx,ny);if(!m||m.state==='npc')continue;n++;
   if(k==='spoiled')m.conf=8;else if(k==='soda')m.slowed=8;else if(k==='energy')m.hasted=8;
   else if(k==='juice')m.hp=m.maxHp;else if(k==='laban')m.hp=Math.min(m.maxHp,m.hp+Math.round(m.maxHp*.4));
   if(isHostile(m)&&m.state!=='flee')m.state='hunt';}
  const effect={spoiled:'Anything it splashed is stumbling around, dizzy.',soda:'Anything it splashed slows to a sugary crawl.',energy:'Uh oh. Anything it splashed is now wired and fast.',juice:'Anything it splashed looks completely refreshed.',laban:'Anything it splashed looks a bit better.',mint:'It smells great. Nothing else happens.'}[k];
  msg(`The ${was?IT[k].name:G.app[k].n} smashes and splashes${n?'':' the ground'}. ${n?effect:''}`);
  if(!was)msg(`(It was ${IT[k].name}.)`);
  endTurn(100);});
}
function ignite(i){if(TD[L.t[i]].flam>0&&!L.fire[i])L.fire[i]=ri(3,6)+(L.t[i]===T.OIL?2:0);}
function boltPath(x0,y0,x1,y1,range){
 const pts=[];const dx=x1-x0,dy=y1-y0;const steps=Math.max(Math.abs(dx),Math.abs(dy));if(!steps)return pts;
 for(let s=1;s<=range;s++){const x=x0+Math.round(dx*s/steps),y=y0+Math.round(dy*s/steps);if(!inb(x,y))break;pts.push([x,y]);if(!TD[L.t[idx(x,y)]].pass||monAt(x,y))break;}
 return pts;
}
function dropItem(it){
 if(isEquipped(it))for(const s in P.eq)if(P.eq[s]===it.id)P.eq[s]=null;
 P.inv=P.inv.filter(o=>o!==it);it.x=P.x;it.y=P.y;it.noauto=1;it.seen=1;L.items.push(it);
 msg(`You drop ${aName(it)}.`);endTurn(100);
}

// ================= TARGETING =================
function startTarget(label,range,cb){
 const cands=L.mons.filter(m=>canSee(m)&&!isFriend(m)&&m.state!=='npc').sort((a,b)=>cheb(a.x,a.y,P.x,P.y)-cheb(b.x,b.y,P.x,P.y));
 targ={label,range,cb,cands,i:0,x:cands[0]?cands[0].x:P.x,y:cands[0]?cands[0].y:P.y};
 $('#bannerTxt').textContent=`${label} Tap or click a spot. Tab cycles, Enter confirms.`;$('#banner').hidden=false;render();
}
function endTarget(){targ=null;$('#banner').hidden=true;render();}
function confirmTarget(x,y){const t=targ;endTarget();if(x===P.x&&y===P.y){msg('You can’t target yourself.');updateUI();return;}t.cb(x,y);}

// ================= TURN ENGINE =================
function endTurn(cost){
 if(G.over)return;
 if(P.st.haste)cost=Math.round(cost/2);if(P.st.slow)cost*=2;
 P.next+=cost;
 distP=bfs([idx(P.x,P.y)],monPass);
 let guard=0;
 while(!G.over&&guard++<4000){
  let mm=null,mt=Infinity;for(const m of L.mons)if(m.next<mt){mt=m.next;mm=m;}
  const et=G.envNext;
  if(P.next<=Math.min(mt,et))break;
  if(et<=mt){envTick();G.envNext+=100;}
  else{let c=monAct(mm)||100;if(mm.slowed>0)c*=2;if(mm.hasted>0)c=Math.round(c/2);if(L.mons.includes(mm))mm.next+=c;}
 }
 afterTurn(false);
}
function afterTurn(full){
 if(G.ride&&G.ride.ready&&!G.over){G.ride=null;goToLevel(1,'home',-1);return;}
 if(full)distP=bfs([idx(P.x,P.y)],monPass);
 computeFOV();updateUI();render();
 if(!G.over&&G.turn%25===0)save();
}
function damagePlayer(d,cause){
 if(G.over)return;P.hp-=d;interrupt=true;
 if(d>0){flash(P.x,P.y,[230,60,50],260);sfx('hurt');if(d>=5||d>=P.maxHp*.15)shake();}
 if(P.hp<=0){P.hp=0;die(cause);}
}
function envTick(){
 G.turn++;pathCache.clear();
 const z=zoneOf(G.depth);const o=eqItem('outfit');
 let rate=z.heat*(o&&IT[o.k].heat?IT[o.k].heat:1)*Math.max(.3,1-.15*accPow('shemagh'));
 if(rune('outfit')==='cool'){rate*=.7;if(G.turn%200===0)revealRune('outfit');}
 if(L.dust[idx(P.x,P.y)]>8){if(rune('outfit')==='sand')revealRune('outfit');else rate+=.5;}
 const before=P.thirst;P.thirst=Math.max(0,P.thirst-rate);
 if(before>300&&P.thirst<=300)msg('You’re getting thirsty.','warn');
 if(before>150&&P.thirst<=150)msg('Your throat is drier than Jahra in August. Drink something!','warn');
 if(before>50&&P.thirst<=50)msg('You’re dehydrated! You’ll start losing energy.','bad');
 if(P.thirst<=0){damagePlayer(1,'dehydration');if(G.turn%8===0)msg('You’re dehydrated and fading fast!','bad');if(G.over)return;}
 if(P.poison>0){P.poison--;damagePlayer(1,'venom');if(G.over)return;}
 else if(P.hp<P.maxHp){P.rg+=P.maxHp/(900*Math.pow(.75,accPow('band')));while(P.rg>=1){P.rg--;P.hp=Math.min(P.maxHp,P.hp+1);}}
 const ends={haste:'Your energy fades back to normal.',slow:'You shake off the sugar crash.',conf:'The world stops spinning.',tele:'Your senses go back to normal.'};
 for(const k in P.st){if(P.st[k]>0){P.st[k]--;if(P.st[k]===0){delete P.st[k];if(ends[k])msg(ends[k]);}}else delete P.st[k];}
 for(const it of P.inv){const d=IT[it.k];
  if(d.cat==='gadget'&&it.c<it.mx){it.rt++;if(it.rt>=Math.round(d.rech/(1+.35*accPow('watch')))){it.c++;it.rt=0;}}
  if(d.cat==='charm'&&it.cd>0){it.cd--;if(it.cd===0)msg(`Your ${d.name} is ready again.`,'good');}}
 if(o&&!o.known){o.wear=(o.wear||0)+1;if(o.wear>=300){o.known=true;msg(`You’re used to your ${IT[o.k].name} now: it's ${o.ench>=0?'+':''}${o.ench}${o.rn?` and ${RUNES[o.rn].name}`:''}.`,'good');}}
 if(G.ride&&!G.ride.ready){G.ride.left--;if(G.ride.left<=0)G.ride.ready=true;else if(G.ride.left===5)msg('You hear the pickup truck coming. About five more turns.','gold');}
 fireTick();if(G.over)return;
 if(z.storms)dustTick();
 for(const m of L.mons)if(m.hp<m.maxHp&&chance(isFriend(m)?.1:.04))m.hp++;
 if(chance(1/450))spawnWanderer();
}
function fireTick(){
 const f=L.fire,t=L.t;let any=false;const ign=[];
 for(let i=0;i<N;i++){if(!f[i])continue;any=true;f[i]--;
  const x=i%W,y=(i/W)|0;
  for(const[dx,dy]of DIR4){const nx=x+dx,ny=y+dy;if(!inb(nx,ny))continue;const j=idx(nx,ny);if(!f[j]&&TD[t[j]].flam&&chance(TD[t[j]].flam*.55))ign.push(j);}
  if(f[i]===0){t[i]=t[i]===T.DOOR?T.FLOOR:T.ASH;}}
 for(const j of ign)ignite(j);
 if(!any)return;
 for(const m of L.mons.slice()){if(!f[idx(m.x,m.y)]||m.state==='npc')continue;m.hp-=ri(2,5);m.fear=Math.max(m.fear,3);if(m.hp<=0)driveOff(m,null);}
 if(f[idx(P.x,P.y)]){msg('You’re standing in fire!','bad');damagePlayer(ri(2,5),'a grass fire');}
}
let dustBuf=new Float32Array(N);
function dustTick(){
 const d=L.dust;
 if(chance(1/70)){const cx=ri(3,W-4),cy=ri(3,H-4);for(let y=cy-3;y<=cy+3;y++)for(let x=cx-4;x<=cx+4;x++)if(inb(x,y)&&TD[L.t[idx(x,y)]].pass)d[idx(x,y)]+=60;
  if(cheb(cx,cy,P.x,P.y)<15)msg('A sandstorm whips up nearby.','warn');}
 let any=false;
 for(let i=0;i<N;i++){if(!TD[L.t[i]].pass){dustBuf[i]=0;continue;}const x=i%W,y=(i/W)|0;let s=0,c=0;
  for(const[dx,dy]of DIR4){const j=idx(x+dx,y+dy);if(TD[L.t[j]].pass){s+=d[j];c++;}}
  let v=c?d[i]*.5+(s/c)*.5:d[i];v*=.985;if(v<.5)v=0;else any=true;dustBuf[i]=v;}
 if(any||d.some(v=>v>0)){d.set(dustBuf);}
}
function spawnWanderer(){
 const k=pickHostile(G.depth);const c=[];
 for(let i=0;i<N;i++)if(FLOORLIKE.has(L.t[i])&&!vis[i]&&distP[i]>15&&distP[i]<32767)c.push(i);
 if(!c.length)return;const g=addGroup(L,k,pick(c),G.depth,'wander');
}
function win(){
 const nw=netWorth();G.over={won:true,cause:''};
 try{localStorage.removeItem('rizq-save');}catch(e){}
 if(!SIM)showEnd(true,nw);
}
function die(cause){
 G.over={won:false,cause};
 try{localStorage.removeItem('rizq-save');}catch(e){}
 msg(`You collapse. (${cause})`,'bad');
 updateUI();render();
 const g=G;if(!SIM)setTimeout(()=>{if(G===g)showEnd(false,netWorth());},350);
}


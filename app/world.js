// Rizq: Current-level helpers, messages, feedback effects (flashes, shake, sound), and field of view.
// Loaded as a classic script, in order, from index.html. All files share one global scope.
'use strict';
// ================= HELPERS (current level) =================
let vis=new Uint8Array(N),distP=new Int16Array(N),auto=null,targ=null,interrupt=false;
const wanderCache=new Map();
const monAt=(x,y)=>L.mons.find(m=>m.x===x&&m.y===y);
const tileAt=(x,y)=>L.t[idx(x,y)];
const isHostile=m=>m.state==='sleep'||m.state==='wander'||m.state==='hunt'||m.state==='flee';
const isFriend=m=>m.state==='ally'||m.state==='herd';
// Hidden animals (vipers, scorpions) can't be seen while they lie in wait unless you're right next to them.
const canSee=m=>!!vis[idx(m.x,m.y)]&&!(MT[m.k].hidden&&m.state==='sleep'&&cheb(m.x,m.y,P.x,P.y)>2);
const diagBlocked=(x0,y0,x1,y1)=>diagBlockedT(L.t,x0,y0,x1,y1);
function opaqueAt(x,y){const i=idx(x,y);const d=TD[L.t[i]];if(L.dust[i]>=25)return true;if(d.door)return!(monAt(x,y)||(P.x===x&&P.y===y));return d.opaque;}
const monPass=i=>TD[L.t[i]].pass&&!L.fire[i];
function bfs(goals,passFn){return bfsT(L.t,goals,passFn);}
// Path maps toward a single cell, shared by every animal heading there. Cleared each turn, since fire changes what's passable.
const pathCache=new Map();
function pathTo(i){let d=pathCache.get(i);if(!d){d=bfs([i],monPass);pathCache.set(i,d);}return d;}
function eqItem(slot){const id=P.eq[slot];return id?P.inv.find(i=>i.id===id)||null:null;}
function isEquipped(it){return Object.values(P.eq).includes(it.id);}
function accPow(k){let s=0;for(const sl of['acc1','acc2']){const it=eqItem(sl);if(it&&it.k===k)s+=it.pw;}return s;}
function strPen(it){return it?Math.max(0,(IT[it.k].str||0)-P.str):0;}
function rune(slot){const it=eqItem(slot);return it&&it.rn?it.rn:null;}
function revealRune(slot){const it=eqItem(slot);if(it&&it.rn&&!it.rk){it.rk=true;msg(`Your ${IT[it.k].name} is ${RUNES[it.rn].name}! ${RUNES[it.rn].desc}`,'good');}}
function playerAcc(){const t=eqItem('tool');return 100*Math.pow(1.065,t?t.ench:0)-strPen(t)*4+(rune('tool')==='sure'?30:0);}
function playerArmor(){const o=eqItem('outfit');if(!o)return 0;return Math.max(0,(IT[o.k].armor+o.ench-strPen(o))*10);}
function shownArmor(){const o=eqItem('outfit');if(!o)return'0';const v=IT[o.k].armor+(o.known?o.ench:0)-strPen(o);return o.known?String(Math.max(0,v)):Math.max(0,v)+'?';}
function stealthRange(){let r=P.rested?7:14;r-=2*accPow('sandals');return Math.max(2,r);}
function visRadius(){return zoneOf(G.depth).vis;}
// Net worth: cash in your pocket, money in the bank, and the animals that are here with you.
const herdValue=()=>L.mons.reduce((s,m)=>s+(isFriend(m)?(MT[m.k].value||0):0),0);
function netWorth(){return P.dinars+(G.bank||0)+herdValue();}
function hitPct(acc,def){return clamp(Math.round(acc*Math.pow(.986,def)),0,100);}

// ================= MESSAGES =================
function msg(t,c=''){G.msgs.push({t,c,n:G.turn,id:G.msgSeq=(G.msgSeq||0)+1});if(G.msgs.length>80)G.msgs.shift();if(c==='bad'||c==='warn')interrupt=true;}

// ================= FEEDBACK: flashes, trails, shake, sound =================
const fx=[];let fxReq=0;let SIM=false;
const reduceMotion=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function flash(x,y,col,dur=200,delay=0){if(SIM)return;fx.push({x,y,col,t0:performance.now()+delay,dur});if(!fxReq)fxReq=requestAnimationFrame(fxLoop);}
function trail(path,col){path.forEach((p,i)=>flash(p[0],p[1],col,170,i*30));}
function fxLoop(){fxReq=0;const now=performance.now();for(let i=fx.length-1;i>=0;i--)if(now>fx[i].t0+fx[i].dur)fx.splice(i,1);render();if(fx.length)fxReq=requestAnimationFrame(fxLoop);}
function shake(){if(SIM||reduceMotion()||!cv.animate)return;cv.animate([{transform:'translate(0,0)'},{transform:'translate(-4px,2px)'},{transform:'translate(4px,-2px)'},{transform:'translate(-2px,1px)'},{transform:'translate(0,0)'}],{duration:200});}
const SND={on:true};let actx=null;
try{SND.on=localStorage.getItem('rizq-sound')!=='off';}catch(e){}
const SOUNDS={hit:[[200,.06,'square']],miss:[[140,.04,'triangle']],hurt:[[120,.14,'sawtooth']],coin:[[880,.06,'triangle'],[1320,.09,'triangle']],tame:[[523,.1,'sine'],[784,.16,'sine']],boom:[[70,.3,'sawtooth']],buy:[[660,.06,'triangle'],[990,.08,'triangle']],howl:[[300,.5,'sine']],step:null};
function sfx(kind){
 if(SIM||!SND.on)return;const notes=SOUNDS[kind];if(!notes)return;
 try{if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();let t=actx.currentTime;
  for(const[f,d,w]of notes){const o=actx.createOscillator(),g=actx.createGain();o.type=w;o.frequency.setValueAtTime(f,t);if(kind==='howl')o.frequency.linearRampToValueAtTime(f*1.6,t+d);
   g.gain.setValueAtTime(.05,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(actx.destination);o.start(t);o.stop(t+d);t+=d*.8;}}catch(e){}
}

// ================= FOV =================
const MULT=[[1,0,0,-1,-1,0,0,1],[0,1,-1,0,0,-1,1,0],[0,1,1,0,0,-1,-1,0],[1,0,0,1,-1,0,0,-1]];
function computeFOV(){
 vis.fill(0);const r=visRadius();const i0=idx(P.x,P.y);vis[i0]=1;L.known[i0]=1;
 for(let o=0;o<8;o++)castLight(P.x,P.y,1,1,0,r,MULT[0][o],MULT[1][o],MULT[2][o],MULT[3][o]);
 for(const it of L.items)if(vis[idx(it.x,it.y)])it.seen=1;
}
function castLight(cx,cy,row,start,end,radius,xx,xy,yx,yy){
 if(start<end)return;let newStart=0;
 for(let j=row;j<=radius;j++){
  let dx=-j-1,dy=-j,blocked=false;
  while(dx<=0){
   dx++;const X=cx+dx*xx+dy*xy,Y=cy+dx*yx+dy*yy;
   const lS=(dx-.5)/(dy+.5),rS=(dx+.5)/(dy-.5);
   if(start<rS)continue;else if(end>lS)break;
   const ok=inb(X,Y);
   if(ok&&dx*dx+dy*dy<=radius*radius){const i=idx(X,Y);vis[i]=1;L.known[i]=1;}
   const op=!ok||opaqueAt(X,Y);
   if(blocked){if(op){newStart=rS;continue;}else{blocked=false;start=newStart;}}
   else if(op&&j<radius){blocked=true;castLight(cx,cy,j+1,start,lS,radius,xx,xy,yx,yy);newStart=rS;}
  }
  if(blocked)break;
 }
}


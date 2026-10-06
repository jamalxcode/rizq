// Rizq: Level generation: the city grid, Shuwaikh yards, farms, desert caves, stairs, deal rooms, and populating each depth.
// Loaded as a classic script, in order, from index.html. All files share one global scope.
'use strict';
// ================= LEVEL GENERATION =================
function regions(t){
 const lab=new Int32Array(N).fill(-1);const out=[];const q=new Int32Array(N);
 for(let s=0;s<N;s++){
  if(lab[s]>=0||!TD[t[s]].pass)continue;
  const id=out.length;const cells=[];let h=0,tl=0;q[tl++]=s;lab[s]=id;
  while(h<tl){const i=q[h++];cells.push(i);const x=i%W,y=(i/W)|0;
   for(const[dx,dy]of DIR4){const nx=x+dx,ny=y+dy;if(!inb(nx,ny))continue;const j=idx(nx,ny);if(lab[j]<0&&TD[t[j]].pass){lab[j]=id;q[tl++]=j;}}}
  out.push(cells);
 }
 return out;
}
function connect(lv,z){
 const t=lv.t,fl=floorOf(z);
 for(let guard=0;guard<60;guard++){
  const regs=regions(t);if(regs.length<=1)return;
  regs.sort((a,b)=>b.length-a.length);
  const r=regs[1];
  if(r.length<5&&z.gen==='cave'){for(const i of r)t[i]=T.WALL;continue;}
  const main=new Uint8Array(N);for(const i of regs[0])main[i]=1;
  const prev=new Int32Array(N).fill(-2);const q=new Int32Array(N);let h=0,tl=0,hit=-1;
  for(const i of r){prev[i]=-1;q[tl++]=i;}
  while(h<tl&&hit<0){const i=q[h++];const x=i%W,y=(i/W)|0;
   for(const[dx,dy]of shuffle(DIR4.slice())){const nx=x+dx,ny=y+dy;if(nx<1||ny<1||nx>W-2||ny>H-2)continue;const j=idx(nx,ny);if(prev[j]!==-2)continue;prev[j]=i;if(main[j]){hit=j;break;}q[tl++]=j;}}
  if(hit<0){for(const i of r)t[i]=T.WALL;continue;}
  let c=prev[hit];while(c>=0){if(!TD[t[c]].pass)t[c]=fl;c=prev[c];}
 }
}
function blob(t,tile,n,onto){
 let x=ri(2,W-3),y=ri(2,H-3);
 for(let s=0;s<n;s++){const i=idx(x,y);if(onto.includes(t[i]))t[i]=tile;const d=pick(DIR4);x=clamp(x+d[0],1,W-2);y=clamp(y+d[1],1,H-2);}
}
function border(lv){for(let x=0;x<W;x++){lv.t[idx(x,0)]=T.WALL;lv.t[idx(x,H-1)]=T.WALL;}for(let y=0;y<H;y++){lv.t[idx(0,y)]=T.WALL;lv.t[idx(W-1,y)]=T.WALL;}}

// The Neighborhood: a street grid of lots. Most are walled houses with a hosh (courtyard),
// plus Friday-market rows, parking lots and a co-op.
function genCity(lv,z){
 const t=lv.t;t.fill(T.FLOOR);const lots=[];
 for(let y=2;y<H-6;){const bh=ri(6,8);if(y+bh>H-2)break;
  for(let x=2;x<W-8;){const bw=ri(10,16);if(x+bw>W-2)break;lots.push({x,y,w:bw,h:bh});x+=bw+ri(2,3);}
  y+=bh+2;}
 const rect=(l,edge,fill)=>{for(let y=l.y;y<l.y+l.h;y++)for(let x=l.x;x<l.x+l.w;x++){const e=x===l.x||y===l.y||x===l.x+l.w-1||y===l.y+l.h-1;t[idx(x,y)]=e?edge:fill;}};
 const door=(l,side)=>{const cx=l.x+(l.w>>1),cy=l.y+(l.h>>1);
  if(side===0)t[idx(cx,l.y)]=T.DOOR;else if(side===1)t[idx(cx,l.y+l.h-1)]=T.DOOR;else if(side===2)t[idx(l.x,cy)]=T.DOOR;else t[idx(l.x+l.w-1,cy)]=T.DOOR;};
 for(const l of lots){const r=rand();
  if(r<.58){rect(l,T.WALL,T.TILE);
   const hx0=l.x+2,hx1=l.x+l.w-3,hy0=l.y+2,hy1=l.y+l.h-3;
   if(hx1-hx0>=2&&hy1-hy0>=1){for(let y=hy0;y<=hy1;y++)for(let x=hx0;x<=hx1;x++)t[idx(x,y)]=chance(.8)?T.GRASS:T.TILE;
    t[idx((hx0+hx1)>>1,(hy0+hy1)>>1)]=T.PALM;}
   if(l.w>=13){const wx=l.x+3;for(let y=l.y+1;y<l.y+l.h-1;y++)t[idx(wx,y)]=T.WALL;t[idx(wx,l.y+(l.h>>1))]=T.DOOR;}
   door(l,ri(0,1));if(chance(.4))door(l,ri(2,3));}
  else if(r<.73){for(let y=l.y+1;y<l.y+l.h-1;y+=2)for(let x=l.x+1;x<l.x+l.w-1;x+=2)t[idx(x,y)]=T.STALL;}
  else if(r<.87){for(let y=l.y+1;y<l.y+l.h-1;y+=2)for(let x=l.x;x<l.x+l.w;x++)if((x-l.x)%4!==3)t[idx(x,y)]=T.CAR;}
  else{rect(l,T.WALL,T.TILE);for(let y=l.y+2;y<l.y+l.h-2;y+=2)for(let x=l.x+2;x<l.x+l.w-2;x++)if((x-l.x)%5!==0)t[idx(x,y)]=T.SHELF;door(l,0);door(l,1);}
 }
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=idx(x,y);if(t[i]!==T.FLOOR||!chance(.05))continue;
  const byWall=DIR4.some(([dx,dy])=>t[idx(x+dx,y+dy)]===T.WALL);const nearDoor=DIRS.some(([dx,dy])=>t[idx(x+dx,y+dy)]===T.DOOR);
  if(byWall&&!nearDoor)t[i]=T.CAR;}
}
// Shuwaikh: open yards with warehouses, rows of stacked containers, scrap and oil.
function genYard(lv,z){
 const t=lv.t;t.fill(T.FLOOR);
 const nw=ri(3,5);
 for(let k=0;k<nw;k++){const w=ri(10,18),h=ri(6,9),x0=ri(2,W-w-2),y0=ri(2,H-h-2);
  for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){const e=x===x0||y===y0||x===x0+w-1||y===y0+h-1;t[idx(x,y)]=e?T.WALL:T.FLOOR;}
  const gaps=ri(2,3);for(let g=0;g<gaps;g++){const s=ri(0,3);
   if(s<2){const gx=ri(x0+2,x0+w-4),gy=s===0?y0:y0+h-1;t[idx(gx,gy)]=T.FLOOR;t[idx(gx+1,gy)]=T.FLOOR;}
   else{const gy=ri(y0+2,y0+h-3),gx=s===2?x0:x0+w-1;t[idx(gx,gy)]=T.DOOR;}}
  for(let y=y0+2;y<y0+h-2;y++)for(let x=x0+2;x<x0+w-2;x++){const r=rand();if(r<.08)t[idx(x,y)]=T.SCRAP;else if(r<.12)t[idx(x,y)]=T.OIL;else if(r<.15)t[idx(x,y)]=T.CAR;}}
 const nc=ri(4,7);
 for(let k=0;k<nc;k++){const len=ri(4,9),x0=ri(2,W-len-2),y0=ri(2,H-4),rows=chance(.5)?2:1;
  for(let r=0;r<rows;r++)for(let x=x0;x<x0+len;x++){const i=idx(x,y0+r);if(t[i]===T.FLOOR)t[i]=T.CONT;}}
 for(let k=0;k<5;k++)blob(t,T.SCRAP,ri(4,10),[T.FLOOR]);
 for(let k=0;k<4;k++)blob(t,T.OIL,ri(5,14),[T.FLOOR]);
 for(let k=0;k<3;k++){const len=ri(6,14),x0=ri(2,W-len-2),y=ri(2,H-3);for(let x=x0;x<x0+len;x++)if(t[idx(x,y)]===T.FLOOR&&(x-x0)%7!==3)t[idx(x,y)]=T.FENCE;}
}
function genFarm(lv,z){
 const t=lv.t;t.fill(T.FLOOR);lv._pens=[];
 for(let k=0;k<12;k++)blob(t,T.GRASS,ri(20,60),[T.FLOOR]);
 for(let k=0;k<4;k++)blob(t,T.SAND,ri(10,30),[T.FLOOR]);
 const nd=ri(2,3);
 for(let k=0;k<nd;k++){
  if(chance(.6)){const y=ri(3,H-4),x0=ri(2,W>>1),len=ri(15,35);for(let x=x0;x<Math.min(W-2,x0+len);x++)if((x-x0)%9!==4)t[idx(x,y)]=T.WATER;}
  else{const x=ri(3,W-4),y0=ri(2,8),len=ri(8,18);for(let y=y0;y<Math.min(H-2,y0+len);y++)if((y-y0)%7!==3)t[idx(x,y)]=T.WATER;}
 }
 const ng=ri(3,5);
 for(let k=0;k<ng;k++){const w=ri(6,14),h=ri(3,7),x0=ri(2,W-w-2),y0=ri(2,H-h-2);
  for(let y=y0;y<y0+h;y+=2)for(let x=x0+((y-y0)%4?1:0);x<x0+w;x+=2)if(chance(.85))t[idx(x,y)]=T.PALM;}
 const nh=ri(1,2);
 for(let k=0;k<nh;k++){const w=ri(8,12),h=ri(5,7),x0=ri(2,W-w-2),y0=ri(2,H-h-2);
  for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){const edge=x===x0||y===y0||x===x0+w-1||y===y0+h-1;t[idx(x,y)]=edge?T.WALL:((y-y0)%2?T.GRASS:T.FLOOR);}
  const dx=x0+(w>>1);if(chance(.5)){t[idx(dx,y0)]=T.DOOR;t[idx(dx,y0-1)]=T.FLOOR;}else{t[idx(dx,y0+h-1)]=T.DOOR;t[idx(dx,y0+h)]=T.FLOOR;}}
 const np=ri(2,4);
 for(let k=0;k<np;k++){const w=ri(7,11),h=ri(5,7),x0=ri(2,W-w-2),y0=ri(2,H-h-2);
  for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){const edge=x===x0||y===y0||x===x0+w-1||y===y0+h-1;t[idx(x,y)]=edge?T.FENCE:(chance(.4)?T.GRASS:T.FLOOR);}
  const gx=x0+(w>>1);if(chance(.5)){t[idx(gx,y0)]=T.FLOOR;t[idx(gx,y0-1)]=T.FLOOR;}else{t[idx(gx,y0+h-1)]=T.FLOOR;t[idx(gx,y0+h)]=T.FLOOR;}
  lv._pens.push({x0,y0,w,h});}
}
function genCave(lv,z){
 const t=lv.t,fl=T.SAND;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)t[idx(x,y)]=(x===0||y===0||x===W-1||y===H-1||chance(z.fill))?T.WALL:fl;
 for(let it=0;it<5;it++){const n=new Uint8Array(t);
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){let c=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(t[idx(x+dx,y+dy)]===T.WALL)c++;n[idx(x,y)]=c>=5?T.WALL:fl;}
  t.set(n);}
 const regs=regions(t).sort((a,b)=>b.length-a.length);
 for(let k=1;k<regs.length;k++)for(const i of regs[k])t[i]=T.WALL;
 if(z.id===3){
  for(let k=0;k<5;k++)blob(t,T.DUNE,ri(15,35),[fl]);
  for(let k=0;k<8;k++)blob(t,T.GRASS,ri(10,30),[fl]);
  for(let i=0;i<N;i++)if(t[i]===fl&&chance(.04))t[i]=T.SHRUB;
  for(let c=0;c<3;c++){for(let a=0;a<80;a++){const cx=ri(3,W-4),cy=ri(3,H-4);let ok=true;
    for(let dy=-2;dy<=2&&ok;dy++)for(let dx=-2;dx<=2;dx++)if(!FLOORLIKE.has(t[idx(cx+dx,cy+dy)])){ok=false;break;}
    if(!ok)continue;t[idx(cx-1,cy-1)]=T.TENT;if(chance(.7))t[idx(cx+1,cy-1)]=T.TENT;if(chance(.6))t[idx(cx,cy+1)]=T.TENT;break;}}
 }else{
  for(let k=0;k<12;k++)blob(t,T.DUNE,ri(30,80),[fl]);
  for(let i=0;i<N;i++)if(t[i]===fl&&chance(.02))t[i]=T.SHRUB;
  for(let k=0;k<5;k++)blob(t,T.SABKHA,ri(15,40),[fl,T.DUNE]);
  for(let k=0;k<2;k++)blob(t,T.OIL,ri(5,10),[fl]);
 }
}
function bfsT(t,goals,passFn){
 const d=new Int16Array(N).fill(32767);const q=new Int32Array(N);let h=0,tl=0;
 for(const g of goals)if(d[g]!==0){d[g]=0;q[tl++]=g;}
 while(h<tl){const i=q[h++];const x=i%W,y=(i/W)|0;const nd=d[i]+1;
  for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(!inb(nx,ny))continue;const j=idx(nx,ny);if(d[j]<=nd)continue;if(!passFn(j))continue;if(dx&&dy&&diagBlockedT(t,x,y,nx,ny))continue;d[j]=nd;q[tl++]=j;}}
 return d;
}
function diagBlockedT(t,x0,y0,x1,y1){
 if(x0===x1||y0===y1)return false;
 const a=TD[t[idx(x1,y0)]],b=TD[t[idx(x0,y1)]];
 if(a.wall||b.wall)return true;
 if(TD[t[idx(x0,y0)]].door||TD[t[idx(x1,y1)]].door)return true;
 return false;
}
// Stairs go in open spots, never in a one-tile gap: stepping on them changes depth,
// so a staircase in a chokepoint would cut off the rest of the level.
function placeStairs(lv,depth){
 const t=lv.t;const all=[];for(let i=0;i<N;i++)if(FLOORLIKE.has(t[i]))all.push(i);
 const open=i=>{const x=i%W,y=(i/W)|0;let n=0;for(const[dx,dy]of DIRS)if(TD[t[idx(x+dx,y+dy)]].pass)n++;return n;};
 const c=all.filter(i=>open(i)>=7);const pool=c.length>10?c:all;
 const cutsOff=(stairs)=>{const start=all.find(i=>!stairs.includes(i));const d=bfsT(t,[start],i=>TD[t[i]].pass&&!stairs.includes(i));return all.some(i=>!stairs.includes(i)&&d[i]>=32767);};
 for(let attempt=0;attempt<40;attempt++){
  const u=pick(pool);let dn=-1;
  if(depth<MAXD){const d=bfsT(t,[u],i=>TD[t[i]].pass);let mx=0;for(const i of pool)if(d[i]<32767&&d[i]>mx)mx=d[i];
   const far=pool.filter(i=>d[i]<32767&&d[i]>=mx*.8&&i!==u);dn=pick(far.length?far:pool.filter(i=>i!==u));}
  if(attempt<39&&cutsOff(dn>=0?[u,dn]:[u]))continue;
  t[u]=depth===1?T.HOME:T.UP;lv.up=[u%W,(u/W)|0];
  if(dn>=0){t[dn]=T.DOWN;lv.down=[dn%W,(dn/W)|0];}
  return;
 }
}
function vaultOffers(depth){
 const mk=k=>makeItem(k);
 const opts=[
  ()=>{const it=mk(wpick(catWeights('tool')));it.ench=ri(2,3);it.known=true;if(chance(.6))it.rn=pick(runesFor('tool'));return it;},
  ()=>{const it=mk(wpick(catWeights('outfit')));it.ench=ri(2,3);it.known=true;if(chance(.6))it.rn=pick(runesFor('outfit'));return it;},
  ()=>{const it=mk(wpick(catWeights('gadget')));it.pw=2;it.mx+=1;it.c=it.mx;return it;},
  ()=>{const it=mk(wpick(catWeights('acc')));it.pw=ri(2,3);return it;},
  ()=>{const it=mk(wpick(catWeights('charm')));it.pw=2;return it;},
  ()=>moneyItem(Math.round(Math.pow(depth,1.5)*110)),
  ()=>{const it=mk('course');it.q=2;return it;}
 ];
 return shuffle(opts).slice(0,3).map(f=>f());
}
function stampVault(lv,depth,z){
 const t=lv.t,fl=floorOf(z);
 for(let a=0;a<600;a++){
  const x0=ri(2,W-9),y0=ri(2,H-7);let ok=true;
  const want=a<300?(v=>FLOORLIKE.has(v)):(v=>v===T.WALL);
  for(let y=y0-1;y<=y0+5&&ok;y++)for(let x=x0-1;x<=x0+7;x++)if(!want(t[idx(x,y)])){ok=false;break;}
  if(!ok)continue;
  for(let y=y0;y<y0+5;y++)for(let x=x0;x<x0+7;x++){const edge=x===x0||y===y0||x===x0+6||y===y0+4;t[idx(x,y)]=edge?T.WALL:fl;}
  const doorY=chance(.5)?y0:y0+4;t[idx(x0+3,doorY)]=T.DOOR;
  // A deal room carved into solid rock gets a straight passage out of its door.
  if(a>=300){const dir=doorY===y0?-1:1;for(let y=doorY+dir;y>0&&y<H-1;y+=dir){const i=idx(x0+3,y);if(TD[t[i]].pass)break;t[i]=fl;}}
  const gid=G.nextId++;const offers=vaultOffers(depth);
  [[x0+1,y0+2],[x0+3,y0+2],[x0+5,y0+2]].forEach(([px,py],k)=>{t[idx(px,py)]=T.PED;const it=offers[k];it.x=px;it.y=py;it.vault=gid;lv.items.push(it);});
  lv.vaultRect=[x0,y0];return;
 }
}
function makeMon(k,x,y,depth){
 const t=MT[k];const sc=1+.035*Math.max(0,depth-(SPAWN.find(s=>s[0]===k)||[0,depth])[1]);
 const hp=Math.max(1,Math.round(t.hp*sc));
 let state='sleep';
 if(t.kind==='livestock'||t.kind==='critter')state='neutral';
 else if(t.kind==='captive')state='captive';
 else if(t.kind==='summon')state='ally';
 else if(t.kind==='npc')state='npc';
 else state=t.ambush?(chance(.9)?'sleep':'wander'):(chance(.55)?'sleep':'wander');
 return{id:G.nextId++,k,x,y,hp,maxHp:hp,state,next:P?P.next:0,stun:0,fear:0,carry:0,food:0,lost:0,timer:0};
}
function nearFree(lv,i,maxR,taken){
 const d=bfsT(lv.t,[i],j=>TD[lv.t[j]].pass);const out=[];
 for(let j=0;j<N;j++)if(d[j]>0&&d[j]<=maxR&&TD[lv.t[j]].pass&&lv.t[j]!==T.DOWN&&lv.t[j]!==T.UP&&lv.t[j]!==T.HOME&&!taken.has(j))out.push(j);
 return shuffle(out);
}
function addGroup(lv,k,i,depth,stateOverride){
 const t=MT[k];const taken=new Set(lv.mons.map(m=>idx(m.x,m.y)));
 const n=t.pack?ri(t.pack[0],t.pack[1]):1;const spots=[i,...nearFree(lv,i,3,taken)];
 const st=null;let first=null;
 for(let c=0;c<n&&c<spots.length;c++){const s=spots[c];if(taken.has(s))continue;const m=makeMon(k,s%W,(s/W)|0,depth);
  if(first&&m.state!=='neutral')m.state=first.state;if(stateOverride)m.state=stateOverride;if(!first)first=m;lv.mons.push(m);taken.add(s);}
 return first;
}
function pickSpawn(depth){const c=SPAWN.filter(s=>depth>=s[1]&&depth<=s[2]).map(s=>[s[0],s[3]]);return wpick(c);}
function populate(lv,depth,z){
 const t=lv.t;const ui=idx(...lv.up);
 const dUp=bfsT(t,[ui],i=>TD[t[i]].pass);
 const spots=[];for(let i=0;i<N;i++)if(FLOORLIKE.has(t[i])&&dUp[i]<32767)spots.push(i);
 const usedI=new Set(lv.items.map(it=>idx(it.x,it.y)));
 const freeSpot=(minD=0)=>{for(let a=0;a<300;a++){const i=pick(spots);if(usedI.has(i)||dUp[i]<minD)continue;usedI.add(i);return i;}return pick(spots);};
 const put=it=>{const i=freeSpot(2);it.x=i%W;it.y=(i/W)|0;lv.items.push(it);};
 const nm=ri(2,4);
 for(let k=0;k<nm;k++)put(moneyItem(Math.round(ri(26,56)*Math.pow(depth,1.45))));
 const keys=['course'];const n=ri(3,5)+(depth<=2?2:0);
 for(let k=0;k<n;k++)keys.push(randomItemKey());
 if(chance(.85))keys.push(chance(.55)?'water':'dates');
 if(zoneOf(depth).heat>1.3&&chance(.6))keys.push('water');
 G.lifeDebt+=.26;if(rand()<G.lifeDebt){keys.push('machboos');G.lifeDebt-=1;}
 G.strDebt+=.3;if(rand()<G.strDebt){keys.push('protein');G.strDebt-=1;}
 if(z.id===2||z.id===3)keys.push('dates','dates');
 if(depth===3||depth===14)keys.push('dogtreats');
 for(const k of keys)put(makeItem(k));
 const groups=3+Math.floor(depth/4)+ri(0,2);
 for(let g=0;g<groups;g++){const k=pickSpawn(depth);let i=-1;for(let a=0;a<200;a++){const c=pick(spots);if(dUp[c]>9){i=c;break;}}if(i<0)continue;addGroup(lv,k,i,depth);}
 const taken=()=>new Set(lv.mons.map(m=>idx(m.x,m.y)));
 if(z.id===2){
  for(const p of lv._pens||[]){const c=ri(2,4);for(let k=0;k<c;k++){const x=ri(p.x0+1,p.x0+p.w-2),y=ri(p.y0+1,p.y0+p.h-2);const i=idx(x,y);if(TD[t[i]].pass&&!taken().has(i))lv.mons.push(makeMon(chance(.6)?'sheep':'goat',x,y,depth));}}
  for(let k=0;k<ri(1,3);k++){const i=pick(spots);if(!taken().has(i))lv.mons.push(makeMon('goat',i%W,(i/W)|0,depth));}
 }else if(z.id===3){
  for(let h=0;h<2;h++){const i=pick(spots);const tk=taken();const near=[i,...nearFree(lv,i,3,tk)];let c=0;
   const herd=[...Array(ri(1,2)).fill('camel'),...Array(ri(1,3)).fill('sheep')];
   for(const k of herd){const s=near[c++];if(s===undefined)break;lv.mons.push(makeMon(k,s%W,(s/W)|0,depth));}}
 }else if(z.id===4&&chance(.6)){const i=pick(spots);if(!taken().has(i))lv.mons.push(makeMon('camel',i%W,(i/W)|0,depth));}
 if(depth>=4&&chance(.2)){const k=depth>=12&&chance(.5)?'falcon':'saluki';let i=-1;for(let a=0;a<100;a++){const c=pick(spots);if(dUp[c]>15&&!taken().has(c)){i=c;break;}}
  if(i>=0)lv.mons.push(makeMon(k,i%W,(i/W)|0,depth));}
}
function genLevel(depth){
 const prev=curRng;curRng=mix32((Math.imul(G.seed,2654435761)^Math.imul(depth,40503))>>>0);
 const z=zoneOf(depth);
 const lv={depth,t:new Uint8Array(N),known:new Uint8Array(N),fire:new Uint8Array(N),dust:new Float32Array(N),items:[],mons:[],up:null,down:null};
 if(z.gen==='city')genCity(lv,z);else if(z.gen==='yard')genYard(lv,z);else if(z.gen==='farm')genFarm(lv,z);else genCave(lv,z);
 border(lv);connect(lv,z);
 placeStairs(lv,depth);
 if(depth>=2&&chance(.45))stampVault(lv,depth,z);
 connect(lv,z);
 if(HUBS[depth]){const s=nearFree(lv,idx(...lv.up),1,new Set())[0]??nearFree(lv,idx(...lv.up),3,new Set())[0];
  if(s!==undefined){const m=makeMon('trader',s%W,(s/W)|0,depth);m.title=HUBS[depth];lv.mons.push(m);}}
 populate(lv,depth,z);
 delete lv._pens;
 curRng=prev;return lv;
}


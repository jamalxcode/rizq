// Rizq: Drawing the map on the canvas.
// Loaded as a classic script, in order, from index.html. All files share one global scope.
'use strict';
// ================= RENDER =================
const cv=$('#cv'),ctx=cv.getContext('2d');
const view={cw:12,ch:19,cols:W,rows:H,camX:0,camY:0,dpr:1,zoom:1};
try{view.zoom=clamp(+localStorage.getItem('rizq-zoom')||1,.7,2);}catch(e){}
let hoverCell=null;
function setZoom(z){view.zoom=clamp(Math.round(z*10)/10,.7,2);try{localStorage.setItem('rizq-zoom',view.zoom);}catch(e){}resize();}
function resize(){
 const wrap=$('#wrap');const aw=wrap.clientWidth-32,ah=wrap.clientHeight-16;if(aw<=0||ah<=0)return;
 let cw=Math.floor(aw/W),ch=Math.round(cw*1.62);
 if(ch*H>ah){ch=Math.floor(ah/H);cw=Math.floor(ch/1.62);}
 if(cw<10){cw=clamp(Math.floor(aw/32),11,16);}
 // Zooming in past "whole map fits" switches to a camera that follows you.
 cw=Math.max(7,Math.round(cw*view.zoom));ch=Math.round(cw*1.62);
 view.cw=cw;view.ch=ch;view.cols=Math.min(W,Math.floor(aw/cw));view.rows=Math.min(H,Math.floor(ah/ch));
 view.dpr=window.devicePixelRatio||1;
 cv.width=Math.round(view.cols*cw*view.dpr);cv.height=Math.round(view.rows*ch*view.dpr);
 cv.style.width=view.cols*cw+'px';cv.style.height=view.rows*ch+'px';
 render();
}
function lerpC(a,b,t){return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
function scaleC(a,f){return[a[0]*f,a[1]*f,a[2]*f];}
function tileColors(x,y,i,now){
 const tt=L.t[i];const d=TD[tt];const z=zoneOf(G.depth);
 let fg,bg,ch=d.ch;
 if(tt===T.WALL){fg=z.wall.fg;bg=z.wall.bg;}
 else if(tt===T.FLOOR||tt===T.SAND){fg=z.floor.fg;bg=z.floor.bg;}
 else{fg=d.fg;bg=d.bg;}
 if(tt===T.CAR)fg=CAR_COLS[Math.floor(hash(x,y,G.depth)*CAR_COLS.length)];
 if(tt===T.CONT){const c=CONT_COLS[Math.floor(hash((x/5)|0,y,G.depth+9)*CONT_COLS.length)];fg=c;bg=scaleC(c,.35);}
 const v=(hash(x,y,G.depth*7+1)-.5)*22,v2=(hash(y,x,G.depth*3+5)-.5)*14;
 fg=[fg[0]+v,fg[1]+v,fg[2]+v];bg=[bg[0]+v2,bg[1]+v2,bg[2]+v2*.6];
 if(d.water||tt===T.OIL){const s=Math.sin(now/420+x*.7+y*1.3)*14;fg=[fg[0]+s,fg[1]+s,fg[2]+s];bg=[bg[0],bg[1]+s*.4,bg[2]+s*.7];}
 if(tt===T.DOOR&&(monAt(x,y)||(P.x===x&&P.y===y)))ch="'";
 if(L.fire[i]){const r=Math.random();fg=[255,120+r*110,30];bg=[150+r*60,40+r*30,10];ch='^';}
 const du=L.dust[i];if(du>1){const t=Math.min(.85,du/45);bg=lerpC(bg,[176,146,100],t);fg=lerpC(fg,[216,190,140],t*.7);if(du>=25&&!L.fire[i])ch='░';}
 return{fg,bg,ch};
}
function render(){
 if(!G||!L)return;
 const{cw,ch,cols,rows,dpr}=view;
 view.camX=clamp(P.x-(cols>>1),0,W-cols);view.camY=clamp(P.y-(rows>>1),0,H-rows);
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.fillStyle='#0b0907';ctx.fillRect(0,0,cols*cw,rows*ch);
 ctx.font=`600 ${Math.round(ch*.74)}px "IBM Plex Mono",Consolas,monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
 const now=performance.now();const r=visRadius();
 const mg=new Map();for(const m of L.mons)mg.set(idx(m.x,m.y),m);
 const ig=new Map();for(const it of L.items)ig.set(idx(it.x,it.y),it);
 let glow=null;
 for(let i=0;i<N;i++)if(L.fire[i]&&vis[i]){if(!glow)glow=new Float32Array(N);const fx=i%W,fy=(i/W)|0;
  for(let y=fy-3;y<=fy+3;y++)for(let x=fx-3;x<=fx+3;x++){if(!inb(x,y))continue;const dd=Math.hypot(x-fx,y-fy);if(dd<=3.2)glow[idx(x,y)]+=(1-dd/3.4)*.6;}}
 let tpath=null;
 if(targ){tpath=new Set(boltPath(P.x,P.y,targ.x,targ.y,targ.range).map(p=>idx(p[0],p[1])));}
 const tele=P.st.tele>0;
 for(let vy=0;vy<rows;vy++)for(let vx=0;vx<cols;vx++){
  const x=view.camX+vx,y=view.camY+vy,i=idx(x,y);const px=vx*cw,py=vy*ch;
  const seen=vis[i],known=L.known[i];
  const mon=mg.get(i);
  if(!known&&!(tele&&mon))continue;
  let c=known?tileColors(x,y,i,now):{fg:[0,0,0],bg:[0,0,0],ch:' '};
  let fg=c.fg,bg=c.bg,g=c.ch;
  if(seen){
   const dd=Math.hypot(x-P.x,y-P.y);const f=1-.5*Math.min(1,Math.pow(dd/(r+.5),2));
   fg=scaleC(fg,f);bg=scaleC(bg,f);
   if(glow&&glow[i]){const gg=Math.min(1,glow[i]);bg=[bg[0]+90*gg,bg[1]+40*gg,bg[2]+5*gg];fg=[fg[0]+60*gg,fg[1]+30*gg,fg[2]];}
  }else if(known){
   const gr=(fg[0]+fg[1]+fg[2])/3,gb=(bg[0]+bg[1]+bg[2])/3;
   fg=[gr*.30+fg[0]*.08,gr*.32+fg[1]*.08,gr*.42+fg[2]*.08];bg=[gb*.22,gb*.24,gb*.34];
  }
  const it=ig.get(i);
  if(x===P.x&&y===P.y){g='@';fg=[255,236,190];}
  else if(mon&&((seen&&canSee(mon))||tele)){const t=MT[mon.k];g=t.ch;fg=seen?t.col:[180,140,220];
   if(seen&&mon.state==='ally')bg=lerpC(bg,[40,90,60],.5);else if(seen&&mon.state==='herd')bg=lerpC(bg,[100,80,30],.5);else if(seen&&mon.state==='captive')bg=lerpC(bg,[60,60,110],.6);
   if(mon.stun>0&&seen)fg=lerpC(fg,[255,255,200],.5+.3*Math.sin(now/120));}
  else if(mon&&seen&&MT[mon.k].hidden&&cheb(x,y,P.x,P.y)<=6){g='∴';fg=lerpC(fg,[236,214,160],.55);}
  else if(it&&(seen||it.seen)){g=itemCh(it);fg=seen?itemCol(it):scaleC(itemCol(it),.4);}
  if(tpath&&tpath.has(i)){bg=lerpC(bg,[210,170,60],(x===targ.x&&y===targ.y)?.7:.35);}
  ctx.fillStyle=rgb(bg);ctx.fillRect(px,py,cw,ch);
  if(g!==' '&&g!=='·'){ctx.fillStyle=rgb(fg);ctx.fillText(g,px+cw/2,py+ch/2+1);}
  else if(g==='·'){ctx.fillStyle=rgb(fg);ctx.fillRect(px+cw/2-1,py+ch/2-1,2,2);}
 }
 for(const f of fx){if(now<f.t0)continue;const a=Math.max(0,1-(now-f.t0)/f.dur);const vx=f.x-view.camX,vy=f.y-view.camY;if(vx<0||vy<0||vx>=cols||vy>=rows)continue;
  ctx.fillStyle=`rgba(${f.col[0]},${f.col[1]},${f.col[2]},${(a*.55).toFixed(3)})`;ctx.fillRect(vx*cw,vy*ch,cw,ch);}
 if(hoverCell){const vx=hoverCell[0]-view.camX,vy=hoverCell[1]-view.camY;if(vx>=0&&vy>=0&&vx<cols&&vy<rows){ctx.strokeStyle='rgba(220,170,79,.8)';ctx.lineWidth=1;ctx.strokeRect(vx*cw+.5,vy*ch+.5,cw-1,ch-1);}}
}
setInterval(()=>{if(!G||!L)return;let anim=false;for(let i=0;i<N;i++){if(vis[i]&&(L.fire[i]||TD[L.t[i]].water||L.t[i]===T.OIL||L.dust[i]>1)){anim=true;break;}}if(anim||L.mons.some(m=>m.stun>0))render();},140);


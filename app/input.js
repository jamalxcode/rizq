// Rizq: Keyboard, mouse and touch input, the title screen, and boot.
// Loaded as a classic script, in order, from index.html. All files share one global scope.
'use strict';
// ================= INPUT =================
const KEYDIR={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],k:[0,-1],j:[0,1],h:[-1,0],l:[1,0],y:[-1,-1],u:[1,-1],b:[-1,1],n:[1,1],Home:[-1,-1],PageUp:[1,-1],End:[-1,1],PageDown:[1,1]};
const NUMDIR={Numpad8:[0,-1],Numpad2:[0,1],Numpad4:[-1,0],Numpad6:[1,0],Numpad7:[-1,-1],Numpad9:[1,-1],Numpad1:[-1,1],Numpad3:[1,1],Numpad5:[0,0]};
function act(fn){if(!G||G.over||!$('#title').hidden)return;fn();updateUI();render();}
document.addEventListener('keydown',e=>{
 if(e.target&&e.target.tagName==='INPUT')return;
 if(!$('#title').hidden){if(e.key==='Enter'){e.preventDefault();startNew();}return;}
 if(!$('#help').hidden){if(e.key==='Escape'||e.key==='Enter'||e.key==='?'){$('#help').hidden=true;e.preventDefault();}return;}
 if(!$('#end').hidden){if(e.key==='Enter'){startNew();}return;}
 if(!$('#shop').hidden){if(e.key==='Escape'){closeShop();e.preventDefault();}return;}
 if(invState){
  if(e.key==='Escape'){closeInv();e.preventDefault();return;}
  if(e.key==='Enter'&&invState.sel){const it=P.inv.find(o=>o.id===invState.sel);if(it&&primaryLabel(it)){closeInv();useItem(it);updateUI();render();}e.preventDefault();return;}
  if(e.key==='d'&&invState.sel&&invState.mode==='browse'){const it=P.inv.find(o=>o.id===invState.sel);if(it){closeInv();dropItem(it);}return;}
  if(/^[a-z]$/.test(e.key)){const it=P.inv.find(o=>o.letter===e.key&&(!invState.filter||invState.filter(o)));if(it)invPick(it);}
  return;
 }
 if(targ){
  e.preventDefault();
  if(e.key==='Escape'){endTarget();return;}
  if(e.key==='Enter'||e.key==='t'||e.key==='f'){confirmTarget(targ.x,targ.y);return;}
  if(e.key==='Tab'){if(targ.cands.length){targ.i=(targ.i+1)%targ.cands.length;targ.x=targ.cands[targ.i].x;targ.y=targ.cands[targ.i].y;render();}return;}
  const d=NUMDIR[e.code]||KEYDIR[e.key];if(d){targ.x=clamp(targ.x+d[0],0,W-1);targ.y=clamp(targ.y+d[1],0,H-1);render();}
  return;
 }
 if(auto){stopAuto();e.preventDefault();return;}
 if(G&&G.over)return;
 const d=NUMDIR[e.code]||KEYDIR[e.key];
 if(d){e.preventDefault();hoverCell=null;act(()=>playerMove(d[0],d[1]));return;}
 switch(e.key){
  case 'x':act(()=>startAuto('explore'));break;
  case '>':act(()=>travelStairs(1));break;
  case '<':act(()=>travelStairs(-1));break;
  case 'z':case '.':case 's':act(rest);break;
  case 'Z':act(()=>startAuto('rest'));break;
  case 'i':e.preventDefault();openInv();break;
  case 'g':case ',':act(()=>{pickupHere(true);endTurn(100);});break;
  case 't':{const th=P.inv.filter(o=>['pebbles','drink'].includes(IT[o.k].cat)||['dogtreats','firecrackers'].includes(o.k));const go=o=>IT[o.k].cat==='drink'?throwDrink(o):useItem(o);
   if(!th.length){msg('You have nothing to throw.');updateUI();}else if(th.length===1){go(th[0]);}else openInv({mode:'select',title:'Throw what?',filter:o=>th.includes(o),onPick:go});break;}
  case 'f':act(toggleHerd);break;
  case '-':setZoom(view.zoom-.1);break;
  case '=':case '+':setZoom(view.zoom+.1);break;
  case 'm':toggleSound();break;
  case '?':$('#help').hidden=false;break;
  case 'Escape':hoverCell=null;updateHover();render();break;
 }
});
function toggleHerd(){
 G.herdStay=!G.herdStay;const n=L.mons.filter(m=>m.state==='herd').length;
 msg(G.herdStay?`You tell your herd to stay here.${n?'':' (You don’t have one yet.)'} They won’t follow you, and they only count toward your net worth while you’re with them.`:'You whistle. Your herd follows you again.');
}
function toggleSound(){SND.on=!SND.on;try{localStorage.setItem('rizq-sound',SND.on?'on':'off');}catch(e){}const b=$('#sndBtn');b.textContent=SND.on?'Sound on':'Sound off';b.setAttribute('aria-pressed',String(SND.on));if(SND.on)sfx('coin');}
$('#sndBtn').onclick=toggleSound;
function cellFromEvent(e){const r=cv.getBoundingClientRect();const x=Math.floor((e.clientX-r.left)/view.cw)+view.camX,y=Math.floor((e.clientY-r.top)/view.ch)+view.camY;return inb(x,y)?[x,y]:null;}
function tapCell(c){
 if(!c||!G||G.over)return;
 if(targ){confirmTarget(c[0],c[1]);return;}
 if(auto){stopAuto();return;}
 const[x,y]=c;
 if(x===P.x&&y===P.y){act(()=>{if(L.items.some(o=>o.x===x&&o.y===y)){pickupHere(true);endTurn(100);}else rest();});return;}
 if(cheb(x,y,P.x,P.y)===1){hoverCell=null;act(()=>playerMove(x-P.x,y-P.y));return;}
 if(!L.known[idx(x,y)]){msg('You don’t know how to get there yet.');updateUI();return;}
 hoverCell=null;act(()=>startAuto('travel',[x,y]));
}
cv.addEventListener('mousemove',e=>{if(e.pointerType==='touch')return;const c=cellFromEvent(e);if(!c||!G)return;if(targ){targ.x=c[0];targ.y=c[1];}if(!hoverCell||c[0]!==hoverCell[0]||c[1]!==hoverCell[1]){hoverCell=c;updateHover();render();}});
cv.addEventListener('mouseleave',()=>{hoverCell=null;if(G){updateHover();render();}});
// Touch: tap to walk or attack, swipe to step, press and hold to inspect.
let touch=null,lastTouch=0;
cv.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||!G)return;
 touch={x:e.clientX,y:e.clientY,c:cellFromEvent(e),held:false};
 touch.timer=setTimeout(()=>{if(touch){touch.held=true;hoverCell=touch.c;updateHover();render();}},450);});
cv.addEventListener('pointerup',e=>{if(e.pointerType!=='touch'||!touch)return;lastTouch=Date.now();clearTimeout(touch.timer);
 const t=touch;touch=null;if(t.held)return;
 const dx=e.clientX-t.x,dy=e.clientY-t.y,dist=Math.hypot(dx,dy);
 if(dist>28&&!targ){const a=Math.round(Math.atan2(dy,dx)/(Math.PI/4));const dirs={0:[1,0],1:[1,1],2:[0,1],3:[-1,1],4:[-1,0],'-4':[-1,0],'-3':[-1,-1],'-2':[0,-1],'-1':[1,-1]};
  const d=dirs[a];if(d){if(auto){stopAuto();return;}hoverCell=null;act(()=>playerMove(d[0],d[1]));}return;}
 tapCell(t.c);});
cv.addEventListener('pointercancel',()=>{if(touch)clearTimeout(touch.timer);touch=null;});
cv.addEventListener('click',e=>{if(Date.now()-lastTouch<700)return;tapCell(cellFromEvent(e));});
document.querySelectorAll('#pad [data-d]').forEach(b=>b.addEventListener('click',()=>{if(targ){const[dx,dy]=b.dataset.d.split(',').map(Number);targ.x=clamp(targ.x+dx,0,W-1);targ.y=clamp(targ.y+dy,0,H-1);render();return;}if(auto){stopAuto();return;}const[dx,dy]=b.dataset.d.split(',').map(Number);hoverCell=null;act(()=>playerMove(dx,dy));}));
document.querySelectorAll('#pad [data-a]').forEach(b=>b.addEventListener('click',()=>{
 if(auto){stopAuto();return;}
 const a=b.dataset.a;
 if(a==='explore')act(()=>startAuto('explore'));
 else if(a==='down')act(()=>travelStairs(1));
 else if(a==='up')act(()=>travelStairs(-1));
 else if(a==='bag')openInv();
 else if(a==='rest')act(()=>startAuto('rest'));
 else if(a==='herd')act(toggleHerd);
 else if(a==='zoomin')setZoom(view.zoom+.1);
 else if(a==='zoomout')setZoom(view.zoom-.1);
 else if(a==='help')$('#help').hidden=false;
}));
$('#bannerCancel').onclick=()=>{if(targ)confirmTargetCancel();};
function confirmTargetCancel(){endTarget();}
$('#invClose').onclick=closeInv;
$('#helpClose').onclick=()=>{$('#help').hidden=true;};
$('#btnHelp').onclick=()=>{$('#help').hidden=false;};
$('#endNew').onclick=()=>{$('#end').hidden=true;$('#title').hidden=false;$('#btnCont').hidden=!hasSave();showDailyBest();};
function startNew(){
 const sv=$('#seedIn').value.trim();const seed=sv&&/^\d+$/.test(sv)?(+sv>>>0):(Math.random()*4294967295)>>>0;
 $('#title').hidden=true;$('#end').hidden=true;newGame(seed);resize();save();
}
// Daily run: the seed comes from today's date, so everyone gets the same map.
// The daily map follows the UTC date, so everyone gets the same map at the same moment wherever they are.
function todayKey(){return new Date().toISOString().slice(0,10);}
function dailySeed(key){let h=2166136261;for(const ch of key){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function dailyBest(key){try{return+localStorage.getItem('rizq-daily-'+key)||0;}catch(e){return 0;}}
function showDailyBest(){const k=todayKey(),b=dailyBest(k);$('#dailyTxt').textContent=`Daily run (${k}): everyone gets the same map today.${b?` Your best today: ${fmt(b)} KD.`:''}`;}
function startDaily(){const k=todayKey();$('#title').hidden=true;$('#end').hidden=true;newGame(dailySeed(k),k);resize();save();msg(`Daily run for ${k} (UTC). Everyone playing today starts on this same map, though the animals won’t act the same way twice.`,'gold');updateUI();}
$('#btnNew').onclick=startNew;
$('#btnDaily').onclick=startDaily;
$('#btnCont').onclick=()=>{try{deserialize(localStorage.getItem('rizq-save'));$('#title').hidden=true;afterTurn(true);resize();msg('Welcome back. The hustle continues.');updateUI();}
 catch(e){$('#btnCont').hidden=true;$('#dailyTxt').textContent=`Couldn’t load your saved run (${e.message}). Start a new one.`;}};
window.addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});

// ================= BOOT =================
function boot(data){
 $('#btnCont').hidden=!hasSave();showDailyBest();
 $('#sndBtn').textContent=SND.on?'Sound on':'Sound off';$('#sndBtn').setAttribute('aria-pressed',String(SND.on));
 if(data&&data.save){try{deserialize(data.save);$('#title').hidden=true;afterTurn(true);resize();return;}catch(e){}}
 resize();
}
try{window.claude?.hot?.snapshot?.(()=>(G&&!G.over?{save:serialize()}:{}));}catch(e){}
if(document.fonts&&document.fonts.addEventListener)document.fonts.addEventListener('loadingdone',()=>render());
// Start only after the title screen has painted, so a slow device never sees a blank, frozen page.
const startBoot=()=>{window.claude?.hot?.ready?window.claude.hot.ready(boot):boot(window.claude?.hot?.data??{});};
requestAnimationFrame(()=>setTimeout(startBoot,0));

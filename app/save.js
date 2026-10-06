// Rizq: Saving and loading runs in browser storage.
// Loaded as a classic script, in order, from index.html. All files share one global scope.
'use strict';
// ================= SAVE / LOAD =================
const enc=a=>{let s='';for(let i=0;i<a.length;i++)s+=String.fromCharCode(48+a[i]);return s;};
const dec=s=>{const a=new Uint8Array(N);for(let i=0;i<N;i++)a[i]=s.charCodeAt(i)-48;return a;};
function serialize(){
 const lv={};for(const d in G.levels){const l=G.levels[d];lv[d]=Object.assign({},l,{t:enc(l.t),known:enc(l.known),fire:enc(l.fire),dust:null});}
 return JSON.stringify({G:Object.assign({},G,{levels:lv}),P});
}
const SAVE_VERSION=3;
function deserialize(s){
 const o=JSON.parse(s);
 if(!o||!o.G||!o.P)throw new Error('Not a Rizq save');
 if((o.G.v||1)>SAVE_VERSION)throw new Error('This save comes from a newer version of Rizq');
 G=o.G;P=o.P;G.v=SAVE_VERSION;
 for(const d in G.levels){const l=G.levels[d];l.t=dec(l.t);l.known=dec(l.known);l.fire=dec(l.fire);l.dust=new Float32Array(N);}
 // Older saves carried sacks of barley; dates replaced them as livestock feed.
 const toDates=it=>{if(it.k==='barley'){it.k='dates';it.q=Math.max(1,it.c||1);delete it.c;}};
 for(const d in G.levels)G.levels[d].items.forEach(toDates);
 P.inv.forEach(toDates);
 const ds=P.inv.filter(i=>i.k==='dates');if(ds.length>1){ds[0].q=ds.reduce((s,i)=>s+i.q,0);P.inv=P.inv.filter(i=>i.k!=='dates'||i===ds[0]);}
 if(G.bank===undefined)G.bank=0;if(G.herdStay===undefined)G.herdStay=false;
 L=G.levels[G.depth];curRng=gameRng;wanderCache.clear();pathCache.clear();auto=null;targ=null;
}
// Saving can fail when browser storage is full or blocked (private windows, strict settings). Say so instead of failing silently.
function save(){
 if(!G||G.over||SIM)return;
 try{localStorage.setItem('rizq-save',serialize());if(G.saveFailed){G.saveFailed=false;msg('Saving works again.','good');}}
 catch(e){if(!G.saveFailed){G.saveFailed=true;msg('This run can’t be saved: your browser’s storage is full or blocked. Finish it in one sitting.','bad');updateUI();}}
}
function hasSave(){try{return!!localStorage.getItem('rizq-save');}catch(e){return false;}}


// Rizq: Sidebar, inspect text, the bag, the trader and the end screen.
// Loaded as a classic script, in order, from index.html. All files share one global scope.
'use strict';
// ================= UI =================
function stateLabel(m){return{npc:'trading',sleep:'asleep',wander:'wandering',hunt:'hunting you',flee:'fleeing',ally:'your friend',herd:'your herd',captive:'tied up',neutral:MT[m.k].kind==='livestock'?'grazing':'minding its business'}[m.state]||'';}
function updateUI(){
 if(!G)return;
 $('#hpTxt').textContent=`${P.hp} / ${P.maxHp}`;
 const hf=P.hp/P.maxHp;const hb=$('#hpBar');hb.style.width=(hf*100)+'%';hb.style.background=hf<.3?'var(--bad)':hf<.6?'var(--warn)':'var(--good)';
 const tf=P.thirst/THIRST_MAX;$('#thBar').style.width=(tf*100)+'%';$('#thBar').style.background=P.thirst<=150?'var(--bad)':P.thirst<=300?'var(--warn)':'var(--sea)';
 $('#thTxt').textContent=P.thirst<=50?'Dehydrated':P.thirst<=150?'Parched':P.thirst<=300?'Thirsty':'Fine';
 const nw=netWorth();$('#nwTxt').textContent=`${fmt(nw)} / ${fmt(TARGET)} KD`;$('#nwBar').style.width=Math.min(100,nw/TARGET*100)+'%';
 const z=zoneOf(G.depth);$('#zoneTxt').textContent=z.name;$('#depthTxt').textContent=`Depth ${G.depth} of ${MAXD} · Turn ${G.turn}`;
 const tool=eqItem('tool'),out=eqItem('outfit');
 const accs=['acc1','acc2'].map(eqItem).filter(Boolean);
 const td=tool?IT[tool.k]:null;
 const herd=L.mons.filter(m=>m.state==='herd').length,allies=L.mons.filter(m=>m.state==='ally').length;
 $('#youKv').innerHTML=[
  ['Cash',`${fmt(P.dinars)} KD`],['Bank',`${fmt(G.bank||0)} KD`],['Fitness',P.str],['Armor',shownArmor()],
  ['Tool',tool?esc(itemName(tool))+(strPen(tool)?' <span style="color:var(--bad)">(heavy)</span>':''):'bare hands'],
  ['Damage',td?`${td.dmg[0]}–${td.dmg[1]}`:'1–2'],
  ['Outfit',out?esc(itemName(out)):'none'],
  ['Wearing',accs.length?accs.map(a=>esc(itemName(a))).join(', '):'—'],
  ['With you',`${herd} herd · ${allies} friends`],
  ['Animals worth',`${fmt(herdValue())} KD`+(G.herdStay?' <span style="color:var(--warn)">(staying)</span>':'')]
 ].map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('');
 const chips=[];
 if(P.poison)chips.push(['bad',`Poisoned ${P.poison}`]);
 if(P.st.haste)chips.push(['good',`Fast ${P.st.haste}`]);
 if(P.st.slow)chips.push(['bad',`Slowed ${P.st.slow}`]);
 if(P.st.conf)chips.push(['bad',`Dizzy ${P.st.conf}`]);
 if(P.st.tele)chips.push(['good',`Sharp senses ${P.st.tele}`]);
 if(P.st.stuck)chips.push(['warn','Stuck']);
 if(P.thirst<=300)chips.push([P.thirst<=150?'bad':'warn',P.thirst<=50?'Dehydrated':P.thirst<=150?'Parched':'Thirsty']);
 if(L.dust[idx(P.x,P.y)]>8)chips.push(['warn','In a sandstorm']);
 if(P.rested)chips.push(['','Resting (quiet)']);
 if(G.ride)chips.push(['good',`Truck in ${G.ride.left}`]);
 if(G.saveFailed)chips.push(['bad','Not saving']);
 $('#chips').innerHTML=chips.length?chips.map(([c,t])=>`<span class="chip ${c}">${t}</span>`).join(''):'<span class="empty">All good.</span>';
 const vm=L.mons.filter(m=>canSee(m)).sort((a,b)=>cheb(a.x,a.y,P.x,P.y)-cheb(b.x,b.y,P.x,P.y)).slice(0,8);
 $('#monList').innerHTML=vm.length?vm.map(m=>{const t=MT[m.k];const f=m.hp/m.maxHp;
  return`<div class="mon"><span class="g" style="color:${rgb(t.col)}">${esc(t.ch)}</span><span class="n"><span>${esc(m.title?cap(m.title):t.name)}</span><span>${stateLabel(m)}</span></span><span></span><div class="bar"><i style="width:${f*100}%;background:${isFriend(m)?'var(--sea)':f<.4?'var(--bad)':'var(--warn)'}"></i></div></div>`;}).join(''):'<p class="empty">Nothing around. Enjoy the quiet.</p>';
 // Screen readers: a plain-text summary of what's around, announced only when it changes.
 const dirTxt=(dx,dy)=>[dy<0?`${-dy} north`:dy>0?`${dy} south`:'',dx>0?`${dx} east`:dx<0?`${-dx} west`:''].filter(Boolean).join(', ');
 const near=vm.filter(m=>m.state!=='npc'||cheb(m.x,m.y,P.x,P.y)<=6).slice(0,5).map(m=>`${m.title||MT[m.k].name}, ${dirTxt(m.x-P.x,m.y-P.y)}, ${stateLabel(m)}`);
 const sr=`Depth ${G.depth}. Energy ${P.hp} of ${P.maxHp}. ${$('#thTxt').textContent==='Fine'?'':$('#thTxt').textContent+'. '}${near.length?'Nearby: '+near.join('; ')+'.':'Nothing nearby.'}`;
 const srKey=`${G.depth}|${$('#thTxt').textContent}|${near.join('|')}`;
 if(srKey!==updateUI.lastSr){updateUI.lastSr=srKey;$('#srStatus').textContent=sr;}
 const recent=G.msgs.slice(-4);const lastTurn=G.msgs.length?G.msgs[G.msgs.length-1].n:0;
 $('#log').innerHTML=recent.map(m=>`<div class="${m.n>=lastTurn-1&&m.n>=G.turn-1?'new '+m.c:''}">${esc(m.t)}</div>`).join('');
 updateHover();
}
function describe(x,y){
 if(!inb(x,y))return'';const i=idx(x,y);
 if(x===P.x&&y===P.y){const it=L.items.find(o=>o.x===x&&o.y===y);return`<b>You.</b> ${P.hp}/${P.maxHp} energy, ${fmt(P.dinars)} KD in your pocket.${it?` Lying here: ${esc(aName(it))}.`:''}`;}
 if(!L.known[i])return'You haven’t seen this spot yet.';
 const m=monAt(x,y);
 if(m&&(canSee(m)||P.st.tele)){const t=MT[m.k];let s=`<b>${esc(m.title?cap(m.title):cap(t.name))}</b> (${stateLabel(m)}). ${esc(t.desc)}`;
  if(isHostile(m)){const tool=eqItem('tool');const dd=tool?IT[tool.k].dmg:[1,2];const avg=((dd[0]+dd[1])/2)*Math.pow(1.065,(tool?tool.ench:0)-strPen(tool));
   s+=` It hits you ${hitPct(t.acc,playerArmor())}% of the time for ${t.dmg[0]}–${t.dmg[1]}. You hit it ${hitPct(playerAcc(),t.def)}%, about ${Math.max(1,Math.ceil(m.hp/avg))} hits to drive it off.`;
   if(m.state==='sleep'||m.state==='wander')s+=' It hasn’t noticed you: sneak attacks do triple damage.';}
  if(m.state==='neutral'&&t.kind==='livestock'){const n=t.feed||1,have=(P.inv.find(o=>o.k==='dates')||{q:0}).q;s+=have>=n?` Walk into it to feed it ${n===1?'a handful':n+' handfuls'} of dates and win it over.`:` It takes ${n===1?'a handful':n+' handfuls'} of dates to win it over. You have ${have}.`;}
  if(m.state==='captive')s+=' Walk into it to untie it.';
  return s;}
 const it=L.items.find(o=>o.x===x&&o.y===y);
 if(it&&(vis[i]||it.seen)){let s=`<b>${esc(aName(it))}</b>`;if(it.k!=='money'){const d=IT[it.k];if(!isUnknown(it)||d.cat==='tool'||d.cat==='outfit')s+=`. ${esc(d.desc)}`;else s+='. You won’t know what it is until you try it.';}if(it.vault)s+=' <span style="color:var(--gold)">A deal: take it and the other offers vanish.</span>';return s;}
 const d=TD[L.t[i]];let s=`<b>${esc(d.name[0].toUpperCase()+d.name.slice(1))}</b>${d.desc?'. '+esc(d.desc):'.'}`;
 if(L.fire[i])s='<b>Fire!</b> Don’t stand in it.';
 if(m&&vis[i]&&MT[m.k].hidden&&!canSee(m)&&cheb(x,y,P.x,P.y)<=6)s='<b>Disturbed sand.</b> Something might be buried here. Careful.';
 if(L.dust[i]>8)s+=' Blowing sand.';
 return s;
}
function updateHover(){
 const h=$('#hover');
 if(hoverCell)h.innerHTML=describe(hoverCell[0],hoverCell[1]);
 else{const here=L.items.filter(o=>o.x===P.x&&o.y===P.y);h.innerHTML=here.length?`Lying here: ${here.map(o=>esc(aName(o))).join(', ')}. Press g to pick up.`:'<span style="color:var(--faint)">Hover over or tap anything on the map to inspect it.</span>';}
}

// ===== Inventory UI =====
let invState=null;
function openInv(opts){if(!G||G.over)return;invState=Object.assign({mode:'browse',sel:null,filter:null,title:'Your bag'},opts||{});$('#inv').hidden=false;drawInv();}
function closeInv(){invState=null;$('#inv').hidden=true;}
function primaryLabel(it){const d=IT[it.k];switch(d.cat){case 'drink':return'Drink';case 'tip':return'Read';case 'course':return'Take course';case 'water':return'Drink';case 'dates':case 'machboos':case 'gift':return'Eat';case 'protein':return'Drink';case 'tool':case 'outfit':case 'acc':return isEquipped(it)?'Remove':(d.cat==='tool'?'Equip':'Wear');case 'gadget':return'Use';case 'treat':return'Throw';case 'charm':return'Use';case 'pebbles':return'Throw';}return null;}
function drawInv(){
 const items=P.inv.filter(it=>!invState.filter||invState.filter(it)).sort((a,b)=>a.letter.localeCompare(b.letter));
 $('#invTitle').textContent=invState.title;
 const list=$('#invList');
 if(!items.length)list.innerHTML='<p class="empty">Nothing here.</p>';
 else list.innerHTML=items.map(it=>`<button type="button" class="irow${invState.sel===it.id?' on':''}" data-id="${it.id}"><span class="let">${it.letter}</span><span class="gl" style="color:${rgb(itemCol(it))}">${esc(itemCh(it))}</span><span class="nm">${esc(itemName(it))}</span>${isEquipped(it)?'<span class="tag">in use</span>':''}</button>`).join('');
 list.querySelectorAll('.irow').forEach(b=>b.onclick=()=>invPick(P.inv.find(o=>o.id===+b.dataset.id)));
 const det=$('#invDetail');
 if(invState.mode==='select'){det.innerHTML='<p>Pick an item from the list.</p>';return;}
 const it=P.inv.find(o=>o.id===invState.sel);
 if(!it){det.innerHTML=`<p>${P.inv.length}/26 slots used. Pick an item to see what it does.</p><p style="color:var(--faint);font-size:12px">Keyboard: press an item's letter, then Enter to use, d to drop, Esc to close.</p>`;return;}
 const d=IT[it.k];let stat='';
 if(d.cat==='tool')stat=`Damage ${d.dmg[0]}–${d.dmg[1]} · Needs fitness ${d.str}${it.known?'':' · Quality unknown until you’ve used it a while'}`;
 if(d.cat==='outfit')stat=`Armor ${d.armor}${it.known?(it.ench>=0?' +':' ')+it.ench:' (+?)'} · Needs fitness ${d.str}${d.heat?' · Makes you thirstier':''}`;
 if(d.cat==='gadget')stat=`Charges ${it.c}/${it.mx} · Power +${it.pw}`;
 if(d.cat==='treat')stat=`${it.c} left`;
 if(d.cat==='acc')stat=`Strength +${it.pw}`;
 if(d.cat==='charm')stat=it.cd>0?`Recharging: ${it.cd} turns`:'Ready';
 const desc=isUnknown(it)&&(d.cat==='drink'||d.cat==='tip')?'You won’t know what this is until you try it. Could be great. Could be your cousin’s idea of a joke.':d.desc;
 const pl=primaryLabel(it);
 const runeTxt=it.rn&&(it.known||it.rk)?`<p><b style="color:var(--gold)">${cap(RUNES[it.rn].name)}:</b> ${esc(RUNES[it.rn].desc)}</p>`:'';
 const canThrow=d.cat==='drink';
 det.innerHTML=`<h4><span style="color:${rgb(itemCol(it))};font-family:var(--mono)">${esc(itemCh(it))}</span> ${esc(itemName(it))}</h4>${stat?`<div class="stat">${esc(stat)}</div>`:''}<p>${esc(desc)}</p>${runeTxt}${canThrow?'<p style="font-size:12px;color:var(--faint)">Throwing a drink splashes every animal in a small area with it.</p>':''}<div class="btns">${pl?`<button class="btn primary" type="button" id="actUse">${pl}</button>`:''}${canThrow?'<button class="btn" type="button" id="actThrow">Throw</button>':''}<button class="btn" type="button" id="actDrop">Drop</button></div>`;
 if(pl)$('#actUse').onclick=()=>{closeInv();useItem(it);updateUI();render();};
 if(canThrow)$('#actThrow').onclick=()=>{closeInv();throwDrink(it);updateUI();render();};
 $('#actDrop').onclick=()=>{closeInv();dropItem(it);};
}
function invPick(it){if(!it)return;if(invState.mode==='select'){const cb=invState.onPick;closeInv();cb(it);updateUI();render();return;}invState.sel=it.id;drawInv();}

// ===== Trader =====
let shopM=null;
const SUPPLIES=[['water','Bottle of water','Fully quenches your thirst.',25],['dates','Handful of dates','Food, or feed for livestock.',35],['dogtreats','Dog treats (2)','Turn a dog, fox, wolf or hyena into a friend.',60],['firecrackers','Firecrackers (3)','Loud, fiery, scary.',50],['course','Training course','+1 to one item. Price goes up each time.',350],['maamoul',"Box of ma'amoul",'A gift that gets you a better price.',40]];
// Prices rise with depth roughly as fast as the money you find there, so shopping stays a real choice.
const priceMult=()=>(1+Math.pow(G.depth,1.25)/6)*(shopM&&shopM.gift?.8:1);
const price=b=>Math.max(5,Math.round(b*priceMult()/5)*5);
function supplyPrice(k,b){return k==='course'?price(b*(1+.5*(G.coursesBought||0))):price(b);}
function gearPrice(it){const d=IT[it.k];let b={tool:220,outfit:240,gadget:420,acc:150+150*it.pw,charm:360}[d.cat]||200;if(it.ench>0)b+=120*it.ench;if(it.rn)b+=220;return price(b);}
// The ride home costs a share of everything you've built, and the truck takes a while to arrive.
const rideFee=()=>Math.max(price(300),Math.round(netWorth()*.08/5)*5);
const BUY_LIMIT=3,SELL_RATE=.8,REQ_RATE=1.3;
const salePrice=(m,a)=>Math.round(MT[a.k].value*(a.k===m.req?REQ_RATE:SELL_RATE));
const sellable=()=>L.mons.filter(m=>isFriend(m)&&(MT[m.k].value||0)>0&&cheb(m.x,m.y,P.x,P.y)<=10);
function openShop(m){
 shopM=m;
 if(!m.stock){m.stock=[];for(let i=0;i<3;i++){const it=makeItem(wpick(catWeights(pick(['tool','outfit','gadget','acc','charm']))));if(it.ench!==undefined){it.ench=ri(0,2);it.known=true;}m.stock.push(it);}
  m.req=pick(['sheep','goat','camel']);}
 $('#shop').hidden=false;drawShop();
}
function closeShop(){shopM=null;$('#shop').hidden=true;if(G){updateUI();render();}}
function drawShop(){
 const m=shopM;if(!m)return;
 $('#shopTitle').textContent=cap(m.title);
 const greet=m.gift?'Thank you for the ma’amoul! Everything is 20% off for you today.':m.k&&G.depth<=4?'“Ahlan, come in, have some tea. What do you need?”':'“Welcome, welcome. Sit, have some gahwa. What can I do for you?”';
 $('#shopIntro').textContent=greet;
 $('#shopWallet').innerHTML=`<span>Cash <b>${fmt(P.dinars)} KD</b></span><span>Bank <b>${fmt(G.bank||0)} KD</b></span><span>Herd with you <b>${fmt(herdValue())} KD</b></span><span>Net worth <b>${fmt(netWorth())} KD</b></span>`;
 const row=(name,sub,priceTxt,btn,act,dis)=>`<div class="shop-row"><span>${name}${sub?`<small>${sub}</small>`:''}</span><span style="display:flex;gap:8px;align-items:center">${priceTxt?`<span class="price">${priceTxt}</span>`:''}<button class="btn sm" type="button" data-act="${act}"${dis?' disabled':''}>${btn}</button></span></div>`;
 const full=P.inv.length>=26;
 let h='<div class="shop-sec"><h3>Supplies</h3>';
 for(const[k,n,s,b]of SUPPLIES){const p=supplyPrice(k,b);const stackOk=!full||P.inv.some(o=>o.k===k);h+=row(n,s,`${fmt(p)} KD`,'Buy',`sup:${k}`,P.dinars<p||!stackOk);}
 h+='</div><div class="shop-sec"><h3>Gear</h3>';
 if(!m.stock.length)h+='<p class="empty">Sold out. Check the next trader.</p>';
 m.stock.forEach((it,i)=>{const p=gearPrice(it);const d=IT[it.k];const sub=it.rn?RUNES[it.rn].desc:d.desc;h+=row(esc(itemName(it)),esc(sub),`${fmt(p)} KD`,'Buy',`gear:${i}`,P.dinars<p||full);});
 h+='</div><div class="shop-sec"><h3>Sell animals</h3>';
 const animals=sellable();const room=BUY_LIMIT-(m.boughtN||0);
 h+=`<p style="font-size:12.5px;margin:4px 0">They pay ${Math.round(SELL_RATE*100)}% of an animal’s worth${m.req?`, or ${Math.round(REQ_RATE*100)}% for today’s request: a <b style="color:var(--gold)">${MT[m.req].name}</b>`:''}. Room for ${room} more animal${room===1?'':'s'}.</p>`;
 if(!animals.length)h+='<p class="empty">No animals with you to sell. Bring them close.</p>';
 for(const a of animals){const t=MT[a.k];h+=row(cap(t.name)+(a.state==='ally'?' (friend)':''),a.k===m.req?'Exactly what they wanted.':`Worth ${fmt(t.value)} KD while it’s with you.`,`${fmt(salePrice(m,a))} KD`,'Sell',`sell:${a.id}`,room<=0);}
 h+='</div><div class="shop-sec"><h3>Bank</h3>';
 h+=row('Deposit all cash','Banked money is safe from crows and counts toward your net worth.','', 'Deposit','dep',P.dinars<=0);
 h+=row('Withdraw everything','Take your savings back out as cash.','','Withdraw','wd',!(G.bank>0));
 h+='<h3>Services</h3>';
 if(G.ride)h+=row('Pickup truck on its way',`Arrives in about ${G.ride.left} turns. Stay on this depth and stay alive.`,'','Waiting','ride',true);
 else if(G.depth>1)h+=row('Ride home in a pickup truck','Costs 8% of your net worth. It takes 15–25 turns to arrive, and you must still be on this depth. Takes you and every animal with you to your front door.',`${fmt(rideFee())} KD`,'Call truck','ride',P.dinars<rideFee());
 const gift=P.inv.find(o=>o.k==='maamoul');
 h+=row("Offer ma'amoul",m.gift?'Already given. Everything is 20% off.':'Prices drop 20% here, and they tell you what one unknown item is.','',m.gift?'Given':'Give','gift',!gift||m.gift);
 h+='</div>';
 $('#shopBody').innerHTML=h;
}
$('#shopBody').addEventListener('click',e=>{
 const b=e.target.closest('button[data-act]');if(!b||b.disabled||!shopM)return;
 const[a,arg]=b.dataset.act.split(':');const m=shopM;
 if(a==='sup'){const s=SUPPLIES.find(x=>x[0]===arg);const p=supplyPrice(arg,s[3]);if(P.dinars<p)return;
  const it=makeItem(arg);if(arg==='dogtreats')it.c=2;else if(arg==='firecrackers')it.c=3;else it.q=1;
  if(!addInv(it)){msg('Your bag is full.','warn');}else{P.dinars-=p;if(arg==='course')G.coursesBought=(G.coursesBought||0)+1;sfx('buy');msg(`You buy ${aName(Object.assign({},it,{q:1}))} for ${fmt(p)} KD.`);}}
 else if(a==='gear'){const it=m.stock[+arg];const p=gearPrice(it);if(P.dinars<p)return;
  if(!addInv(it)){msg('Your bag is full.','warn');}else{P.dinars-=p;m.stock.splice(+arg,1);sfx('buy');msg(`You buy the ${itemName(it)} for ${fmt(p)} KD.`,'good');}}
 else if(a==='sell'){const an=L.mons.find(o=>o.id===+arg);if(!an||(m.boughtN||0)>=BUY_LIMIT)return;const t=MT[an.k];const bonus=an.k===m.req;const v=salePrice(m,an);
  L.mons=L.mons.filter(o=>o!==an);P.dinars+=v;m.boughtN=(m.boughtN||0)+1;G.stats.sold=(G.stats.sold||0)+1;if(bonus)m.req=null;sfx('coin');
  msg(`You sell your ${t.name} for ${fmt(v)} KD.${bonus?' Exactly what they were looking for.':''}`,'gold');}
 else if(a==='dep'){G.bank=(G.bank||0)+P.dinars;msg(`You deposit ${fmt(P.dinars)} KD. Savings: ${fmt(G.bank)} KD.`,'gold');P.dinars=0;sfx('coin');}
 else if(a==='wd'){P.dinars+=G.bank;msg(`You withdraw ${fmt(G.bank)} KD in cash.`);G.bank=0;}
 else if(a==='gift'){const g=P.inv.find(o=>o.k==='maamoul');if(!g)return;removeOne(g);m.gift=true;sfx('tame');
  msg(`You hand over the ma’amoul. ${cap(m.title)} is delighted.`,'gold');const unk=P.inv.find(isUnknown);if(unk)identify(unk);}
 else if(a==='ride'){const fee=rideFee();if(G.ride||P.dinars<fee)return;P.dinars-=fee;G.ride={depth:G.depth,left:ri(15,25)};closeShop();
  msg(`You pay ${fmt(fee)} KD. The pickup truck is on its way: about ${G.ride.left} turns. Stay on this depth and stay alive.`,'gold');return;}
 drawShop();updateUI();
});
$('#shopClose').onclick=closeShop;

// ===== End screens =====
function showEnd(won,nw){
 $('#endTitle').textContent=won?'You made it home':'You passed out';
 $('#endText').textContent=won?`You walk through the front door with ${fmt(nw)} KD to your name. Your mother cries, your uncle takes credit, and the whole diwaniya suddenly wants a loan.`:`Collapsed from ${G.over.cause} on depth ${G.depth}. Someone drove you home. Your mother makes you tea and tells you to try again tomorrow.`;
 const herdN=L.mons.filter(isFriend).length;
 let best='';if(G.daily){const prev=dailyBest(G.daily);if(nw>prev){try{localStorage.setItem('rizq-daily-'+G.daily,String(Math.round(nw)));}catch(e){}best=prev?' A new personal best for today’s run!':'';}}
 if(best)$('#endText').textContent+=best;
 $('#endStats').innerHTML=[['Net worth',fmt(nw)+' KD'],['Deepest',`Depth ${G.stats.deepest}`],['Turns',fmt(G.turn)],['Animals driven off',G.stats.driven],['Animals sold',G.stats.sold||0],['With you at the end',herdN],[G.daily?'Daily run':'Seed',G.daily||G.seed]].map(([k,v])=>`<div>${k}<b>${v}</b></div>`).join('');
 $('#end').hidden=false;
}


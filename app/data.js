// Rizq: Constants, random numbers, and the data tables: tiles, zones, animals, traders, items and runes.
// Loaded as a classic script, in order, from index.html. All files share one global scope.
'use strict';
// ================= CONSTANTS =================
const W=79,H=29,N=W*H,TARGET=100000,MAXD=26,THIRST_MAX=2000;
const idx=(x,y)=>y*W+x, inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
const DIRS=[[0,-1],[1,0],[0,1],[-1,0],[1,-1],[1,1],[-1,1],[-1,-1]];
const DIR4=[[0,-1],[1,0],[0,1],[-1,0]];
const $=s=>document.querySelector(s);
const fmt=n=>Math.round(n).toLocaleString('en-US');
const rgb=c=>`rgb(${c[0]|0},${c[1]|0},${c[2]|0})`;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const cheb=(ax,ay,bx,by)=>Math.max(Math.abs(ax-bx),Math.abs(ay-by));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// ================= RNG =================
let G=null,L=null,P=null,curRng=Math.random;
function mix32(s){return function(){let a=(s=(s+0x6D2B79F5)>>>0);let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function gameRng(){let a=(G.rs=(G.rs+0x6D2B79F5)>>>0);let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;}
const rand=()=>curRng();
const ri=(a,b)=>a+Math.floor(rand()*(b-a+1));
const pick=a=>a[Math.floor(rand()*a.length)];
const chance=p=>rand()<p;
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function wpick(pairs){let t=0;for(const p of pairs)t+=p[1];let r=rand()*t;for(const p of pairs){if((r-=p[1])<0)return p[0];}return pairs[pairs.length-1][0];}
function hash(x,y,z){let h=(Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(z,2246822519))|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}

// ================= TILES =================
const T={WALL:0,FLOOR:1,DOOR:2,DOWN:3,UP:4,GRASS:5,SHRUB:6,WATER:7,SABKHA:8,OIL:9,PALM:10,CAR:11,SCRAP:12,FENCE:13,SAND:14,DUNE:15,ASH:16,TENT:17,HOME:18,PED:19,STALL:20,SHELF:21,CONT:22,TILE:23};
const TD=[];
function td(id,o){TD[id]=Object.assign({ch:'·',fg:[150,150,150],bg:[20,20,20],pass:true,opaque:false,wall:false,flam:0,slow:false,name:'ground',desc:''},o);}
td(T.WALL,{ch:'#',pass:false,opaque:true,wall:true,name:'wall'});
td(T.FLOOR,{ch:'·',name:'ground'});
td(T.SAND,{ch:'·',name:'sand'});
td(T.DOOR,{ch:'+',fg:[215,160,95],bg:[78,50,28],opaque:true,door:true,flam:.15,name:'door'});
td(T.DOWN,{ch:'>',fg:[255,228,150],bg:[92,70,30],name:'the way onward',desc:'Further out: bigger money, bigger trouble. Step on it to go deeper.'});
td(T.UP,{ch:'<',fg:[200,225,255],bg:[40,56,84],name:'the way back',desc:'Back toward home. Step on it to go up a depth.'});
td(T.HOME,{ch:'⌂',fg:[255,220,140],bg:[110,62,30],name:'your front door',desc:'Home. Step here with 100,000 KD net worth to win.'});
td(T.GRASS,{ch:'"',fg:[118,172,74],bg:[30,44,20],flam:.5,name:'grass',desc:'Dry grass. Burns fast.'});
td(T.SHRUB,{ch:'♠',fg:[130,158,74],bg:[36,40,20],opaque:true,flam:.5,name:'arfaj shrub',desc:'A thorny desert shrub. Blocks sight both ways. Burns well.'});
td(T.WATER,{ch:'~',fg:[96,176,226],bg:[18,52,84],water:true,name:'irrigation ditch',desc:'Shallow water. Fire can’t cross it.'});
td(T.SABKHA,{ch:'≈',fg:[226,220,204],bg:[88,82,70],name:'sabkha',desc:'Salt crust over sticky mud. You might get stuck for a turn or two.'});
td(T.OIL,{ch:'~',fg:[140,104,160],bg:[26,18,30],flam:.95,name:'oil puddle',desc:'Black, slick and very flammable.'});
td(T.PALM,{ch:'♣',fg:[96,178,82],bg:[30,42,22],pass:false,opaque:true,flam:.25,name:'date palm',desc:'A date palm. Blocks sight. It can burn.'});
td(T.CAR,{ch:'■',fg:[220,220,220],bg:[34,32,30],pass:false,name:'parked car',desc:'A parked car. Nobody is moving it today.'});
td(T.SCRAP,{ch:'%',fg:[160,128,104],bg:[42,34,30],pass:false,name:'scrap pile',desc:'Rusty engine parts and old tires.'});
td(T.FENCE,{ch:'#',fg:[178,136,82],bg:[54,38,22],pass:false,flam:.2,name:'wooden fence',desc:'A pen fence. It can burn.'});
td(T.DUNE,{ch:'∩',fg:[226,194,132],bg:[98,76,44],slow:true,name:'soft dune',desc:'Deep soft sand. Each step takes twice as long.'});
td(T.ASH,{ch:',',fg:[100,94,88],bg:[28,25,23],name:'ashes',desc:'Something burned here.'});
td(T.TENT,{ch:'∆',fg:[236,224,200],bg:[96,62,40],pass:false,opaque:true,flam:.3,name:'camp tent',desc:'A winter camp tent. Someone’s uncle is definitely inside watching football.'});
td(T.PED,{ch:'_',fg:[236,196,96],bg:[84,64,26],name:'deal table',desc:'An opportunity. Take one item here and the other offers disappear.'});
td(T.STALL,{ch:'Π',fg:[226,176,96],bg:[86,42,30],pass:false,name:'market stall',desc:'A Friday market stall: old phones, carpets, mystery cables.'});
td(T.SHELF,{ch:'≡',fg:[214,196,150],bg:[60,52,40],pass:false,name:'co-op shelves',desc:'Rice, cardamom, and forty brands of the same tissues.'});
td(T.CONT,{ch:'▬',fg:[200,90,60],bg:[50,30,24],pass:false,opaque:true,name:'shipping container',desc:'A stack of shipping containers. You can’t see past it.'});
td(T.TILE,{ch:'·',fg:[150,140,124],bg:[52,46,40],name:'tiled floor',desc:'Inside a house. Shoes off would be polite.'});
const FLOORLIKE=new Set([T.FLOOR,T.SAND,T.GRASS,T.ASH,T.TILE]);
const CAR_COLS=[[236,236,232],[196,200,206],[96,100,112],[196,52,46],[222,204,160],[70,110,170]];
const CONT_COLS=[[200,90,60],[70,120,170],[90,150,90],[210,170,60],[160,160,170]];

const ZONES=[
 {id:0,name:'The Neighborhood',from:1,to:4,gen:'city',vis:11,heat:1,floor:{fg:[128,116,100],bg:[37,32,28]},wall:{fg:[204,184,150],bg:[108,90,70]},
  arrive:'Your neighborhood and the Friday market. Stray cats, crows and dogs everywhere.'},
 {id:1,name:'Shuwaikh Industrial',from:5,to:9,gen:'yard',vis:9,heat:1.1,floor:{fg:[116,116,122],bg:[29,30,33]},wall:{fg:[164,164,172],bg:[74,76,84]},
  arrive:'Shuwaikh Industrial. Garages, scrapyards, and dogs that have never once been friendly.'},
 {id:2,name:'Wafra Farms',from:10,to:14,gen:'farm',vis:13,heat:1.2,floor:{fg:[134,112,76],bg:[44,36,23]},wall:{fg:[194,162,116],bg:[116,90,58]},
  arrive:'The farms of Wafra. Palms, pens, and roosters with something to prove. Save some dates: livestock love them.'},
 {id:3,name:'The Winter Camps',from:15,to:20,gen:'cave',fill:.42,vis:12,heat:.9,floor:{fg:[202,172,116],bg:[66,52,33]},wall:{fg:[198,148,96],bg:[122,82,52]},
  arrive:'Winter camp season. Tents, grilled meat on the breeze, and vipers under every bush.'},
 {id:4,name:'The Deep Desert',from:21,to:26,gen:'cave',fill:.40,vis:10,heat:1.6,storms:true,floor:{fg:[218,188,128],bg:[84,64,40]},wall:{fg:[178,128,86],bg:[104,68,42]},
  arrive:'The deep desert. Hot, empty, and full of wolves. Fortune favors the well-hydrated.'}
];
const zoneOf=d=>ZONES.find(z=>d>=z.from&&d<=z.to)||ZONES[4];
const floorOf=z=>z.gen==='cave'?T.SAND:T.FLOOR;

// ================= MONSTERS =================
const MT={
 pigeon:{name:'pigeon',ch:'p',col:[176,180,196],hp:3,def:10,acc:0,dmg:[0,0],kind:'critter',erratic:.6,flighty:true,desc:'Fat, unbothered and everywhere.'},
 cat:{name:'stray cat',ch:'c',col:[224,168,98],hp:6,def:15,acc:70,dmg:[1,2],kind:'hostile',verb:'scratches',stealFood:true,fleeAt:.5,off:'hisses and vanishes over a wall.',desc:'Will steal your dates if you let it.'},
 crow:{name:'house crow',ch:'v',col:[160,164,180],hp:5,def:25,acc:80,dmg:[1,2],speed:50,kind:'hostile',verb:'pecks',erratic:.3,stealMoney:true,hitrun:true,off:'flaps away, cawing insults.',desc:'Fast, clever, and very interested in your cash. Pecks, then flies back out of reach.'},
 rat:{name:'rat',ch:'r',col:[170,144,118],hp:6,def:0,acc:70,dmg:[1,3],kind:'hostile',verb:'bites',off:'scurries into a drain.',desc:'A large, confident rat.'},
 dog:{name:'stray dog',ch:'d',col:[210,170,118],hp:10,def:10,acc:70,dmg:[2,4],kind:'hostile',verb:'bites',canine:true,pack:[1,3],off:'yelps and runs off for good.',desc:'Hungry and usually not alone.'},
 yarddog:{name:'scrapyard dog',ch:'d',col:[190,140,96],hp:14,def:15,acc:85,dmg:[2,5],kind:'hostile',verb:'bites',canine:true,pack:[2,4],off:'bolts behind a container.',desc:'Lives between the scrap piles. Travels in packs.'},
 tomcat:{name:'feral tomcat',ch:'c',col:[232,124,70],hp:14,def:30,acc:90,dmg:[2,5],kind:'hostile',verb:'claws',fleeAt:.3,off:'yowls and disappears.',desc:'Scarred, huge and in charge of this block.'},
 guard:{name:'guard dog',ch:'D',col:[214,126,72],hp:24,def:20,acc:100,dmg:[3,7],kind:'hostile',verb:'bites',canine:true,off:'retreats, still growling.',desc:'Someone trained this one to guard a garage. It takes the job seriously.'},
 sheep:{name:'sheep',ch:'s',col:[238,234,220],hp:12,def:0,acc:0,dmg:[0,0],kind:'livestock',value:120,feed:1,desc:'Worth about 120 KD. A handful of dates wins it over.'},
 goat:{name:'goat',ch:'g',col:[200,164,122],hp:12,def:10,acc:0,dmg:[0,0],kind:'livestock',value:100,feed:1,desc:'Worth about 100 KD. A handful of dates wins it over. It’s judging you.'},
 camel:{name:'camel',ch:'C',col:[224,194,138],hp:40,def:10,acc:0,dmg:[0,0],kind:'livestock',value:1500,feed:2,desc:'Worth about 1,500 KD. Camels love dates: two handfuls win it over.'},
 rooster:{name:'angry rooster',ch:'k',col:[234,92,60],hp:8,def:30,acc:90,dmg:[1,3],speed:50,kind:'hostile',verb:'pecks',off:'struts off, pretending it won.',desc:'Small, fast, and furious about something.'},
 farmdog:{name:'farm dog',ch:'d',col:[224,194,144],hp:18,def:20,acc:95,dmg:[3,5],kind:'hostile',verb:'bites',canine:true,pack:[1,2],off:'runs back to the farmhouse.',desc:'Guards the farm. Doesn’t know you’re one of the good guys.'},
 bee:{name:'honeybee',ch:'b',col:[244,200,52],hp:3,def:70,acc:100,dmg:[1,2],speed:50,kind:'hostile',verb:'stings',erratic:.33,poison:1,pack:[3,5],swarm:true,off:'buzzes off.',desc:'Hard to hit. Comes in swarms: hit one and the whole hive comes for you.'},
 lizard:{name:'dhab lizard',ch:'l',col:[204,184,104],hp:14,def:20,acc:0,dmg:[0,0],kind:'critter',erratic:.15,desc:'A spiny-tailed lizard minding its own business. Please do the same.'},
 viper:{name:'horned viper',ch:'S',col:[220,198,156],hp:14,def:35,acc:110,dmg:[2,4],kind:'hostile',verb:'bites',poison:4,ambush:true,hidden:true,off:'slithers away into the sand.',desc:'Buried in the sand, waiting. You won’t see it until you’re close. Venomous.'},
 scorpion:{name:'yellow scorpion',ch:'x',col:[238,208,92],hp:10,def:60,acc:100,dmg:[1,3],kind:'hostile',verb:'stings',poison:5,hidden:true,off:'scuttles under a rock.',desc:'Hides under rocks until you’re close. Hard shell, nasty sting.'},
 spider:{name:'camel spider',ch:'X',col:[214,152,102],hp:18,def:40,acc:110,dmg:[3,6],speed:50,kind:'hostile',verb:'bites',off:'skitters off at alarming speed.',desc:'Not a spider, not a scorpion, definitely too fast.'},
 fox:{name:'red fox',ch:'f',col:[234,122,52],hp:15,def:35,acc:100,dmg:[2,5],kind:'hostile',verb:'bites',canine:true,stealFood:true,fleeAt:.4,off:'darts off into the dunes.',desc:'Clever. Will steal your dates.'},
 wolf:{name:'Arabian wolf',ch:'w',col:[196,190,176],hp:28,def:45,acc:120,dmg:[3,7],speed:50,kind:'hostile',verb:'bites',canine:true,pack:[2,3],howl:true,predator:true,off:'slinks off into the dunes.',desc:'Lean and fast. When one finds you, it howls and the whole pack comes. Bites harder with packmates beside it, and loves to pick off your herd.'},
 hyena:{name:'striped hyena',ch:'H',col:[206,190,134],hp:55,def:50,acc:125,dmg:[6,12],kind:'hostile',verb:'mauls',canine:true,cautious:true,predator:true,off:'cackles nervously and backs away.',desc:'Powerful jaws. It circles and waits until you’re hurt before it commits. Also hunts your herd.'},
 bull:{name:'bull camel',ch:'C',col:[174,122,80],hp:90,def:30,acc:120,dmg:[8,14],kind:'hostile',verb:'kicks',charge:true,off:'snorts and lumbers off.',desc:'A camel in a very bad mood. It charges in straight lines, so step out of its path. Winded after a charge.'},
 monitor:{name:'desert monitor',ch:'L',col:[156,176,104],hp:45,def:60,acc:120,dmg:[5,10],kind:'hostile',verb:'whips',off:'waddles off, offended.',desc:'A big, armored waral lizard.'},
 stalker:{name:'deathstalker',ch:'x',col:[252,238,156],hp:20,def:80,acc:130,dmg:[2,5],kind:'hostile',verb:'stings',poison:10,hidden:true,off:'retreats into a crack.',desc:'The most venomous scorpion out here. Hides until you’re close.'},
 saluki:{name:'saluki',ch:'d',col:[248,244,234],hp:30,def:40,acc:120,dmg:[3,7],speed:50,kind:'captive',canine:true,value:800,verb:'bites',desc:'A sleek hunting dog, tied up and left behind. Untie it and it’s yours. Worth about 800 KD.'},
 falcon:{name:'saker falcon',ch:'F',col:[214,178,132],hp:22,def:70,acc:140,dmg:[4,8],speed:50,kind:'captive',value:5000,verb:'strikes',desc:'A trained saker falcon on a perch. Untie it and it’s yours. Worth about 5,000 KD.'},
 cousin:{name:'your cousin',ch:'@',col:[120,184,255],hp:30,def:30,acc:110,dmg:[3,7],kind:'summon',verb:'shoves',desc:'Showed up “in five minutes” (forty). Fights for you until his mom calls.'},
 trader:{name:'trader',ch:'@',col:[120,226,160],hp:999,def:100,acc:0,dmg:[0,0],kind:'npc',desc:'Walk into them to trade, bank your cash, sell animals or pay for a ride home.'}
};
// Traders wait beside the way back on these depths.
const HUBS={2:'Bu Fahad’s diwaniya',5:'Abu Salem’s garage',9:'the Shuwaikh tea stand',12:'the Wafra farm market',16:'Abu Nasser’s winter camp',20:'the camp owner’s majlis',24:'a Bedouin trader'};
const SPAWN=[['pigeon',1,5,6],['rat',1,7,10],['dog',1,6,10],['cat',1,6,8],['crow',1,9,6],
 ['yarddog',5,11,10],['tomcat',4,11,7],['guard',6,13,7],
 ['rooster',9,15,8],['farmdog',10,16,9],['bee',10,16,6],
 ['lizard',14,22,5],['viper',15,26,8],['scorpion',14,22,8],['spider',15,24,7],['fox',14,22,7],
 ['wolf',21,26,10],['hyena',21,26,7],['bull',21,26,4],['monitor',20,26,6],['stalker',22,26,6]];

// ================= ITEMS =================
const IT={
 stick:{cat:'tool',name:"shepherd's stick",ch:'↑',col:[204,172,120],dmg:[2,4],str:12,verb:'whack',desc:'A trusty wooden stick. Every grandfather had one, mostly for pointing at things.'},
 pipe:{cat:'tool',name:'iron pipe',ch:'↑',col:[176,180,190],dmg:[3,6],str:13,verb:'clang',desc:'Found behind a garage in Shuwaikh. Heavy, reliable, slightly rusty.'},
 shovel:{cat:'tool',name:'shovel',ch:'↑',col:[166,166,156],dmg:[4,7],str:14,sweep:true,verb:'swing at',desc:'Hits every animal next to you at once. Great when the dogs surround you.'},
 pitchfork:{cat:'tool',name:'pitchfork',ch:'↑',col:[196,164,112],dmg:[4,6],str:13,reach:true,verb:'jab',desc:'Long enough to also hit the animal behind the first one.'},
 sledge:{cat:'tool',name:'sledgehammer',ch:'↑',col:[156,156,168],dmg:[9,15],str:16,slow:true,verb:'slam',desc:'Hits very hard, but each swing takes twice as long.'},
 dishdasha:{cat:'outfit',name:'dishdasha',ch:'[',col:[242,242,236],armor:1,str:10,desc:'Clean, white and ironed. Looks great. Protects you from almost nothing.'},
 overalls:{cat:'outfit',name:'work overalls',ch:'[',col:[96,128,186],armor:3,str:11,desc:'Thick cotton overalls. Rugged and practical.'},
 jacket:{cat:'outfit',name:'leather jacket',ch:'[',col:[150,100,64],armor:4,str:12,heat:1.35,desc:'Good protection, but wearing leather out here makes you thirsty much faster.'},
 bisht:{cat:'outfit',name:'bisht',ch:'[',col:[212,168,94],armor:5,str:13,desc:'A formal cloak with gold trim. Dignified and surprisingly tough.'},
 safety:{cat:'outfit',name:'safety gear',ch:'[',col:[244,174,44],armor:7,str:15,heat:1.15,desc:'Hard hat, boots and a padded vest. The site manager would be proud.'},
 juice:{cat:'drink',name:'fresh orange juice',desc:'Fully restores your energy and cures poison.'},
 laban:{cat:'drink',name:'cold laban',desc:'Restores some energy, quenches thirst and cures poison.'},
 energy:{cat:'drink',name:'energy drink',desc:'You move and act twice as fast for a while.'},
 mint:{cat:'drink',name:'mint lemonade',desc:'Sharpens your senses: you can sense every animal on this level for a while.'},
 spoiled:{cat:'drink',name:'spoiled juice',bad:true,desc:'Leaves you dizzy and confused.'},
 soda:{cat:'drink',name:'sugary soda',bad:true,desc:'Sugar crash. You slow down for a while.'},
 shortcut:{cat:'tip',name:'tip: a shortcut',desc:'Instantly takes you somewhere else on this level.'},
 maptip:{cat:'tip',name:'tip: the layout',desc:'Reveals the layout of this level.'},
 ask:{cat:'tip',name:'tip: what that is',desc:'Identifies one unknown item in your bag.'},
 lucky:{cat:'tip',name:'tip: lucky break',desc:'Recharges all your gadgets and charms.'},
 loud:{cat:'tip',name:'tip: loud gossip',bad:true,desc:'Every animal on this level comes looking for you.'},
 wrong:{cat:'tip',name:'tip: bad directions',bad:true,desc:'Leads trouble right to you.'},
 course:{cat:'course',name:'training course',plural:'training courses',ch:'♦',col:[252,212,92],desc:'Improves one item by +1: a tool, outfit, gadget, accessory, treat bag or charm. This is how you build your character, so choose carefully.'},
 water:{cat:'water',name:'bottle of water',plural:'bottles of water',ch:'!',col:[150,212,255],desc:'Fully quenches your thirst.'},
 dates:{cat:'dates',name:'handful of dates',plural:'handfuls of dates',ch:':',col:[178,96,52],desc:'Sweet khalas dates. Eat them for a little energy and to ease your thirst, or hand-feed them to livestock to win them over: one handful for a sheep or goat, two for a camel.'},
 machboos:{cat:'machboos',name:"mom's machboos",plural:"portions of mom's machboos",ch:':',col:[248,172,60],desc:'Wrapped in foil, still warm. Fully restores energy and raises your max energy by 10.'},
 maamoul:{cat:'gift',name:"box of ma'amoul",plural:"boxes of ma'amoul",ch:'&',col:[222,170,104],desc:'Date-filled cookies, the kind you bring when you visit. Give a box to a trader for a better price, or eat one yourself.'},
 protein:{cat:'protein',name:'protein shake',plural:'protein shakes',ch:'!',col:[240,240,240],desc:'From your gym-obsessed friend. Raises your fitness by 1, so heavier tools and outfits work properly.'},
 pebbles:{cat:'pebbles',name:'pebble',plural:'pebbles',ch:'•',col:[184,174,162],desc:'Throw them at animals for 2–4 damage. Pick them up again afterward.'},
 flashlight:{cat:'gadget',name:'flashlight app',ch:'/',col:[255,242,172],max:3,rech:300,desc:'Dazzles one animal so it can’t act for a few turns.'},
 airhorn:{cat:'gadget',name:'air horn',ch:'/',col:[234,92,82],max:2,rech:450,desc:'HOOOONK. Every hostile animal nearby runs away for a while.'},
 cousin:{cat:'gadget',name:'call-a-cousin',ch:'/',col:[120,184,255],max:1,rech:800,desc:'Calls your cousin, who fights beside you for a while.'},
 drone:{cat:'gadget',name:'camera drone',ch:'/',col:[184,224,224],max:2,rech:500,desc:'Maps the area around you.'},
 dogtreats:{cat:'treat',name:'bag of dog treats',ch:'-',col:[206,134,82],desc:'Throw one at a dog, fox, wolf or hyena and it becomes your loyal friend.'},
 firecrackers:{cat:'treat',name:'string of firecrackers',ch:'-',col:[236,72,60],desc:'Throw for a loud, fiery bang. Hurts and scares animals and sets dry plants alight.'},
 shemagh:{cat:'acc',name:'shemagh',ch:'=',col:[234,84,84],desc:'A red-and-white headscarf. Keeps the sun off, so you get thirsty more slowly.'},
 sandals:{cat:'acc',name:'quiet sandals',ch:'=',col:[186,144,104],desc:'Soft soles. Animals don’t notice you until you’re closer.'},
 watch:{cat:'acc',name:'smart watch',ch:'=',col:[124,204,224],desc:'Your gadgets recharge faster.'},
 band:{cat:'acc',name:'fitness band',ch:'=',col:[124,224,144],desc:'Tracks your rest, so you recover energy faster.'},
 chai:{cat:'charm',name:'chai & istikana',ch:'¤',col:[206,92,62],cd:600,desc:'A flask of strong tea and a little istikana glass. Restores energy. Refills over time.'},
 gahwa:{cat:'charm',name:'dalla of gahwa',ch:'¤',col:[232,202,112],cd:700,desc:'Arabic coffee from a brass dalla. A few small cups make you fast for a while. Refills over time.'},
 carkeys:{cat:'charm',name:'car keys',ch:'¤',col:[204,204,214],cd:900,desc:'Drive straight back to the way up. Refills over time.'}
};
const STACK=new Set(['drink','tip','course','water','dates','machboos','protein','pebbles','gift']);
// Special properties ("runes") that some tools and outfits carry. Revealed when they first trigger or the item is identified.
const RUNES={
 quick:{on:'tool',name:'quick',desc:'Light in the hand: each swing takes half the time.'},
 stun:{on:'tool',name:'stunning',desc:'One in four hits leaves the animal dazed for a moment.'},
 fortune:{on:'tool',name:'lucky',desc:'Animals you drive off sometimes leave cash behind.'},
 sure:{on:'tool',name:'steady',desc:'Easier to aim: you hit far more often.'},
 cool:{on:'outfit',name:'breezy',desc:'Breathes well: you get thirsty much more slowly.'},
 thorny:{on:'outfit',name:'thorny',desc:'Covered in burrs: animals that hit you get hurt too.'},
 sand:{on:'outfit',name:'desert-ready',desc:'Made for the desert: no getting stuck in sabkha, no slowing in dunes, no sand in your throat.'},
 pockets:{on:'outfit',name:'zipped',desc:'Zipped pockets: crows can’t steal your cash.'}
};
const runesFor=cat=>Object.keys(RUNES).filter(k=>RUNES[k].on===cat);
const DRINKS=['juice','laban','energy','mint','spoiled','soda'];
const TIPS=['shortcut','maptip','ask','lucky','loud','wrong'];
const DRINK_APPS=[{n:'neon-green can',pl:'neon-green cans',col:[150,240,92]},{n:'red can',pl:'red cans',col:[234,72,62]},{n:'cloudy bottle',pl:'cloudy bottles',col:[222,222,212]},{n:'orange carton',pl:'orange cartons',col:[246,152,52]},{n:'blue can',pl:'blue cans',col:[84,144,242]},{n:'purple bottle',pl:'purple bottles',col:[176,104,224]}];
const TIP_APPS=[{n:'voice note from your uncle',pl:'voice notes from your uncle',col:[236,226,196]},{n:'forwarded WhatsApp',pl:'forwarded WhatsApps',col:[132,214,140]},{n:'tip from the diwaniya',pl:'tips from the diwaniya',col:[232,190,120]},{n:'sticky note',pl:'sticky notes',col:[244,232,112]},{n:"neighbor's rumor",pl:"neighbors' rumors",col:[204,176,220]},{n:"cousin's tweet",pl:"cousin's tweets",col:[124,190,240]}];
const COURSES=['Excel for Everyone','Forklift Safety','Customer Service Excellence','Basic Welding','Camel Care 101','Advanced Haggling','Desert Driving','First Aid Basics','Public Speaking for the Diwaniya','Small Business Accounting','Social Media Marketing','Falconry Basics'];

function catWeights(cat){
 switch(cat){
  case 'drink':return [['juice',30],['laban',20],['energy',15],['mint',12],['spoiled',15],['soda',12]];
  case 'tip':return [['shortcut',15],['maptip',20],['ask',25],['lucky',12],['loud',13],['wrong',12]];
  case 'tool':return [['pipe',30],['shovel',20],['pitchfork',25],['sledge',15],['stick',6]];
  case 'outfit':return [['overalls',30],['jacket',25],['bisht',20],['safety',15],['dishdasha',6]];
  case 'gadget':return [['flashlight',30],['airhorn',25],['cousin',20],['drone',25]];
  case 'treat':return [['dogtreats',40],['firecrackers',30]];
  case 'acc':return [['shemagh',1],['sandals',1],['watch',1],['band',1]];
  case 'charm':return [['chai',40],['gahwa',30],['carkeys',30]];
 } return [[cat,1]];
}
const ITEM_TABLE=[['drink',22],['tip',18],['course',8],['water',8],['dates',10],['tool',6],['outfit',6],['gadget',4],['treat',6],['acc',3],['charm',2],['pebbles',4],['maamoul',3]];
function randomItemKey(){return wpick(catWeights(wpick(ITEM_TABLE)));}
function makeItem(k){
 const d=IT[k];const it={id:G.nextId++,k,x:0,y:0,q:1};
 switch(d.cat){
  case 'tool':case 'outfit':it.ench=wpick([[-1,2],[0,5],[1,3],[2,1.5],[3,.5]]);it.known=false;it.hits=0;it.wear=0;if(chance(.15))it.rn=pick(runesFor(d.cat));break;
  case 'gadget':it.pw=1;it.mx=d.max;it.c=d.max;it.rt=0;break;
  case 'treat':it.c=k==='dogtreats'?ri(2,3):ri(3,5);break;
  case 'acc':it.pw=wpick([[1,5],[2,3],[3,1]]);break;
  case 'charm':it.pw=1;it.cd=0;break;
  case 'pebbles':it.q=ri(4,8);break;
  case 'dates':it.q=ri(1,3);break;
 }
 return it;
}
const moneyItem=amt=>({id:G.nextId++,k:'money',amt,x:0,y:0});


# Rizq رزق

**A Brogue-inspired roguelike set in modern Kuwait.**

### ▶ Play now: [rizq.sala.company](https://rizq.sala.company)

Free, no sign-up and no install. It runs in any modern browser on desktop or phone.

---

You're young, ambitious and ready to build something. Your uncle keeps sending voice notes full of advice. So you head out to make your own *rizq*: from the Friday market, through Shuwaikh's scrapyards and the Wafra farms, out to the winter camps and the deep desert.

**Goal:** reach **100,000 KD** net worth (cash, savings, and the animals walking with you), then make it back through your front door ⌂.
**Catch:** you get one life, the deeper you go the more you earn, and the deeper you go the more dangerous it gets. Deciding when to turn back is up to you.

## The journey

| Depths | Zone | What you'll find |
| --- | --- | --- |
| 1–4 | **The Neighborhood** | A street grid of walled houses with courtyards, Friday market rows, parking lots and the co-op. Stray cats, pigeons, and crows that steal your cash |
| 5–9 | **Shuwaikh Industrial** | Warehouses, stacked shipping containers, scrapyards, oil puddles, guard dogs, packs of scrapyard dogs |
| 10–14 | **Wafra Farms** | Palm groves, irrigation ditches, livestock pens, angry roosters, bee swarms |
| 15–20 | **The Winter Camps** | Tents, dunes, hidden vipers and scorpions, camel spiders, foxes, camel herds |
| 21–26 | **The Deep Desert** | Sandstorms, sabkha salt flats, howling wolf packs, hyenas, charging bull camels |

## Traders

On depths 2, 5, 9, 12, 16, 20 and 24 a trader waits by the way back: Bu Fahad's diwaniya, Abu Salem's garage, a tea stand, the Wafra farm market, a winter camp, a majlis, and a Bedouin trader. Walk into them to:

- **Buy** water, dates, dog treats, firecrackers, training courses, ma'amoul, and a few pieces of gear.
- **Sell animals** for 80% of their worth, or 130% for the kind the trader wants today. Each trader takes at most three.
- **Bank your cash.** Savings count toward your net worth and crows can't steal them.
- **Call a pickup truck home.** It costs 8% of your net worth and takes 15–25 turns to arrive, so you have to survive until it comes, and stay on that depth. You and every animal with you go straight to your front door.
- **Give ma'amoul** for 20% off everything, and they'll tell you what one unknown item is.

## How it plays

- **No experience points.** You get stronger only from what you find:
  - **Training courses ♦** each improve one item: a tool, outfit, gadget, accessory, treat bag or charm.
  - **Mom's machboos** fully restores your energy and raises your max energy by 10.
  - **Protein shakes** raise your fitness, so heavier tools and outfits work properly.
- **Mystery items.** Drinks are unlabeled cans and bottles, and tips come as voice notes, forwarded WhatsApps and diwaniya advice. You learn what they do by trying them. Some help a lot. Some are spoiled juice or bad directions. Throw a bad drink at animals to dizzy or slow them.
- **Special gear.** Some tools and outfits carry a property: a *quick* or *lucky* shovel, a *breezy* or *desert-ready* outfit, *zipped* pockets that crows can't get into.
- **Build your herd.** Hand-feed dates to win over livestock: one handful for a sheep or goat, two for a camel. The catch is that dates are also your food, and stray cats and foxes will try to steal them. Your animals only count toward your net worth while they're with you, and wolves and hyenas go after them. Press `f` to tell the herd to stay or follow. Dog treats turn a dog, fox, wolf or hyena into a loyal friend. Untie captive salukis and falcons, which are worth a lot.
- **Animals are driven off, never killed,** and each one fights differently. Bull camels charge in straight lines, hyenas circle until you're hurt, wolves howl to call the pack, crows peck and fly off, vipers and scorpions hide until you're close, and bees swarm. Sneak up on a sleeping animal for triple damage.
- **The land fights back.** Heat makes you thirsty. Sandstorms block your view, sabkha mud gets you stuck, and soft dunes slow you down. Fire spreads through grass, palms and oil.
- **Deal rooms.** Three offers on a table. Take one and the other two disappear.

### Your kit

| Type | Examples |
| --- | --- |
| Tools | Shepherd's stick, iron pipe, shovel (hits everything around you), pitchfork (hits two in a line), sledgehammer |
| Outfits | Dishdasha, work overalls, leather jacket (hot!), bisht, safety gear |
| Gadgets | Flashlight app, air horn, call-a-cousin, camera drone |
| Charms | Chai & istikana, dalla of gahwa, car keys |
| Accessories | Shemagh, quiet sandals, smart watch, fitness band |

## Controls

| Key | Action |
| --- | --- |
| Arrows / `hjkl yubn` / numpad | Move. Walk into an animal to shoo it. |
| `x` | Auto-explore (stops when something shows up) |
| `>` / `<` | Travel to the way onward / the way back |
| `z` / `Z` | Wait one turn / rest until recovered |
| `i` | Open your bag |
| `t` | Throw pebbles, drinks, firecrackers or treats |
| `g` | Pick up |
| `f` | Herd: stay or follow |
| `-` / `=` | Zoom the map |
| `m` | Sound on or off |
| `?` | Help |

You can also click or tap to walk anywhere you've seen, and hover over anything to inspect it, including hit chances. On phones there's an on-screen pad: tap to walk, swipe to step, press and hold to inspect. Your run saves automatically in your browser.

**Daily run:** everyone gets the same map each day, and the game remembers your best result.

## Run it locally

The game is plain HTML, CSS and JavaScript with no build step. Clone the repo and serve the folder (opening `index.html` straight from disk also works in most browsers):

```bash
git clone https://github.com/jamalxcode/rizq.git
```

```bash
npm run dev
```

Then open http://localhost:4174.

You can enter a seed on the title screen to replay the same dungeon or share it with a friend.

## Project layout

```
index.html            page markup and styles; loads the scripts below in order
app/data.js           constants and data tables: tiles, zones, animals, traders, items, runes
app/mapgen.js         level generation for each zone, stairs, deal rooms, populating depths
app/world.js          current-level helpers, messages, visual and sound feedback, field of view
app/game.js           starting a run, changing depth, the bag, player actions, items, the turn engine
app/ai.js             animal behavior, auto-explore, travel and resting
app/save.js           saving and loading
app/render.js         drawing the map
app/ui.js             sidebar, inspect text, bag, trader, end screen
app/input.js          keyboard, mouse and touch input; title screen; boot
tests.html            in-browser checks and balance runs against the real game
tests/e2e/            Playwright tests that run in CI
tests/serve.mjs       local static server (npm run dev)
check.html            a bare device check for troubleshooting phones and browsers
CNAME                 custom domain (rizq.sala.company)
```

The scripts are classic (not modules) and share one global scope, so they must load in the order listed in `index.html`.

## Testing and deploys

Every push runs the browser tests in GitHub Actions (`.github/workflows/deploy.yml`). A push to `main` deploys to rizq.sala.company **only if the tests pass**, so a broken change can't reach the live game.

To run them locally:

```bash
npm install
```

```bash
npx playwright install chromium
```

```bash
npm test
```

You can also open [`tests.html`](https://rizq.sala.company/tests.html) in a browser:

- **Run checks** generates all 26 depths for several seeds and verifies that every level is fully connected, with no staircase cutting off part of a map and a trader on every hub depth. It also exercises taming with dates, the trader (buying, selling at the right rates, the three-animal limit, banking, ma'amoul, the delayed truck and losing it if you leave), the herd's stay/follow rule, save/load, and loading old saves.
- **Run balance** lets a bot play full games without cheats and reports how deep it got, its net worth and what ended the run. Use it after changing numbers. As of this version a simple bot reaches depths 20–22 with about 90,000–100,000 KD. Reaching 100,000 plus the truck fee takes careful play.

## Credits

- Inspired by [Brogue](https://sites.google.com/site/broguegame/) by Brian Walker, and by the original *Rogue* (1980).
- Part of the [Sala Company](https://go.sala.company) collection of browser games and tools.

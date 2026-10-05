# Rizq رزق

**A Brogue-inspired roguelike set in modern Kuwait.**

### ▶ Play now: [rizq.sala.company](https://rizq.sala.company)

Free, no sign-up and no install. It runs in any modern browser on desktop or phone.

---

You're young, ambitious and ready to build something. Your uncle keeps sending voice notes full of advice. So you head out to make your own *rizq*: from the Friday market, through Shuwaikh's scrapyards and the Wafra farms, out to the winter camps and the deep desert.

**Goal:** reach **100,000 KD** net worth, then make it back through your front door ⌂.
**Catch:** you get one life, the deeper you go the more you earn, and the deeper you go the more dangerous it gets. Deciding when to turn back is up to you.

## The journey

| Depths | Zone | What you'll find |
| --- | --- | --- |
| 1–4 | **The Neighborhood** | Friday market stalls, parked cars, stray cats, pigeons, and crows that steal your cash |
| 5–9 | **Shuwaikh Industrial** | Scrapyards, oil puddles, guard dogs, packs of scrapyard dogs |
| 10–14 | **Wafra Farms** | Palm groves, irrigation ditches, livestock pens, angry roosters, bees |
| 15–20 | **The Winter Camps** | Tents, dunes, horned vipers, scorpions, camel spiders, foxes, camel herds |
| 21–26 | **The Deep Desert** | Sandstorms, sabkha salt flats, Arabian wolves, hyenas, bull camels |

## How it plays

- **No experience points.** You get stronger only from what you find:
  - **Training courses ♦** each improve one item: a tool, outfit, gadget, accessory, treat bag or charm.
  - **Mom's machboos** fully restores your energy and raises your max energy by 10.
  - **Protein shakes** raise your fitness, so heavier tools and outfits work properly.
- **Mystery items.** Drinks are unlabeled cans and bottles, and tips come as voice notes, forwarded WhatsApps and diwaniya advice. You learn what they do by trying them. Some help a lot. Some are spoiled juice or bad directions.
- **Build your herd.** Barley wins over sheep, goats and camels. They follow you, and each one adds to your net worth. Dog treats turn a dog, fox, wolf or hyena into a loyal friend. Untie captive salukis and falcons, which are worth a lot.
- **Animals are driven off, never killed.** Sneak up on a sleeping animal for triple damage.
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
| `t` | Throw pebbles, firecrackers or treats |
| `g` | Pick up |
| `?` | Help |

You can also click or tap to walk anywhere you've seen, and hover over anything to inspect it, including hit chances. On phones the game shows an on-screen touch pad. Your run saves automatically in your browser.

## Run it locally

The whole game is one self-contained file with no build step and no dependencies. Clone the repo and open `index.html` in a browser:

```bash
git clone https://github.com/jamalxcode/rizq.git
```

You can enter a seed on the title screen to replay the same dungeon or share it with a friend.

## Project layout

```
index.html   the entire game: HTML, CSS and JavaScript
CNAME        custom domain for GitHub Pages (rizq.sala.company)
README.md    this file
```

The site is deployed with GitHub Pages from the `main` branch, so a push to `main` updates the live game.

## Credits

- Inspired by [Brogue](https://sites.google.com/site/broguegame/) by Brian Walker, and by the original *Rogue* (1980).
- Part of the [Sala Company](https://go.sala.company) collection of browser games and tools.

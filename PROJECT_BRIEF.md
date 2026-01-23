# ASTEROID MINER - Complete Project Brief for Claude Code

## PROJECT OVERVIEW

**Asteroid Miner** is a 2D space mining game where players pilot a mining spaceship, scan asteroids, mine resources, refine materials, and sell them for credits. Players upgrade their ship and tools to access larger asteroids and discover new elements.

**Genre**: Idle/Incremental + Action Mining Hybrid
**Platform**: Web (HTML5/Canvas)
**Target Audience**: Casual/idle game players, mining game enthusiasts

---

## CORE GAMEPLAY LOOP

1. **SCAN**: Player initiates scan to find an asteroid (procedurally spawned by size/type)
2. **EXAMINE**: Asteroid displays its composition (what elements it contains)
3. **MINE**: Click MINE button → 1.5-10 second timed mining sequence with progress bar
4. **COLLECT**: Resources automatically added to inventory
5. **SELL**: When hold is full, sell all resources for credits
6. **UPGRADE**: Spend credits on ship level or tool purchases
7. **DISCOVER**: New elements unlock discovery alerts when mined for first time
8. **REPEAT**: Go back to step 1 with better equipment

---

## GAME DESIGN SPECIFICATIONS

### GAME FEEL & AESTHETIC
- **Theme**: Retro-futuristic sci-fi (1980s-style spaceship interface)
- **Visual Style**: 2D top-down view, glowing green-on-black terminal aesthetic
- **Audio**: (Optional for prototype) Mining beeps, scan sounds, background ambient
- **UI Style**: Spaceship cockpit with gauges, digital readouts, glowing borders
- **Font**: Orbitron (display/sci-fi feel), Space Mono (monospace/tech feel)

### CORE MECHANICS
- **Mining is Timed**: Each asteroid takes 1.5-10 seconds to mine (varies by size/ship speed)
- **Hold Capacity Limits**: Inventory fills up; forces strategic decisions (mine or sell?)
- **Power System**: Tools consume power; better tools = higher power cost (risk/reward)
- **Progressive Unlock**: Ship levels gate asteroid sizes; tools gate mining efficiency
- **Element Discovery**: Finding new elements triggers a discovery alert + adds to "discovered" list

---

## TECH STACK (RECOMMENDED)

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Frontend | Vanilla JavaScript + HTML5 Canvas | Simple, fast, no dependencies |
| UI Framework | HTML/CSS (no framework) | CSS handles gauges, buttons, layout |
| Storage | LocalStorage | Single-player save/load, no backend needed |
| Deployment | Netlify or Itch.io | Free, reliable hosting for web games |
| Audio | Web Audio API (optional) | Native browser audio, no library needed |

**No build tools needed yet.** Single `.html` file with embedded CSS and JavaScript.

---

## CURRENT STATUS

✅ **COMPLETE**:
- Working prototype (`game.html`) with basic mining mechanics
- 3-panel spaceship UI (left controls, center asteroid view, right inventory)
- Gauge interface (power, laser, hold capacity)
- Element discovery system
- Sell resources functionality
- Retro sci-fi visual aesthetic with scanlines

❌ **NOT YET IMPLEMENTED**:
- Ship levels (5 tiers: Scout → Titan)
- Tool system (equippable tools with bonuses)
- Asteroid type variety (4 types with different compositions)
- Asteroid size variety (6 sizes with different yields)
- Power management (tools drain battery)
- Upgrade shop UI

📋 **NEXT PRIORITIES** (in order):
1. Ship upgrade system (unlock Prospector, Harvester, etc.)
2. Tool system (equip multiple tools, calculate bonuses)
3. Asteroid variety (spawn different types/sizes based on ship class)
4. Polish and balancing

---

## SHIP LEVELS (5 Tiers)

| Ship | Hold | Speed | Slots | Cost | Unlock | Special |
|------|------|-------|-------|------|--------|---------|
| SCOUT | 100 | 3s | 1 | Free | Start | Small asteroids only |
| PROSPECTOR | 150 | 2.5s | 2 | 2,000₹ | After Scout | Small/Medium asteroids |
| HARVESTER | 250 | 2s | 3 | 8,000₹ | After Prospector | All asteroids |
| INDUSTRIAL | 400 | 1.5s | 3 | 25,000₹ | After Harvester | Dual mining (2 at once) |
| TITAN | 600 | 1s | 4 | 75,000₹ | Endgame | Dual mining + rare element boost |

**Hold** = cargo capacity in units
**Speed** = mining time per asteroid
**Slots** = how many tools can be equipped simultaneously
**Cost** = credits needed to upgrade to this ship

---

## TOOLS (Equippable Mining Equipment)

Tools are purchased with credits and equipped in available slots. Effects **STACK** when multiple tools equipped.

### TIER 1 TOOLS (500-700₹)

| Tool | Yield | Rare Element Bonus | Power Cost | Cost | Effect |
|------|-------|-------------------|-----------|------|--------|
| Precision Cutter | +10% | +5% | +10% | 500₹ | Balanced early-game tool |
| Power Hammer | +20% | -5% | +30% | 800₹ | High yield, high power drain |
| Resonance Probe | +5% | +10% | +15% | 700₹ | Best for finding rare elements |

### TIER 2 TOOLS (2000-3000₹)

| Tool | Yield | Bonus Effect | Power Cost | Cost |
|------|-------|-------------|-----------|------|
| Diamond Saw | +35% | - | +40% | 2,500₹ |
| Element Separator | +15% | Auto-refines 20% of ore | +25% | 3,000₹ |
| Deep Scanner | +0% | Reveals asteroid composition before mining | +5% | 2,000₹ |

### TIER 3 TOOLS (8000-12000₹, Endgame)

| Tool | Yield | Rare Bonus | Power Cost | Cost | Special |
|------|-------|-----------|-----------|------|---------|
| Plasma Cutter | +50% | +12% | +60% | 8,000₹ | Maximum yield |
| Molecular Extractor | +25% | - | +35% | 10,000₹ | Auto-refines 50% |
| Void Resonator | +40% | +25% | +70% | 12,000₹ | 5% chance exotic elements |

**Yield** = % increase in resources extracted
**Rare Element Bonus** = % increase chance of finding rare elements (Co, Cr, Mn)
**Power Cost** = additional battery drain while using this tool
**Auto-refine** = processed materials don't need manual refining (future feature)

---

## ASTEROIDS (Types, Sizes, Compositions)

### ASTEROID SIZES (6 Classes)

| Size | Yield | Time | Hold | Ship Access | Purpose |
|------|-------|------|------|------------|---------|
| TINY | 40-60 | 1.5s | Small | All ships | Beginner farming |
| SMALL | 80-120 | 2.5s | Small | Scout+ | Early game grind |
| MEDIUM | 150-220 | 3.5s | Medium | Prospector+ | Mid-game |
| LARGE | 280-400 | 5s | Large | Harvester+ | Major hauls |
| MASSIVE | 500-700 | 7s | Huge | Industrial+ | Endgame farming |
| COLOSSAL | 1000+ | 10s | Ultra | Titan only | Rare, ultra-valuable |

### ASTEROID TYPES (4 Core + Future Exotic)

#### TYPE A: IRON-NICKEL (40% spawn rate)
- **Composition**: Fe 88-92%, Ni 5-8%, Co 1-2%
- **Character**: Most common, reliable, beginner-friendly
- **Value**: High volume, moderate value
- **Visual**: Dark metallic gray
- **Best For**: Early-game farming

Example small asteroid:
```
Fe: 95 units (90%)
Ni: 7 units (7%)
Co: 3 units (3%)
```

#### TYPE B: CARBONACEOUS (35% spawn rate)
- **Composition**: O 35-40%, Si 18-22%, Mg 12-15%, Fe 8-12%, S 3-5%, Ni 1-2%
- **Character**: Diverse mix, good variety, silicates + sulfur
- **Value**: Medium volume, moderate-high value
- **Visual**: Dark gray-brown with dusty texture
- **Best For**: Mid-game, elemental diversity

Example medium asteroid:
```
O: 74 units (37%)
Si: 40 units (20%)
Mg: 30 units (15%)
Fe: 22 units (11%)
S: 10 units (5%)
Ni: 24 units (12%)
```

#### TYPE C: RARE-EARTH (20% spawn rate)
- **Composition**: Fe 25-30%, Ni 8-12%, O 20-25%, Si 10-12%, **Co 3-5%**, **Cr 2-4%**, **Mn 1-3%**, Mg 3-5%, S 2-3%
- **Character**: Concentrates rare elements (Co, Cr, Mn)
- **Value**: Lower volume, MUCH higher value (rare elements)
- **Visual**: Shimmering dark with metallic flecks
- **Bonus**: +20% rare element yield when mined
- **Best For**: Late-game, rare element hunting
- **Premium Tools**: Void Resonator (+25% on these)

Example large asteroid:
```
Fe: 90 units (24%)
Ni: 36 units (10%)
O: 90 units (24%)
Si: 39 units (11%)
Co: 30 units (8%) ← CONCENTRATED
Cr: 12 units (3%)
Mn: 6 units (2%)
Mg: 15 units (4%)
S: 6 units (2%)
```

#### TYPE D: OLIVINE-RICH (5% spawn rate)
- **Composition**: O 45-50%, Si 25-30%, Mg 15-20%, Fe 3-5%, Ni 1-2%
- **Character**: Massive silicate volume, low variety
- **Value**: Huge volume, modest value
- **Visual**: Olive-green/brown, shiny
- **Bonus**: +30% volume yield
- **Best For**: Pure volume farming, bulk materials
- **Use Case**: When hold is empty, mine Olivine to fill fast

Example massive asteroid:
```
O: 320 units (45%)
Si: 210 units (30%)
Mg: 120 units (17%)
Fe: 30 units (4%)
Ni: 15 units (2%)
```

### ASTEROID SPAWN PROBABILITIES

**Scout Class** (small asteroids only):
- Tiny: 30%, Small: 70%
- Types: Iron-Nickel 60%, Carbonaceous 40%

**Prospector Class** (small-medium):
- Tiny: 10%, Small: 60%, Medium: 30%
- Types: Iron-Nickel 45%, Carbonaceous 40%, Rare-Earth 15%

**Harvester Class** (all asteroids):
- Tiny: 5%, Small: 40%, Medium: 40%, Large: 15%
- Types: Iron-Nickel 35%, Carbonaceous 35%, Rare-Earth 20%, Olivine 10%

**Industrial Class** (better spawns):
- Small: 10%, Medium: 35%, Large: 40%, Massive: 15%
- Types: Iron-Nickel 30%, Carbonaceous 30%, Rare-Earth 25%, Olivine 15%

**Titan Class** (best spawns):
- Medium: 5%, Large: 30%, Massive: 55%, Colossal: 10%
- Types: Iron-Nickel 20%, Carbonaceous 25%, Rare-Earth 35%, Olivine 15%, Exotic 5%

---

## ELEMENT SYSTEM (9 Core Elements)

| Element | Symbol | Base Price | Rarity | Found In |
|---------|--------|-----------|--------|----------|
| Iron | Fe | 50₹ | Common | All types |
| Oxygen | O | 20₹ | Common | Carbonaceous, Olivine |
| Silicon | Si | 40₹ | Common | Carbonaceous, Olivine |
| Nickel | Ni | 150₹ | Uncommon | Iron-Nickel, Rare-Earth |
| Magnesium | Mg | 80₹ | Uncommon | Carbonaceous, Olivine |
| Sulfur | S | 60₹ | Uncommon | Carbonaceous |
| **Cobalt** | **Co** | **200₹** | **Rare** | **Rare-Earth** |
| **Chromium** | **Cr** | **180₹** | **Rare** | **Rare-Earth** |
| **Manganese** | **Mn** | **120₹** | **Rare** | **Rare-Earth** |

**Discovery System**: First time mining an element shows golden alert. Discovered elements add to player's collection.

---

## GAME STATE DATA MODEL

```javascript
gameState = {
  // PLAYER PROGRESS
  credits: 5000,
  current_ship_level: 1,  // 1-5 (Scout to Titan)
  discovered_elements: ["Fe", "Ni", "O"],
  
  // EQUIPMENT
  equipped_tools: [
    { id: "precision_cutter", slot: 0 },
    { id: "resonance_probe", slot: 1 }
  ],
  tools_owned: {
    "precision_cutter": true,
    "power_hammer": false,
    "void_resonator": false
  },
  
  // CURRENT MINING STATE
  asteroid: {
    type: "iron_nickel",  // Type: iron_nickel, carbonaceous, rare_earth, olivine
    size: "small",        // tiny, small, medium, large, massive, colossal
    composition: {
      Fe: 90,
      Ni: 8,
      Co: 2
    },
    mined_amount: {
      Fe: 45,
      Ni: 4,
      Co: 1
    },
    total_mined: 50
  },
  
  // INVENTORY
  inventory: {
    Fe: 150,
    Ni: 45,
    Co: 12
  },
  hold_capacity: 100,
  hold_used: 207,
  
  // GAUGE STATES
  power: 100,
  is_mining: false,
  mining_progress: 0.65  // 0-1
}
```

---

## UI LAYOUT (3-Panel Cockpit)

### LEFT PANEL (Mining Controls)
- ⚡ Power Cell gauge (green, 0-100%)
- 🔨 Mining Laser gauge (orange, status)
- 📦 Hold Capacity gauge (blue, X/Y units)
- Status text ("AWAITING ASTEROID LOCK", "MINING COMPLETE", etc.)
- [SCAN] button (yellow, initiates asteroid spawn)
- [MINE] button (disabled until asteroid scanned)

### CENTER PANEL (Game View)
**TOP**: Asteroid display
- Visual asteroid (circle with rocky texture, sized 80-300px based on asteroid size)
- Mining progress bar (shows during mining, orange)
- Glowing effect when locked

**BOTTOM**: Composition Info
- "ASTEROID COMPOSITION" header
- Grid of 2 columns showing elements: Element symbol, percentage of asteroid

### RIGHT PANEL (Inventory & Upgrades)
- 💰 Credit display (big, green, glowing) "₹ 5000 CREDITS"
- **INVENTORY** section (scrollable list)
  - Element name (Fe), amount (150 kg), value (₹7500)
- **UPGRADES** section
  - Ship upgrade card (show current level, cost for next, can't afford/can afford)
  - Tool upgrade cards (3-4 visible, scroll if more)
- [SELL ALL RESOURCES] button (large, green, glowing)

---

## COLOR SCHEME (Retro Sci-Fi CRT)

| Element | Color | Use |
|---------|-------|-----|
| Primary | #00ff88 (neon green) | Borders, gauges, main text, active states |
| Secondary | #0099ff (cyan/blue) | Inventory, secondary info, accents |
| Accent | #ff8800 (orange) | Laser gauge, mining effects, warnings |
| Gold | #ffc800 | Discovery alerts, rare items |
| Success | #00ff00 (bright green) | Sell button, positive actions |
| Background | #0a0e27 (dark blue-black) | Main bg color |
| Text | #00ff88 | Default text |

**Effects**:
- Glowing text-shadow for title text
- Box-shadow glows on active UI elements
- Scanlines overlay (subtle horizontal lines)
- Slight color bloom on gauges during mining

---

## PROGRESSION PACING

**Early Game (Scout Class)**
- Farm Tiny/Small Iron-Nickel asteroids
- Takes ~15-20 minutes to accumulate 2,000₹
- Goal: Unlock Prospector

**Mid Game (Prospector → Harvester)**
- Access Medium asteroids, more asteroid types
- Buy mid-tier tools (Diamond Saw, Element Separator)
- Takes ~30-60 minutes to accumulate 25,000₹
- Goal: Unlock Harvester, then Industrial

**Late Game (Industrial → Titan)**
- Farm Large/Massive asteroids
- Hunt Rare-Earth asteroids for rare element farming
- Takes 1-2+ hours to accumulate 75,000₹
- Goal: Reach Titan, optimize farm routes

**Endgame (Titan)**
- Farm Colossal asteroids (rare spawns)
- Hunt for undiscovered elements
- Optimize for credits/hour
- Collect all element types

---

## SPECIAL MECHANICS (Optional Enhancements)

These are cool ideas but NOT required for MVP:

### Metallic Sheath (10% of asteroids)
- Visual: Shiny metallic coating
- Effect: First 20% of mining yields +50% rare elements
- Reward: Speed mining pays off

### Fractured Core (5% of large/massive asteroids)
- Visual: Visible cracks on surface
- Effect: Mining 40% faster, but 15% chance of material loss
- Risk/reward variant

### Unstable Decay (3% of rare-earth asteroids)
- Visual: Glowing pulsing surface
- Effect: 5x rare element yield for 2 cycles, then asteroid disappears
- Time-pressure gameplay

---

## IMPLEMENTATION PRIORITIES

### PHASE 1: SHIP SYSTEM (DO FIRST)
- [ ] Create ship data structure with stats
- [ ] Add current_ship_level to gameState
- [ ] Build ship upgrade UI/modal
- [ ] Add purchase logic and credit deduction
- [ ] Update mining speed based on ship
- [ ] Update hold capacity based on ship
- [ ] Gate asteroid sizes by ship (Scout can't mine Medium+)
- [ ] Save/load ship level to LocalStorage

### PHASE 2: TOOL SYSTEM (DO NEXT)
- [ ] Create tool data structure
- [ ] Build tool equip interface
- [ ] Calculate yield bonuses from equipped tools (stacking)
- [ ] Calculate power cost from equipped tools (stacking)
- [ ] Track which tools player owns
- [ ] Build tool shop UI
- [ ] Add purchase logic
- [ ] Save/load equipped tools to LocalStorage

### PHASE 3: ASTEROID VARIETY (DO THIRD)
- [ ] Create asteroid type definitions (compositions)
- [ ] Modify spawn logic (weighted by type + ship)
- [ ] Assign type-specific visuals (colors)
- [ ] Update composition display for current asteroid
- [ ] Spawn size variation (Tiny-Colossal per ship)
- [ ] Adjust yield calculations by size

### PHASE 4: POWER SYSTEM (NICE TO HAVE)
- [ ] Add power gauge to left panel
- [ ] Calculate power consumption per mining cycle
- [ ] Drain power during mining
- [ ] Recharge between cycles
- [ ] Fail mining if power runs out mid-cycle
- [ ] Show power cost when hovering tools

### PHASE 5: POLISH & BALANCE (FINAL)
- [ ] Tweak prices, yields, mining times
- [ ] Improve asteroid visuals (procedural rocks)
- [ ] Add sound effects (optional)
- [ ] Test progression pacing
- [ ] Bug fixes and optimization

---

## STARTING FILES PROVIDED

**`game.html`** (CURRENT WORKING PROTOTYPE)
- Fully functional basic mining loop
- 3-panel UI in place
- Retro sci-fi styling (good starting point)
- LocalStorage save/load working
- Element discovery system working

**DESIGN DOCUMENTS** (REFERENCE):
- `ship_progression_design.md` - Detailed ship/tool progression
- `asteroid_system_design.md` - Detailed asteroid types/sizes/compositions
- `PROJECT_BRIEF.md` (this file)

---

## HOW TO HAND OFF TASKS TO CLAUDE CODE

### For Ship System Implementation:
```
CONTEXT: See PROJECT_BRIEF.md (SHIP LEVELS section)
TASK: Implement ship upgrade system
SPECS:
  - 5 ship tiers (Scout → Titan)
  - Each costs listed in table
  - Unlocks larger asteroids
  - Updates hold_capacity and mining speed
INTEGRATION:
  - Update gameState.current_ship_level
  - Add UI modal in right panel
  - Gates asteroid spawning
TESTING:
  - Can buy Prospector with 2000 credits
  - Mining speed visibly increases
  - Can't mine Medium with Scout
  - Save/load preserves ship level
```

### For Tool System Implementation:
```
CONTEXT: See PROJECT_BRIEF.md (TOOLS section)
TASK: Implement tool equipping system
SPECS:
  - 3 equipment slots (varies by ship)
  - Tools stack bonuses
  - Display yield + power cost totals
INTEGRATION:
  - gameState.equipped_tools array
  - gameState.tools_owned object
  - UI grid showing available tools
  - [EQUIP] buttons
TESTING:
  - 2 tools: verify yield bonuses add
  - 3 tools: verify power cost adds
  - Unequip removes bonuses
  - Save/load persists equipped tools
```

---

## TESTING CHECKLIST (Before Each Hand-Off)

- [ ] Game loads without errors
- [ ] Scan spawns asteroid
- [ ] Mining progresses over 3-10 seconds
- [ ] Resources added to inventory
- [ ] Hold capacity updates
- [ ] Can sell resources for credits
- [ ] Discovery alerts appear for new elements
- [ ] Save/load preserves progress (open DevTools, check localStorage)
- [ ] Visual feedback for all interactions (button clicks, mining, etc.)
- [ ] Numbers match CONFIG (prices, times, yields)

---

## GLOSSARY & TERMINOLOGY

| Term | Meaning |
|------|---------|
| **Hold/Cargo** | Inventory space for collected resources |
| **Mine/Mining** | The act of extracting resources from an asteroid (timed action) |
| **Refine** | (Future feature) Process raw ore into usable materials |
| **Yield** | Amount of resources extracted from one mining cycle |
| **Tool Slot** | Equipment slot to install mining tools (1-4 depending on ship) |
| **Rare Elements** | Co, Cr, Mn (high-value, found in Rare-Earth asteroids) |
| **Discovery** | First time obtaining a new element (triggers alert) |
| **Exotic** | (Future) Ultra-rare elements only found on rare Colossal asteroids |
| **Power Cost** | Energy consumed by tools during mining |
| **Stacking** | Multiple tools apply bonuses together (e.g., 2x Precision = +20% yield) |

---

## ADDITIONAL NOTES

- **Single-Player Focus**: Game is designed as single-player idle/incremental (no multiplayer yet)
- **No Backend Needed**: All save data in LocalStorage, runs entirely in browser
- **Mobile Support**: Not designed for mobile (3-panel layout too complex), but could adapt later
- **Monetization**: Not included in prototype (consider cosmetics, faster progression, cosmetic ships if commercializing)
- **Lore**: Space mining company, player is captain of mining vessel, discover new elements, expand fleet
- **Future Expansions**: Multiplayer, trading, base building, story campaign, exotic elements, procedural generation

---

## QUICK START FOR CLAUDE CODE

1. Read **PROJECT OVERVIEW** section above
2. Review **CORE GAMEPLAY LOOP**
3. Check **SHIP LEVELS** table (next feature)
4. Look at **GAME STATE DATA MODEL** (data structure)
5. Reference **IMPLEMENTATION PRIORITIES** (what's next)
6. Read the specific feature section (TOOLS, ASTEROIDS, etc.)
7. Test against **TESTING CHECKLIST**

**Keep this brief accessible.** Copy/paste relevant sections when handing off specific tasks.

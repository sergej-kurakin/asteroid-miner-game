# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Asteroid Miner** is a 2D space mining idle/incremental game built with TypeScript and HTML5 Canvas. Players pilot mining spaceships, scan asteroids, mine resources, and upgrade equipment.

- **Tech Stack**: TypeScript with modular architecture, bundled to single JavaScript file
- **Build System**: TypeScript (type-checking) + esbuild (bundling)
- **Storage**: LocalStorage for save/load
- **Visual Style**: Retro-futuristic sci-fi (1980s CRT terminal aesthetic, green-on-black)

## Architecture

### Source Structure

Each module in `src/` follows the pattern: `interfaces.ts` → `constants.ts` → logic files → `controller.ts` → `index.ts`.

- `game.ts` — Main game loop, wires controllers and UI
- `asteroids/` — Asteroid generation, weighted random by ship level
- `mining/` — Mining yield calculations (`system.ts`) and mining flow (`controller.ts`)
- `ships/` — Ship tiers, upgrade logic
- `tools/` — Tool buy/equip/unequip, bonus aggregation
- `power/` — Power purchase and capacity
- `config/` — Elements, prices, settings
- `gamestate/` — `GameState` type and `StateObserver` (Observable pattern)
- `ui/` — DOM components extending `BaseComponent`, in `ui/components/`
- `persistence.ts` — Save/load to LocalStorage

### Build Process

**Development:**
```bash
npm run dev          # Watch mode with auto-rebuild
npm run typecheck    # Type-check only
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

**Production:**
```bash
npm run build        # Clean + typecheck + bundle to dist/game.js
```

The build creates a single bundled JavaScript file (`dist/game.js`) from all TypeScript modules.

### Game State Model

The central `GameState` (in `src/gamestate/interfaces.ts`) is wrapped in a `StateObserver` (Observable pattern). Controllers read/write state via `observer.getState()` and `observer.setState()`, and UI components subscribe to changes.

Fields:
- `credits` - Currency for upgrades
- `current_ship_level` - 1-5 (Scout → Titan)
- `discovered_elements` - Array of element symbols found
- `equipped_tools` - Array of `EquippedTool` (toolId + slot index)
- `tools_owned` - Array of owned tool ID strings
- `asteroid` - Current asteroid (type, size, composition) or null
- `inventory` - Object mapping element symbols to amounts
- `hold_capacity`, `hold_used` - Cargo limits
- `power`, `power_capacity` - Power cell state
- `is_mining`, `mining_progress` - Mining state

### Core Systems

**Ship Progression (5 tiers)** (`src/ships/`):
- Scout (free) → Prospector (2k) → Harvester (8k) → Industrial (25k) → Titan (75k)
- Each tier increases: hold capacity, power cell, mining speed, tool slots, asteroid size access
- `ShipController` handles upgrade logic; updates `hold_capacity` and `power_capacity` on upgrade

**Tool System** (`src/tools/`):
- 10 tools across 4 tiers: Tier 0 (free default), Tier 1 (500-800₹), Tier 2 (2000-3000₹), Tier 3 (8000-12000₹)
- Tools purchased and equipped in slots (1-4 slots based on ship)
- Effects stack: `yieldBonus`, `rareBonus`, `powerCostBonus`
- `ToolController` handles buy/equip/unequip; `getToolBonuses()` aggregates equipped tool effects

**Power System** (`src/power/`):
- Power consumed when mining (base cost modified by tool `powerCostBonus`)
- `PowerController` handles buying power (costs credits)
- `power_capacity` scales with ship tier

**Asteroid System** (`src/asteroids/`):
- **6 sizes**: Tiny → Small → Medium → Large → Massive → Colossal
- **4 types**: Iron-Nickel (40%), Carbonaceous (35%), Rare-Earth (20%), Olivine (5%)
- **Ship-gated**: Higher ship levels unlock larger asteroids and better spawn rates
- **Dynamic generation**: Weighted random selection based on ship level
- Composition randomized within type-specific ranges
- Type bonuses (e.g., Olivine +30% yield, Rare-Earth +20% rare elements)

**Element Economy**:
- 9 elements: Fe, O, Si, Ni, Mg, S, Co (rare), Cr (rare), Mn (rare)
- Prices defined in `src/config/config.ts`
- Discovery system triggers alerts for first-time finds

### UI Structure (3-Panel Cockpit)

- **Left Panel**: Mining controls, gauges (power, laser, hold), SCAN/MINE buttons
- **Center Panel**: Asteroid display, composition info, mining progress
- **Right Panel**: Credits, ship info with upgrade button, inventory list, SELL button

## Implementation Priorities

Current development order per `docs/PROJECT_BRIEF.md`:
1. ✅ Ship upgrade system
2. ✅ Asteroid type/size variety
3. ✅ Tool equipping system
4. ✅ Power management system
5. Polish and balancing

## Design References

- `docs/PROJECT_BRIEF.md` - Complete game spec, data models, UI layout
- `docs/ship_progression_design.md` - Ship tiers, tool stats, power system
- `docs/asteroid_system_design.md` - Asteroid types, sizes, compositions, spawn rates
- `docs/TYPESCRIPT_SETUP.md` - Build system and architecture details
- `docs/POWER_SYSTEM.md` - Power management system design

## Development Guidelines

### Code Organization

- **Keep modules focused**: Each module in `src/` has a single responsibility
- **Use public APIs**: Import from module index files (e.g., `./asteroids` not `./asteroids/generator`)
- **Type everything**: Leverage TypeScript's strict mode
- **Avoid circular dependencies**: Keep dependency graph unidirectional

### Making Changes

1. Edit TypeScript files in `src/`
2. Run `npm run typecheck` to verify types
3. Run `npm test` to run unit tests
4. Run `npm run build` or use `npm run dev` for auto-rebuild
5. Test in browser by opening `game.html`

### Writing Tests

- Test files are co-located with source files using `.test.ts` suffix
- Uses Vitest with Jest-compatible API (`describe`, `it`, `expect`, `vi`)
- Run `npm run test:watch` during development for continuous testing

### Adding New Modules

1. Create directory in `src/`
2. Add `interfaces.ts` for type definitions
3. Implement functionality in separate files
4. Export public API via `index.ts`
5. Import from other modules using the index

### Common Tasks

**Add a new tool:**
- Add `ToolData` entry to `TOOLS` array in `src/tools/constants.ts`
- Assign a unique `id`, `tier`, `cost`, and bonus values (`yieldBonus`, `rareBonus`, `powerCostBonus`)

**Add a new asteroid type:**
- Update `AsteroidType` in `src/asteroids/interfaces.ts`
- Add configuration in `ASTEROID_TYPES` in `src/asteroids/constants.ts`
- Update spawn rates in `SHIP_SPAWN_CONFIG`

**Add a new ship tier:**
- Add entry to `SHIPS` array in `src/ships/constants.ts`
- Update `MAX_SHIP_LEVEL` in `src/ships/constants.ts`
- Update spawn probabilities in `src/asteroids/constants.ts`

**Add a new element:**
- Add to `elements` in `src/config/config.ts`
- Add to relevant asteroid type compositions in `src/asteroids/constants.ts`

**Add a new UI component:**
- Create component file in `src/ui/components/`, extending `BaseComponent`
- Use `subscribeToMultiple()` to react to state changes
- Export from `src/ui/index.ts`
- Wire up in `src/game.ts`

**Add a new GameState field:**
- Add field to `GameState` in `src/gamestate/interfaces.ts`
- Add to `SaveData` and defaults in `src/persistence.ts`
- Update `createInitialState()` in all test files (12+ files)

## Color Palette

| Use | Hex |
|-----|-----|
| Primary (borders, gauges, text) | #00ff88 |
| Secondary (inventory, accents) | #0099ff |
| Accent (mining, warnings) | #ff8800 |
| Gold (discovery, rare) | #ffc800 |
| Background | #0a0e27 |

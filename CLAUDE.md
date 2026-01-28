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

```
src/
├── game.ts              # Main game logic, UI rendering, event handlers
├── asteroids/           # Asteroid generation system
│   ├── interfaces.ts    # Type definitions
│   ├── constants.ts     # Size/type configurations, spawn rates
│   ├── utils.ts         # Random selection, normalization
│   ├── generator.ts     # Main generation logic
│   └── index.ts         # Public API
├── ships/               # Ship configurations
│   ├── interfaces.ts    # Ship type definitions
│   └── ships.ts         # 5 tier definitions
├── config/              # Game configuration
│   ├── interfaces.ts    # Config types
│   └── config.ts        # Elements, prices, settings
├── gamestate/           # State management
│   └── interfaces.ts    # GameState type
└── persistence.ts       # Save/load to LocalStorage
```

### Build Process

**Development:**
```bash
npm run dev          # Watch mode with auto-rebuild
npm run typecheck    # Type-check only
```

**Production:**
```bash
npm run build        # Clean + typecheck + bundle to dist/game.js
```

The build creates a single bundled JavaScript file (`dist/game.js`) from all TypeScript modules.

### Game State Model

The central `gameState` object tracks all player progress:
- `credits` - Currency for upgrades
- `current_ship_level` - 1-5 (Scout → Titan)
- `discovered_elements` - Array of element symbols found
- `equipped_tools` - Array of tool objects with slot assignments
- `tools_owned` - Object tracking purchased tools
- `asteroid` - Current asteroid being mined (type, size, composition)
- `inventory` - Object mapping element symbols to amounts
- `hold_capacity`, `hold_used` - Cargo limits
- `power`, `is_mining`, `mining_progress` - Mining state

### Core Systems

**Ship Progression (5 tiers)**:
- Scout (free) → Prospector (2k) → Harvester (8k) → Industrial (25k) → Titan (75k)
- Each tier increases: hold capacity, mining speed, tool slots, asteroid size access
- Defined in `src/ships/ships.ts`

**Tool System**:
- Tools purchased and equipped in slots (1-4 slots based on ship)
- Effects stack: yield bonuses, rare element bonuses, power costs
- Three tiers: Basic (500-800₹), Mid (2000-3000₹), Endgame (8000-12000₹)

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

Current development order per PROJECT_BRIEF.md:
1. ✅ Ship upgrade system (implemented)
2. ✅ Asteroid type/size variety (implemented)
3. Tool equipping system (in progress)
4. Power management system
5. Polish and balancing

## Design References

- `PROJECT_BRIEF.md` - Complete game spec, data models, UI layout
- `ship_progression_design.md` - Ship tiers, tool stats, power system
- `asteroid_system_design.md` - Asteroid types, sizes, compositions, spawn rates
- `TYPESCRIPT_SETUP.md` - Build system and architecture details

## Development Guidelines

### Code Organization

- **Keep modules focused**: Each module in `src/` has a single responsibility
- **Use public APIs**: Import from module index files (e.g., `./asteroids` not `./asteroids/generator`)
- **Type everything**: Leverage TypeScript's strict mode
- **Avoid circular dependencies**: Keep dependency graph unidirectional

### Making Changes

1. Edit TypeScript files in `src/`
2. Run `npm run typecheck` to verify types
3. Run `npm run build` or use `npm run dev` for auto-rebuild
4. Test in browser by opening `game.html`

### Adding New Modules

1. Create directory in `src/`
2. Add `interfaces.ts` for type definitions
3. Implement functionality in separate files
4. Export public API via `index.ts`
5. Import from other modules using the index

### Common Tasks

**Add a new asteroid type:**
- Update `AsteroidType` in `src/asteroids/interfaces.ts`
- Add configuration in `ASTEROID_TYPES` in `src/asteroids/constants.ts`
- Update spawn rates in `SHIP_SPAWN_CONFIG`

**Add a new ship tier:**
- Add entry to `SHIPS` array in `src/ships/ships.ts`
- Update spawn probabilities in `src/asteroids/constants.ts`

**Add a new element:**
- Add to `elements` in `src/config/config.ts`
- Add to relevant asteroid type compositions in `src/asteroids/constants.ts`

## Color Palette

| Use | Hex |
|-----|-----|
| Primary (borders, gauges, text) | #00ff88 |
| Secondary (inventory, accents) | #0099ff |
| Accent (mining, warnings) | #ff8800 |
| Gold (discovery, rare) | #ffc800 |
| Background | #0a0e27 |

# TypeScript Setup Guide

The game is built with TypeScript using a modular architecture and bundled into a single JavaScript file for easy deployment.

## Project Architecture

### Source Structure (`src/`)

```
src/
├── game.ts              # Main game logic and initialization
├── asteroids/
│   ├── interfaces.ts    # Type definitions for asteroids
│   ├── constants.ts     # Asteroid configurations (sizes, types, spawn rates)
│   ├── utils.ts         # Utility functions (random, weighted selection)
│   ├── generator.ts     # Asteroid generation logic
│   └── index.ts         # Public API exports
├── ships/
│   ├── interfaces.ts    # Ship type definitions
│   └── ships.ts         # Ship tier configurations
├── config/
│   ├── interfaces.ts    # Config type definitions
│   └── config.ts        # Game configuration (elements, prices, settings)
├── gamestate/
│   └── interfaces.ts    # GameState type definition
└── persistence.ts       # Save/load system
```

### Build Output (`dist/`)

```
dist/
├── game.js              # Single bundled JavaScript file
└── game.js.map          # Source map for debugging
```

## Quick Start

### Installation

```bash
npm install
```

This installs:
- `typescript` - Type checker
- `esbuild` - Fast bundler

### Development Workflow

**1. Build once:**
```bash
npm run build
```
This runs:
1. Type checking with TypeScript
2. Bundling all modules into `dist/game.js` with esbuild

**2. Development mode (auto-rebuild):**
```bash
npm run dev
```
This watches for file changes and automatically rebuilds.

**3. Type-check only:**
```bash
npm run typecheck
```
Runs TypeScript type checking without bundling.

**4. Clean build:**
```bash
npm run clean
```
Removes the `dist/` folder.

### Running the Game

Open `game.html` in a browser (already configured to load `dist/game.js`):

```bash
# Direct file access
open game.html

# Or use a local server
python3 -m http.server 8000
# Visit http://localhost:8000/game.html
```

## Build System Details

### TypeScript Configuration (`tsconfig.json`)

- **Target**: ES2020 (modern JavaScript)
- **Module**: ES2020 (ESM imports/exports)
- **Strict mode**: Enabled for maximum type safety
- **No emit**: TypeScript only checks types, esbuild handles compilation
- **Include**: All files in `src/**/*.ts`

### esbuild Bundler

esbuild bundles all TypeScript modules into a single JavaScript file:

```bash
esbuild src/game.ts --bundle --outfile=dist/game.js --format=iife --sourcemap
```

- **Entry point**: `src/game.ts`
- **Bundle**: Combines all imports into one file
- **Format**: IIFE (Immediately Invoked Function Expression) for browsers
- **Sourcemap**: Enables debugging with original TypeScript files

### NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Full build: clean → typecheck → bundle |
| `npm run dev` | Watch mode for development |
| `npm run watch` | Alias for dev |
| `npm run typecheck` | Type-check without bundling |
| `npm run bundle` | Bundle without type-checking |
| `npm run clean` | Remove dist folder |

## TypeScript Features

### Type Definitions

**Asteroid System:**
- `AsteroidSize` - 'tiny' | 'small' | 'medium' | 'large' | 'massive' | 'colossal'
- `AsteroidType` - 'iron_nickel' | 'carbonaceous' | 'rare_earth' | 'olivine'
- `Asteroid` - Complete asteroid with composition, yield, mining time
- `AsteroidSizeConfig` - Size parameters (yield, time, ship level)
- `AsteroidTypeConfig` - Type parameters (composition, bonuses)

**Ship System:**
- `ShipData` - Ship tier with stats (hold, slots, speed, cost)

**Game State:**
- `GameState` - Complete game state (credits, inventory, ship, asteroid)
- `Config` - Game configuration (elements, prices, timings)

**Storage:**
- `SaveData` - Persistent save data structure

### Type Safety Benefits

- ✅ Compile-time type checking catches errors before runtime
- ✅ IDE autocomplete and IntelliSense
- ✅ Refactoring safety with find-all-references
- ✅ Self-documenting code with interfaces
- ✅ Prevents common bugs (typos, null references, wrong types)

## Modular Architecture

Each module exports a clean public API:

```typescript
// Import from asteroid module
import { generateAsteroid, AsteroidSize, AsteroidType } from './asteroids';

// Import ships
import { SHIPS } from './ships/ships';

// Import config
import { CONFIG } from './config/config';
```

This provides:
- **Encapsulation**: Internal implementation details are hidden
- **Reusability**: Modules can be easily reused or tested
- **Maintainability**: Changes are localized to specific modules
- **Clarity**: Clear dependencies and responsibilities

## Development Tips

1. **Edit TypeScript files** in `src/`, never edit `dist/game.js`
2. **Use watch mode** during development: `npm run dev`
3. **Check types frequently** with `npm run typecheck`
4. **Use source maps** for debugging (browser devtools will show TypeScript)
5. **Follow existing patterns** when adding new modules

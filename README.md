# Asteroid Miner

A 2D space mining incremental game built with TypeScript and HTML5.

## Project Structure

```
asteroid-miner/
├── game.html           # Main HTML file
├── game.css            # Stylesheet
├── src/
│   ├── game.ts         # Main game file
│   ├── asteroids/      # Asteroid generation system
│   ├── ships/          # Ship configurations
│   ├── config/         # Game configuration
│   ├── gamestate/      # State management
│   └── persistence.ts  # Save/load system
├── dist/
│   ├── game.js         # Bundled JavaScript output (auto-generated)
│   └── game.js.map     # Source map for debugging
├── tsconfig.json       # TypeScript configuration
└── package.json        # NPM scripts and dependencies
```

## Development Workflow

### Initial Setup

```bash
# Install dependencies
npm install
```

### Build Commands

```bash
# Build once (type-check + bundle)
npm run build

# Development mode with auto-rebuild on file changes
npm run dev
# or
npm run watch

# Type-check only (no bundling)
npm run typecheck

# Clean dist folder
npm run clean

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Running the Game

**Option 1 - Direct file access:**
```bash
open game.html
```

**Option 2 - Local server (recommended):**
```bash
# Python
python3 -m http.server 8000

# Node.js
npx serve

# Then visit http://localhost:8000/game.html
```

## Build System

The project uses:
- **TypeScript** for type-checking (`tsc --noEmit`)
- **esbuild** for fast bundling into a single JavaScript file
- **Vitest** for unit testing
- All source files in `src/` are bundled into `dist/game.js`

## TypeScript Benefits

- ✅ Full type safety
- ✅ IDE autocomplete and IntelliSense
- ✅ Compile-time error checking
- ✅ Better refactoring support
- ✅ Self-documenting interfaces
- ✅ Modular architecture with clean imports

## Game Features

- **Mining System**: Scan asteroids, mine resources, sell for credits
- **Asteroid Variety**: 4 types (Iron-Nickel, Carbonaceous, Rare-Earth, Olivine), 6 sizes (Tiny to Colossal)
- **Ship Progression**: 5 ship tiers with increasing capabilities
- **Discovery System**: First-time element finds trigger alerts
- **Inventory Management**: Track collected resources with hold capacity
- **Save/Load**: Automatic saving to LocalStorage
- **Retro Aesthetic**: 1980s CRT terminal visual style

## Current Implementation

- **Modular Architecture**: TypeScript modules in `src/` organized by feature
- **Asteroid System**: Dynamic generation based on ship level with 4 types and 6 sizes
- **Ship System**: 5 progression tiers (Scout → Prospector → Harvester → Industrial → Titan)
- **Elements**: 9 core elements (Fe, Ni, Co, O, Si, Mg, S, Cr, Mn)
- **Smart Spawning**: Higher-tier ships encounter larger asteroids and rarer types

## Next Steps

See `PROJECT_BRIEF.md` for planned features:
- Tool equipping system
- Power management
- Additional game polish and balancing

# Asteroid Miner

A 2D space mining incremental game built with TypeScript and HTML5.

## Project Structure

```
asteroid-miner/
├── game.html           # Main HTML file
├── game.css            # Stylesheet
├── src/
│   └── game.ts         # TypeScript source (edit this)
├── dist/
│   └── game.js         # Compiled TypeScript output (auto-generated)
├── tsconfig.json       # TypeScript configuration
└── package.json        # NPM scripts
└── build.js            # esbuild TS to JS Config
```

## Development Workflow

### Initial Setup

```bash
# Install TypeScript (if needed)
npm install -g typescript esbuild

# Or install dependencies locally
npm install
```

### Build TypeScript into JavaScript

```bash
node build.js
```

### Build Commands

```bash
# Compile TypeScript once
npm run build
# or
tsc

# Watch mode (auto-recompile on changes)
npm run watch
# or
tsc --watch
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

## TypeScript Benefits

- ✅ Full type safety
- ✅ IDE autocomplete and IntelliSense
- ✅ Compile-time error checking
- ✅ Better refactoring support
- ✅ Self-documenting interfaces

## Game Features

- **Mining System**: Scan asteroids, mine resources, sell for credits
- **Discovery System**: First-time element finds trigger alerts
- **Inventory Management**: Track collected resources with hold capacity
- **Save/Load**: Automatic saving to LocalStorage
- **Retro Aesthetic**: 1980s CRT terminal visual style

## Current Implementation

- **Game State**: TypeScript-powered with full type definitions
- **Asteroid Types**: Iron-Nickel composition (Fe 88-92%, Ni 5-8%, Co 1-2%)
- **Mining Time**: 2.5 seconds per asteroid
- **Elements**: 9 core elements (Fe, Ni, Co, O, Si, Mg, S, Cr, Mn)

## Next Steps

See `PROJECT_BRIEF.md` for planned features:
- Ship upgrade system (5 tiers)
- Tool equipping system
- Asteroid variety (4 types, 6 sizes)
- Power management

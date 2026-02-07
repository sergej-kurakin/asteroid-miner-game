# Game Test Runner - Agent Memory

## Test Suite Baseline (2026-02-07, `another-refatoring` branch)
- **23 test files**, **363 tests total**, all passing
- Test run duration: ~3.4s tests, ~4.8s wall clock
- Vitest v4.0.18

## Test File Inventory (23 files)
| File | Tests |
|------|-------|
| src/mining/system.test.ts | 26 |
| src/mining/controller.test.ts | 23 |
| src/tools/controller.test.ts | 26 |
| src/tools/commands.test.ts | 13 |
| src/asteroids/generator.test.ts | 20 |
| src/asteroids/controller.test.ts | 17 |
| src/asteroids/commands.test.ts | 9 |
| src/ships/controller.test.ts | 24 |
| src/ships/commands.test.ts | 11 |
| src/power/controller.test.ts | 12 |
| src/power/commands.test.ts | 8 |
| src/gamestate/observer.test.ts | 18 |
| src/ui/components/asteroid-view.test.ts | 23 |
| src/ui/components/ship-info.test.ts | 21 |
| src/ui/components/control-buttons.test.ts | 20 |
| src/ui/components/inventory-list.test.ts | 16 |
| src/ui/components/power-button.test.ts | 16 |
| src/ui/components/gauge.test.ts | 14 |
| src/ui/components/tool-panel.test.ts | 14 |
| src/ui/components/discovery-alert.test.ts | 10 |
| src/ui/components/composition-grid.test.ts | 10 |
| src/ui/components/credits-display.test.ts | 6 |
| src/ui/components/status-display.test.ts | 6 |

## Build Output
- Production bundle: `dist/game.js` (~61.5kb) + sourcemap (~124.0kb)
- Build pipeline: clean -> typecheck -> test -> bundle (esbuild, 9ms)

## Key Observations
- Slowest test files are UI components with jsdom env (tool-panel ~689ms, ship-info ~602ms)
- Non-UI tests run very fast (<75ms each)
- `npm run build` runs tests as part of the pipeline (not just typecheck + bundle)
- 3 new `commands.test.ts` files added during Command pattern refactoring (tools, ships, power)

## Common Failure Patterns
- **`createInitialState` errors**: New GameState field added but test files not updated. All 23 test files may have their own `createInitialState` function.
- **Import errors**: New exports missing from module `index.ts` barrel files.
- **Type errors after interface changes**: Check `src/gamestate/interfaces.ts` for GameState, `src/persistence.ts` for SaveData.

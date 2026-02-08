# Game Test Runner - Agent Memory

## Test Suite Baseline (updated 2026-02-08 14:57, `world` branch)
- **35 test files**, **486 tests total** (all passing as of latest run)
- Typecheck: clean (0 errors)
- Test run duration: 6.04s wall clock (6.32s test execution, 2.86s import)
- Vitest v4.0.18
- `src/ships/controller.test.ts`: 35 tests (ship travel implementation)
- `src/ships/commands.test.ts`: 15 tests (ship travel commands)
- `src/asteroids/commands.test.ts`: 11 tests (was 9, +2 new)

## Current Issues (as of 2026-02-08 14:57)
- None — all 486 tests passing

## Test File Inventory (35 files)
| File | Tests | Status |
|------|-------|--------|
| src/world/utils.test.ts | 22 | pass |
| src/world/generator.test.ts | 8 | pass |
| src/mining/system.test.ts | 22 | pass |
| src/mining/commands.test.ts | 20 | pass |
| src/mining/controller.test.ts | 21 | pass |
| src/tools/controller.test.ts | 26 | pass |
| src/tools/commands.test.ts | 13 | pass |
| src/asteroids/generator.test.ts | 23 | pass |
| src/asteroids/controller.test.ts | 22 | pass |
| src/asteroids/commands.test.ts | 9 | pass |
| src/ships/controller.test.ts | 35 | pass |
| src/ships/commands.test.ts | 15 | pass |
| src/power/controller.test.ts | 12 | pass |
| src/power/commands.test.ts | 8 | pass |
| src/market/mediator.test.ts | 4 | pass |
| src/market/commands.test.ts | 6 | pass |
| src/market/market.test.ts | 8 | pass |
| src/market/official-market-system.test.ts | 5 | pass |
| src/market/black-market-system.test.ts | 6 | pass |
| src/market/dump-market-system.test.ts | 5 | pass |
| src/gamestate/observer.test.ts | 18 | pass |
| src/persistence/transformer.test.ts | 9 | pass |
| src/persistence/controller.test.ts | 4 | pass |
| src/persistence/storage.test.ts | 7 | pass |
| src/ui/components/asteroid-view.test.ts | 23 | pass |
| src/ui/components/ship-info.test.ts | 21 | pass |
| src/ui/components/control-buttons.test.ts | 20 | pass |
| src/ui/components/inventory-list.test.ts | 16 | pass |
| src/ui/components/power-button.test.ts | 16 | pass |
| src/ui/components/gauge.test.ts | 14 | pass |
| src/ui/components/tool-panel.test.ts | 14 | pass |
| src/ui/components/discovery-alert.test.ts | 10 | pass |
| src/ui/components/composition-grid.test.ts | 10 | pass |
| src/ui/components/credits-display.test.ts | 6 | pass |
| src/ui/components/status-display.test.ts | 6 | pass |

## Key Observations
- Market module has three market strategy systems: OfficialMarketSystem, BlackMarketSystem, DumpMarketSystem
- `Asteroid` interface includes `totalYield`, `miningTime`, `visualDiameter` fields
- Slowest test files: world/generator (~2014ms), tool-panel (~661ms), ship-info (~551ms)
- Non-UI tests run fast (<150ms each)
- `npm run build` runs tests as part of pipeline (clean -> typecheck -> test -> bundle)
- `src/asteroids/controller.test.ts` grew from 17 to 22 tests (MiningConstraint tests added)

## Common Failure Patterns
- **`createInitialState` errors**: New GameState field added but test files not updated
- **Import errors**: New exports missing from module `index.ts` barrel files
- **Asteroid interface changes**: Test mocks need all required Asteroid fields
- **localStorage in Node**: Tests using localStorage need jsdom env or manual mocks
- **Type errors after interface changes**: Check `src/gamestate/interfaces.ts` for GameState
- **Empty weighted items after constraint filter**: `MiningConstraint.SmallOnly` + high ship levels
  (4-5) that have no tiny/small sizes causes `weightedRandomSelect` to crash on empty array

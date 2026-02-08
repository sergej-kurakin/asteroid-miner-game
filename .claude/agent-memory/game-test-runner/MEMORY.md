# Game Test Runner - Agent Memory

## Test Suite Baseline (updated 2026-02-08 final, `another-refatoring` branch)
- **33 test files**, **431 tests total** (all passing)
- Typecheck: clean (0 errors)
- Test run duration: ~3.7s tests, ~5.0s wall clock
- Vitest v4.0.18

## Current Issues (as of 2026-02-08)
- None. All typechecks and tests pass. Market refactoring complete with new market systems.

## Test File Inventory (33 files)
| File | Tests | Status |
|------|-------|--------|
| src/mining/system.test.ts | 22 | pass |
| src/mining/commands.test.ts | 20 | pass |
| src/mining/controller.test.ts | 21 | pass |
| src/tools/controller.test.ts | 26 | pass |
| src/tools/commands.test.ts | 13 | pass |
| src/asteroids/generator.test.ts | 20 | pass |
| src/asteroids/controller.test.ts | 17 | pass |
| src/asteroids/commands.test.ts | 9 | pass |
| src/ships/controller.test.ts | 24 | pass |
| src/ships/commands.test.ts | 11 | pass |
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
- Market module expanded from 15 to 34 tests with three new market strategy systems:
  - `OfficialMarketSystem` (5 tests) - premium prices
  - `BlackMarketSystem` (6 tests) - variable prices with modifiers
  - `DumpMarketSystem` (5 tests) - bulk liquidation
  - Commands and mediator tests increased slightly
- Mining module tests stable (system 22, commands 20, controller 21)
- Persistence module stabilized (storage, transformer, controller all passing)
- `Asteroid` interface includes `totalYield`, `miningTime`, `visualDiameter` fields
- Slowest test files: tool-panel (~590ms), ship-info (~484ms), composition-grid (~500ms)
- Non-UI tests run fast (<150ms each)
- `npm run build` runs tests as part of pipeline (clean -> typecheck -> test -> bundle)

## Common Failure Patterns
- **`createInitialState` errors**: New GameState field added but test files not updated
- **Import errors**: New exports missing from module `index.ts` barrel files
- **Asteroid interface changes**: Test mocks need all required Asteroid fields
- **localStorage in Node**: Tests using localStorage need jsdom env or manual mocks
- **Type errors after interface changes**: Check `src/gamestate/interfaces.ts` for GameState

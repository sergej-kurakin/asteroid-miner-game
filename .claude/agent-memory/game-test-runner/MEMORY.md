# Game Test Runner - Agent Memory

## Test Suite Baseline (updated 2026-02-07, `another-refatoring` branch)
- **26 test files**, **383 tests total** (376 passing, 7 failing)
- 1 failing file: `src/persistence/storage.test.ts` (all 7 tests)
- Typecheck also failing: 4 errors in persistence module
- Test run duration: ~4.0s tests, ~5.2s wall clock
- Vitest v4.0.18

## Current Issues (as of 2026-02-07)
1. **Typecheck failures (4 errors):**
   - `src/persistence/index.ts`: References `PersistenceController` and `LocalStorageAdapter` which don't exist by those names
   - `src/persistence/transformer.test.ts`: Mock Asteroid missing `totalYield`, `miningTime`, `visualDiameter`
2. **Test failure (7 tests):**
   - `src/persistence/storage.test.ts`: `localStorage.clear()` not available in Node env; needs jsdom or manual mock

## Test File Inventory (26 files)
| File | Tests | Status |
|------|-------|--------|
| src/mining/system.test.ts | 26 | pass |
| src/mining/controller.test.ts | 23 | pass |
| src/tools/controller.test.ts | 26 | pass |
| src/tools/commands.test.ts | 13 | pass |
| src/asteroids/generator.test.ts | 20 | pass |
| src/asteroids/controller.test.ts | 17 | pass |
| src/asteroids/commands.test.ts | 9 | pass |
| src/ships/controller.test.ts | 24 | pass |
| src/ships/commands.test.ts | 11 | pass |
| src/power/controller.test.ts | 12 | pass |
| src/power/commands.test.ts | 8 | pass |
| src/gamestate/observer.test.ts | 18 | pass |
| src/persistence/transformer.test.ts | 9 | pass (typecheck fails) |
| src/persistence/controller.test.ts | 4 | pass |
| src/persistence/storage.test.ts | 7 | FAIL |
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
- Persistence module under active development (3 new files: storage, transformer, controller)
- `Asteroid` interface gained `totalYield`, `miningTime`, `visualDiameter` fields
- Slowest test files: tool-panel (~676ms), ship-info (~590ms), inventory-list (~426ms)
- Non-UI tests run fast (<100ms each)
- `npm run build` runs tests as part of pipeline (clean -> typecheck -> test -> bundle)

## Common Failure Patterns
- **`createInitialState` errors**: New GameState field added but test files not updated
- **Import errors**: New exports missing from module `index.ts` barrel files
- **Asteroid interface changes**: Test mocks need all required Asteroid fields
- **localStorage in Node**: Tests using localStorage need jsdom env or manual mocks
- **Type errors after interface changes**: Check `src/gamestate/interfaces.ts` for GameState

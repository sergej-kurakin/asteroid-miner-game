# TypeScript Reviewer Memory

## Project Architecture
- Module pattern: `interfaces.ts` -> `constants.ts` -> logic files -> `controller.ts` -> `index.ts`
- Controllers take `Observable<GameState>` as first constructor arg
- `Observable<T>` interface in `src/gamestate/observer.ts` provides `getState()`, `setState(partial)`, `updateProperty(key, value)`
- `StateObserver<T>` is the concrete implementation
- All imports use `import type` for interfaces/types (enforced by convention)
- Barrel exports via `index.ts` per module; type exports first, then implementations

## Command Pattern
- `Command<TResult>` interface in `src/gamestate/interfaces.ts` (moved from asteroids)
- `ScanCommand` and `AbandonCommand` in `src/asteroids/commands.ts`
- `BuyPowerCommand` in `src/power/commands.ts` -- returns `number` (new power level)
- `UpgradeShipCommand` in `src/ships/commands.ts` -- returns `ShipData`
- `BuyToolCommand`, `EquipToolCommand`, `UnequipToolCommand` in `src/tools/commands.ts` -- return `void`
- `StartMiningCommand`, `CancelMiningCommand`, `CompleteMiningCommand`, `SellResourcesCommand` in `src/mining/commands.ts`
- `CompleteMiningCommand` is most complex -- delegates to IMiningSystem for yield calculation, capping, discovery, merge
- `SellResourcesCommand` uniquely receives pre-computed SellResult rather than computing at execute-time
- Controller handles validation; commands handle state mutation only
- Commands read state at execute() time (not construction time) -- fixed from earlier stale snapshot issue
- IAsteroidGenerator injected into ScanCommand via constructor
- Commands have implicit preconditions only enforced by controllers -- document via JSDoc
- Constants (costs/gains) imported directly in commands, not injected -- consistent pattern

## Testing Patterns
- Test files co-located with source using `.test.ts` suffix
- `createTestState(overrides?: Partial<GameState>)` helper in each test file
- Repeated asteroid object literals across test files -- opportunity for shared fixture
- Vitest with `describe/it/expect/vi`, jsdom for UI tests
- `vi.fn() as unknown as (arg: Type) => void` for typed mocks

## Key Interfaces
- `GameState` in `src/gamestate/interfaces.ts` -- 13 fields, changes ripple to 12+ test files
- `Asteroid` interface: type, size, composition, totalYield, miningTime, visualDiameter
- `ScanResult`: `{ success: boolean; asteroid?: Asteroid; error?: 'is_mining' | 'asteroid_exists' | 'insufficient_power' }`
- `AbandonResult`: `{ success: boolean; error?: 'is_mining' | 'no_asteroid' }`
- `BuyPowerResult`: `{ success: boolean; newPower?: number; error?: 'insufficient_credits' | 'power_full' }`
- `UpgradeResult`: `{ success: boolean; newShip?: ShipData; error?: 'insufficient_credits' | 'max_level_reached' | 'is_mining' }`
- **Pattern weakness**: Most result types use `success: boolean` not discriminated unions -- prevents type narrowing
- **Exception**: `BuyPowerResult` was refactored to discriminated union in commit 18ba769

## Review Findings Log
- See [review-findings.md](review-findings.md) for detailed review history

## Common Review Items
- Check for stale state snapshots passed to commands/functions (read-then-write race potential)
- Verify `import type` usage for all type-only imports
- Check `readonly` on constructor params
- Verify barrel exports updated when new files added
- Watch for test duplication of object literals (asteroid fixtures especially)
- Check internal import paths (`../module/interfaces`) that should use barrel (`../module`)
- Verify @precondition JSDoc on all Command classes
- Check that result types needing narrowing are discriminated unions (ongoing migration)
- Watch for non-null assertions (`!`) on nullable state fields in commands -- prefer runtime guard + throw
- `createTestAsteroid()` helper exists in `src/mining/commands.test.ts` -- candidate for shared test util

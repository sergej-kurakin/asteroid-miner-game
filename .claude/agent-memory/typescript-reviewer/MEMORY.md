# TypeScript Reviewer Memory

## Project Architecture
- Module pattern: `interfaces.ts` -> `constants.ts` -> logic files -> `controller.ts` -> `index.ts`
- Controllers take `Observable<GameState>` as first constructor arg
- `Observable<T>` interface in `src/gamestate/observer.ts` provides `getState()`, `setState(partial)`, `updateProperty(key, value)`
- `StateObserver<T>` is the concrete implementation
- All imports use `import type` for interfaces/types (enforced by convention)
- Barrel exports via `index.ts` per module; type exports first, then implementations

## Command Pattern (asteroids module)
- `Command<TResult>` interface in `src/asteroids/interfaces.ts` -- may need relocation if pattern spreads
- `ScanCommand` and `AbandonCommand` in `src/asteroids/commands.ts`
- Controller handles validation; commands handle state mutation only
- ScanCommand takes stale power snapshot from controller -- fragile but works since execute() is called immediately

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

## Review Findings Log
- See [review-findings.md](review-findings.md) for detailed review history

## Common Review Items
- Check for stale state snapshots passed to commands/functions (read-then-write race potential)
- Verify `import type` usage for all type-only imports
- Check `readonly` on constructor params
- Verify barrel exports updated when new files added
- Watch for test duplication of object literals (asteroid fixtures especially)

# Review Findings Log

## 2026-02-07: Command Pattern Refactor (asteroids module)

### Files Reviewed
- `src/asteroids/commands.ts` (new)
- `src/asteroids/interfaces.ts` (added Command<TResult>)
- `src/asteroids/controller.ts` (refactored to use commands)
- `src/asteroids/commands.test.ts` (new)
- `src/asteroids/index.ts` (updated exports)

### Key Findings
1. **Command interface placement**: `Command<TResult>` is in asteroids module but is generic -- should move to shared location if pattern spreads
2. **Stale snapshot pattern**: ScanCommand takes `currentPower` as constructor arg (snapshot) then uses it in setState -- fragile if execute() is deferred
3. **AbandonCommand is very thin**: single updateProperty call wrapped in a class -- justified only if Command pattern will be extended (undo/redo, logging)
4. **Generator not injectable in ScanCommand**: uses module-level `generateAsteroid()` directly, limiting test determinism
5. **Test fixture duplication**: asteroid object literal repeated in commands.test.ts and 6+ times in controller.test.ts

### Verdict
Clean refactoring, no critical issues. Good separation of validation (controller) and mutation (commands). Type safety is solid.

### Post-review Updates
- Finding #2 (stale snapshot): Fixed -- ScanCommand now reads state.power at execute() time
- Finding #4 (generator injection): Fixed -- IAsteroidGenerator injected via constructor
- Finding #1 (Command placement): Fixed -- Command<TResult> moved to `src/gamestate/interfaces.ts`

## 2026-02-07: BuyPowerCommand Review (power module)

### Files Reviewed
- `src/power/commands.ts` (new)
- `src/power/commands.test.ts` (new)
- `src/power/controller.ts` (refactored to use BuyPowerCommand)
- `src/power/index.ts` (updated exports)
- `src/power/interfaces.ts` (existing BuyPowerResult)

### Key Findings
1. **No precondition guard or JSDoc on BuyPowerCommand**: execute() can drive credits negative if called without controller validation. Consistent with ScanCommand but should be documented.
2. **BuyPowerResult is not a discriminated union**: `success: boolean` prevents type narrowing. Same pattern as ScanResult/AbandonResult -- codebase-wide issue.
3. **Missing negative-credits edge case test**: No test documents behavior when credits < POWER_COST.
4. **Controller test uses magic numbers**: Could import POWER_COST/POWER_GAIN for clarity.

### Verdict
Clean, pattern-consistent extraction. No runtime bugs in normal usage. Main risk is public API surface of unguarded command. Test quality is high -- includes execute-time-read test and state isolation test.

## 2026-02-07: UpgradeShipCommand Review (completed)

### Files Reviewed
- `src/ships/commands.ts` (new)
- `src/ships/commands.test.ts` (new)
- `src/ships/controller.ts` (refactored to use UpgradeShipCommand)
- `src/ships/interfaces.ts` (UpgradeResult -- added 'is_mining' error)
- `src/ships/index.ts` (updated exports)

### Key Findings
1. **Division by zero -- FIXED**: Command includes guard `state.hold_capacity > 0` with test for NaN prevention
2. **is_mining guard -- FIXED**: Controller now checks `state.is_mining` before calling command; 'is_mining' added to UpgradeResult error union
3. **Missing @precondition JSDoc**: Unlike BuyPowerCommand/BuyToolCommand, no precondition docs on class
4. **UpgradeResult not a discriminated union**: Still `success: boolean` pattern unlike refactored BuyPowerResult
5. **Import bypasses barrel**: `import type { GameState } from '../gamestate/interfaces'` instead of `'../gamestate'`
6. **equipped_tools not trimmed on upgrade**: Safe currently (slots only increase) but undocumented assumption
7. **Barrel exports correctly updated**: `UpgradeShipCommand` exported from index.ts

### Verdict
Clean extraction, no critical issues. All pre-review concerns (div-by-zero, is_mining guard) were addressed. Thorough test suite (11 tests). Main action items: add @precondition JSDoc and refactor UpgradeResult to discriminated union for consistency with BuyPowerResult.

## 2026-02-07: Mining Commands Extraction Review

### Files Reviewed
- `src/mining/commands.ts` (new -- 4 command classes)
- `src/mining/commands.test.ts` (new -- 25 tests)
- `src/mining/controller.ts` (refactored to use commands)
- `src/mining/interfaces.ts` (added CompleteMiningResult)
- `src/mining/index.ts` (updated exports)

### Key Findings
1. **Non-null assertion on state.asteroid in CompleteMiningCommand** (line 63): `state.asteroid!` -- should be a runtime guard with throw or early return. Only critical finding.
2. **Import path inconsistency in controller.ts**: `GameState` imported from `'../gamestate/interfaces'` instead of barrel `'../gamestate'`. Inconsistent with commands.ts which uses barrel correctly.
3. **SellResourcesCommand receives pre-computed SellResult**: Unlike other commands that compute at execute-time, this takes a pre-computed value. Works because caller is synchronous, but inconsistent with "read state at execute time" philosophy.
4. **createTestAsteroid helper is a good pattern**: Reduces duplication vs inline asteroid literals in other test files. Should be considered for extraction to shared test utils.
5. **discovered_elements referential equality optimization**: Tested with `toBe()` -- good defensive practice for subscriber change detection.
6. **All 4 commands have @precondition JSDoc**: Consistent with pattern established after ships review.

### Verdict
High quality extraction. Most complex of the command refactors due to CompleteMiningCommand's multi-step logic. One critical fix needed (non-null assertion). Clean test suite with thorough coverage including edge cases.

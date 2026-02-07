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

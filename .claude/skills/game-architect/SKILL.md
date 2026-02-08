---
name: game-architect
description: Creates game architecture patterns and best practices for game development.
---
# Skill: Decoupled Game Architecture (TypeScript)

## Core Philosophy

Separation of Concerns via the **"Logic-Data-Event" triad**. Moving away from monolithic Controllers toward an atomic, pattern-driven ecosystem.

## 1. Pattern Proficiency Stack

**Behavioral Wrappers (Facade/Entity):** Implementing Domain Entities (e.g., `Ship`) as gatekeepers. They encapsulate validation logic and provide a simplified interface for the UI, hiding complex command orchestration.

**Command Pattern:** Encapsulating game actions (Mining, Trading, Spawning) as discrete, transactional objects. This ensures logic is decoupled from the UI and enables features like action queuing and undo/redo.

**Strategy Pattern:** Decoupling algorithms from execution. Using interchangeable strategies for variable logic (e.g., different mining yields or AI behaviors) to prevent conditional bloat.

**Observable State Management:** Maintaining a Single Source of Truth (SSOT). Utilizing the Observer pattern to synchronize UI components with the `GameState` without direct coupling.

**Mediator Pattern:** Orchestrating complex interactions between independent systems (e.g., Ship <-> Market) to maintain zero-knowledge between entities.

**Type-Safe Event Bus:** Managing transient, non-state side effects (Sound, VFX, Achievements) using TypeScript-mapped types for compile-time safety.

## 2. Architectural Workflow

1. **Intent Layer (UI):** Dispatches high-level method calls to Domain Entities.
2. **Validation Layer (Entity):** Validates the "should" (e.g., fuel checks, inventory limits).
3. **Orchestration Layer (Command):** Coordinates the "how" by invoking Strategies and mutating the `GameState`.
4. **Data Layer (GameState):** Pure data structures that trigger Observable updates.
5. **Feedback Layer (Event Bus):** Broadcasts side-effects for decoupled listeners.

## 3. Technical Implementation Details

- **Language:** TypeScript (Strict Mode).
- **Typing:** Advanced use of Generics and Interfaces to define "contracts" between Commands and Strategies.
- **State:** Immutable-style updates within a mutable state store to trigger reactive UI re-renders.

## Usage

When designing new features or refactoring existing systems, apply these patterns to ensure:

- Each system has a single responsibility
- Logic is testable in isolation (Commands and Strategies are unit-testable)
- UI remains a thin layer that only dispatches intent and renders state
- New behaviors can be added by composing existing patterns, not modifying them
- Cross-system communication flows through the Event Bus or Mediator, never direct references

## Project-Specific Application

In Asteroid Miner, this maps to:

| Layer | Current Implementation | Pattern |
|-------|----------------------|---------|
| Intent | UI Components (`BaseComponent` subclasses) | Facade |
| Validation | Controllers (`MiningController`, `ShipController`, etc.) | Entity/Facade |
| Orchestration | Controller methods + `MiningSystem` | Command + Strategy |
| Data | `GameState` via `StateObserver` | Observable SSOT |
| Feedback | Direct state subscription | Event Bus (future) |

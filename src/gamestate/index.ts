// src/gamestate/index.ts
// Public API for game state management

export type { GameState } from './interfaces';
export {
    type Observable,
    StateObserver,
    type Listener,
    type PropertyListener,
    type Unsubscribe
} from './observer';

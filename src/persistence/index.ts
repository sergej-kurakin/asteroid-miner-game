export type { SaveData, IGameStorage, IPersistenceController } from './interfaces';
export { STORAGE_KEY, DEFAULT_SAVE_DATA } from './constants';
export { toSaveData, toGameState, createDefaultGameState } from './transformer';
export { LocalStorageAdapter } from './storage';
export { PersistenceController } from './controller';

import type { IPersistenceController } from './interfaces';
import { LocalStorageAdapter } from './storage';
import { PersistenceController } from './controller';

export function createPersistenceController(): IPersistenceController {
    return new PersistenceController(new LocalStorageAdapter());
}

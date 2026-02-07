import type { GameState } from '../gamestate/interfaces';
import type { IGameStorage, IPersistenceController } from './interfaces';
import { toSaveData, toGameState, createDefaultGameState } from './transformer';

export class PersistenceController implements IPersistenceController {
    private readonly storage: IGameStorage;

    constructor(storage: IGameStorage) {
        this.storage = storage;
    }

    save(state: Readonly<GameState>): void {
        this.storage.save(toSaveData(state));
    }

    load(): GameState {
        const data = this.storage.load();
        if (data) {
            return toGameState(data);
        }
        return createDefaultGameState();
    }
}

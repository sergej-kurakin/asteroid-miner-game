import type { SaveData, IGameStorage } from './interfaces';
import { STORAGE_KEY } from './constants';

export class LocalStorageAdapter implements IGameStorage {
    private readonly key: string;

    constructor(key: string = STORAGE_KEY) {
        this.key = key;
    }

    load(): SaveData | null {
        try {
            const raw = localStorage.getItem(this.key);
            if (raw) {
                return JSON.parse(raw) as SaveData;
            }
        } catch (e) {
            console.error('Failed to load game:', e);
        }
        return null;
    }

    save(data: SaveData): void {
        try {
            localStorage.setItem(this.key, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save game:', e);
        }
    }
}

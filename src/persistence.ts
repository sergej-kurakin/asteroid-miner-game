// src/gamePersistence.ts
// Handles saving and loading game state to localStorage

import type { GameState } from './gamestate/interfaces';
import { SHIPS } from './ships/ships';

export interface SaveData {
    credits: number;
    current_ship_level: number;
    discovered_elements: string[];
    inventory: { [element: string]: number };
    hold_used: number;
}

const STORAGE_KEY = 'asteroidMiner';

export function saveGameState(state: GameState): void {
    const saveData: SaveData = {
        credits: state.credits,
        current_ship_level: state.current_ship_level,
        discovered_elements: state.discovered_elements,
        inventory: state.inventory,
        hold_used: state.hold_used
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch (e) {
        console.error('Failed to save game:', e);
    }
}

export function loadGameState(): GameState {
    try {
        const saveData = localStorage.getItem(STORAGE_KEY);
        if (saveData) {
            const data: SaveData = JSON.parse(saveData);
            const shipLevel = data.current_ship_level || 1;
            const holdCapacity = SHIPS[shipLevel - 1].holdCapacity;
            return {
                credits: data.credits || 0,
                current_ship_level: shipLevel,
                discovered_elements: data.discovered_elements || [],
                inventory: data.inventory || {},
                hold_used: data.hold_used || 0,
                hold_capacity: holdCapacity,
                asteroid: null,
                is_mining: false,
                mining_progress: 0,
                power: 100
            };
        }
    } catch (e) {
        console.error('Failed to load game:', e);
    }
    return {
        credits: 0,
        current_ship_level: 1,
        discovered_elements: [],
        inventory: {},
        hold_used: 0,
        hold_capacity: SHIPS[0].holdCapacity,
        asteroid: null,
        is_mining: false,
        mining_progress: 0,
        power: 100
    };
}

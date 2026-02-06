// src/gamePersistence.ts
// Handles saving and loading game state to localStorage

import type { GameState } from './gamestate/interfaces';
import type { EquippedTool } from './tools/interfaces';

export interface SaveData {
    credits: number;
    current_ship_level: number;
    discovered_elements: string[];
    inventory: { [element: string]: number };
    hold_used: number;
    hold_capacity: number;
    power: number;
    power_capacity: number;
    equipped_tools: EquippedTool[];
    tools_owned: string[];
}

const STORAGE_KEY = 'asteroidMiner';

export function saveGameState(state: Readonly<GameState>): void {
    const saveData: SaveData = {
        credits: state.credits,
        current_ship_level: state.current_ship_level,
        discovered_elements: state.discovered_elements,
        inventory: state.inventory,
        hold_used: state.hold_used,
        hold_capacity: state.hold_capacity,
        power: state.power,
        power_capacity: state.power_capacity,
        equipped_tools: state.equipped_tools,
        tools_owned: state.tools_owned
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
            return {
                credits: data.credits || 0,
                current_ship_level: data.current_ship_level || 1,
                discovered_elements: data.discovered_elements || [],
                inventory: data.inventory || {},
                hold_used: data.hold_used || 0,
                hold_capacity: data.hold_capacity || 100,
                asteroid: null,
                is_mining: false,
                mining_progress: 0,
                power: data.power || 100,
                power_capacity: data.power_capacity || 100,
                equipped_tools: data.equipped_tools || [],
                tools_owned: data.tools_owned || []
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
        hold_capacity: 100,
        asteroid: null,
        is_mining: false,
        mining_progress: 0,
        power: 100,
        power_capacity: 100,
        equipped_tools: [],
        tools_owned: []
    };
}

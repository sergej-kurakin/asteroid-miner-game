import type { SaveData } from './interfaces';

export const STORAGE_KEY = 'asteroidMiner';

export const DEFAULT_SAVE_DATA: Readonly<SaveData> = {
    credits: 0,
    current_ship_level: 1,
    discovered_elements: [],
    inventory: {},
    hold_used: 0,
    hold_capacity: 100,
    power: 100,
    power_capacity: 100,
    equipped_tools: [],
    tools_owned: []
};

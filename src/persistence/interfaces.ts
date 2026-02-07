import type { GameState } from '../gamestate/interfaces';
import type { EquippedTool } from '../tools/interfaces';

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

export interface IGameStorage {
    load(): SaveData | null;
    save(data: SaveData): void;
}

export interface IPersistenceController {
    save(state: Readonly<GameState>): void;
    load(): GameState;
}

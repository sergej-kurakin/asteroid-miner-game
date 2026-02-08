import type { GameState } from '../gamestate/interfaces';
import type { SaveData } from './interfaces';
import { DEFAULT_SAVE_DATA } from './constants';

export function toSaveData(state: Readonly<GameState>): SaveData {
    return {
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
}

export function toGameState(data: Partial<SaveData>): GameState {
    return {
        credits: data.credits ?? DEFAULT_SAVE_DATA.credits,
        current_ship_level: data.current_ship_level ?? DEFAULT_SAVE_DATA.current_ship_level,
        discovered_elements: data.discovered_elements ?? DEFAULT_SAVE_DATA.discovered_elements,
        inventory: data.inventory ?? DEFAULT_SAVE_DATA.inventory,
        hold_used: data.hold_used ?? DEFAULT_SAVE_DATA.hold_used,
        hold_capacity: data.hold_capacity ?? DEFAULT_SAVE_DATA.hold_capacity,
        power: data.power ?? DEFAULT_SAVE_DATA.power,
        power_capacity: data.power_capacity ?? DEFAULT_SAVE_DATA.power_capacity,
        equipped_tools: data.equipped_tools ?? DEFAULT_SAVE_DATA.equipped_tools,
        tools_owned: data.tools_owned ?? DEFAULT_SAVE_DATA.tools_owned,
        asteroid: null,
        is_mining: false,
        mining_progress: 0
    };
}

export function createDefaultGameState(): GameState {
    return toGameState({});
}

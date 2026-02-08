import type { Asteroid } from '../asteroids/interfaces';
import type { EquippedTool } from '../tools/interfaces';

// Command pattern interface
export interface Command<TResult> {
    execute(): TResult;
}

export interface GameState {
    credits: number;
    current_ship_level: number;
    discovered_elements: string[];
    inventory: { [element: string]: number };
    hold_capacity: number;
    hold_used: number;
    asteroid: Asteroid | null;
    is_mining: boolean;
    mining_progress: number;
    power: number;
    power_capacity: number;
    equipped_tools: EquippedTool[];
    tools_owned: string[];
}

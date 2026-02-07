import type { Asteroid } from '../asteroids/interfaces';
import type { ToolBonuses } from '../tools/interfaces';

// Result of yield calculation
export interface MiningYield {
    collected: { [element: string]: number };
    totalAmount: number;
}

// Result of completing mining (returned by CompleteMiningCommand)
export interface CompleteMiningResult {
    cappedYield: MiningYield;
    newDiscoveries: string[];
}

// Mining event types
export type MiningEvent =
    | { type: 'mining_started'; asteroid: Asteroid }
    | { type: 'mining_progress'; progress: number }
    | { type: 'mining_completed'; yield: MiningYield }
    | { type: 'discovery'; element: string }
    | { type: 'mining_failed'; reason: 'insufficient_power' };

export type MiningEventListener = (event: MiningEvent) => void;

// Interface for pure calculation methods
export interface IMiningSystem {
    calculateYield(asteroid: Asteroid, toolBonuses?: ToolBonuses): MiningYield;
    capYieldToAvailableSpace(
        miningYield: MiningYield,
        availableSpace: number
    ): MiningYield;
    findNewDiscoveries(
        collected: { [element: string]: number },
        discovered: string[]
    ): string[];
    mergeIntoInventory(
        current: { [element: string]: number },
        collected: { [element: string]: number }
    ): { [element: string]: number };
    calculateNewHoldUsed(
        currentUsed: number,
        totalCollected: number,
        capacity: number
    ): number;
}

// Interface for controller methods
export interface IMiningController {
    startMining(): boolean;
    cancelMining(): void;
    isMining(): boolean;
    getProgress(): number;
    subscribe(listener: MiningEventListener): () => void;
}

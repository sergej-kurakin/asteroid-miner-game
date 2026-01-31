import type { Asteroid } from '../asteroids/interfaces';

// Result of yield calculation
export interface MiningYield {
    collected: { [element: string]: number };
    totalAmount: number;
}

// Result of selling resources
export interface SellResult {
    totalValue: number;
    itemsSold: { [element: string]: number };
}

// Mining event types
export type MiningEvent =
    | { type: 'mining_started'; asteroid: Asteroid }
    | { type: 'mining_progress'; progress: number }
    | { type: 'mining_completed'; yield: MiningYield }
    | { type: 'discovery'; element: string };

export type MiningEventListener = (event: MiningEvent) => void;

// Element prices lookup
export interface ElementPrices {
    [element: string]: number;
}

// Interface for pure calculation methods
export interface IMiningSystem {
    calculateYield(asteroid: Asteroid): MiningYield;
    calculateSellValue(
        inventory: { [element: string]: number },
        prices: ElementPrices
    ): SellResult;
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
    sellResources(): SellResult | null;
    subscribe(listener: MiningEventListener): () => void;
}

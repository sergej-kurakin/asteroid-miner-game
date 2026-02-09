import type { CellPosition } from '../world/interfaces';

export interface ShipData {
    id: number;
    name: string;
    holdCapacity: number;
    powerCell: number;
    miningTime: number;
    toolSlots: number;
    cost: number;
    special: string;
}

export type UpgradeResult =
    | { success: true; newShip: ShipData }
    | { success: false; error: 'insufficient_credits' | 'max_level_reached' | 'is_mining' };

export type TravelResult =
    | { success: true; newCell: CellPosition }
    | { success: false; error: 'insufficient_power' | 'invalid_destination' | 'is_mining' };

export interface IShipController {
    getCurrentShip(): ShipData;
    getNextShip(): ShipData | undefined;
    canAffordUpgrade(): boolean;
    isMaxLevel(): boolean;
    upgrade(): UpgradeResult;
    getLevel(): number;
    getMiningTime(): number;
    getToolSlots(): number;
    calculateMoveCost(): number;
    travel(destination: CellPosition): TravelResult;
}

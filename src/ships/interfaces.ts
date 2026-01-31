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

export interface UpgradeResult {
    success: boolean;
    newShip?: ShipData;
    error?: 'insufficient_credits' | 'max_level_reached';
}

export interface IShipController {
    getCurrentShip(): ShipData;
    getNextShip(): ShipData | undefined;
    canAffordUpgrade(): boolean;
    isMaxLevel(): boolean;
    upgrade(): UpgradeResult;
    getLevel(): number;
    getMiningTime(): number;
    getToolSlots(): number;
}

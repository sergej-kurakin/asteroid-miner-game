export interface CellPosition {
    x: number;
    y: number;
    z: number;
}

export enum CellType {
    Empty = 'empty',
    Mining = 'mining',
    PowerStation = 'power_station',
    Market = 'market',
}

export interface Cell {
    position: CellPosition;
    type: CellType;
    miningConstraint: MiningConstraint;
}

export enum MiningConstraint {
    Any = 'any',
    SmallOnly = 'small_only',
    None = 'none',
}

export type World = Map<string, Cell>;

export interface IWorldGenerator {
    generate(): World;
}

export interface IWorldService {
    getCellAt(position: CellPosition): Cell | undefined;
    isInBounds(position: CellPosition): boolean;
    nearestPowerStationDistance(position: CellPosition): number;
    nearestMarketDistance(position: CellPosition): number;
    getPowerStations(): Cell[];
    getMarkets(): Cell[];
    getCellsInRadius(center: CellPosition, radius: number): Cell[];
    getAdjacentCells(position: CellPosition): Cell[];
    getMiningConstraint(position: CellPosition): MiningConstraint;
}

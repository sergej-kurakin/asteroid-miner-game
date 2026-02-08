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
}

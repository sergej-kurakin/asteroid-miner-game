import type { CellPosition } from './interfaces';

export const GRID_SIZE = 20; // 20 × 20 × 20
export const POWER_STATION_PROXIMITY_RADIUS = 3; // cells within this radius produce only small asteroids
export const MARKET_PROXIMITY_RADIUS = 3; // cells within this radius produce no asteroids
export const ORIGIN: CellPosition = { x: 0, y: 0, z: 0 }; // ship starts here

import type { ShipData } from './interfaces';
import { SHIPS, MAX_SHIP_LEVEL } from './constants';

export function getShipByLevel(level: number): ShipData {
    const ship = SHIPS[level - 1];
    if (!ship) throw new Error(`Invalid ship level: ${level}`);
    return ship;
}

export function getNextShip(currentLevel: number): ShipData | undefined {
    if (currentLevel >= MAX_SHIP_LEVEL) return undefined;
    return SHIPS[currentLevel];
}

export function isMaxShipLevel(level: number): boolean {
    return level >= MAX_SHIP_LEVEL;
}

export function canAffordShip(credits: number, ship: ShipData): boolean {
    return credits >= ship.cost;
}

export function getInitialShip(): ShipData {
    return SHIPS[0];
}

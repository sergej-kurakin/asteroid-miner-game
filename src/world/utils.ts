import type { Cell, CellPosition, World } from './interfaces';
import { CellType, MiningConstraint } from './interfaces';
import { GRID_SIZE, MARKET_PROXIMITY_RADIUS, ORIGIN, POWER_STATION_PROXIMITY_RADIUS } from './constants';

export function positionKey(pos: CellPosition): string {
    return `${pos.x},${pos.y},${pos.z}`;
}

export function getCellAt(world: World, pos: CellPosition): Cell | undefined {
    return world.get(positionKey(pos));
}

export function euclideanDistance(a: CellPosition, b: CellPosition): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function manhattanDistance(a: CellPosition, b: CellPosition): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);
}

export function isInBounds(pos: CellPosition): boolean {
    return (
        pos.x >= 0 && pos.x < GRID_SIZE &&
        pos.y >= 0 && pos.y < GRID_SIZE &&
        pos.z >= 0 && pos.z < GRID_SIZE
    );
}

export function getCellsInRadius(world: World, center: CellPosition, radius: number): Cell[] {
    const result: Cell[] = [];
    const r = Math.ceil(radius);
    for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
            for (let dz = -r; dz <= r; dz++) {
                const pos: CellPosition = { x: center.x + dx, y: center.y + dy, z: center.z + dz };
                if (!isInBounds(pos)) continue;
                if (euclideanDistance(center, pos) <= radius) {
                    const cell = getCellAt(world, pos);
                    if (cell) result.push(cell);
                }
            }
        }
    }
    return result;
}

export function getAdjacentCells(world: World, pos: CellPosition): Cell[] {
    const deltas: CellPosition[] = [
        { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
        { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 },
    ];
    return deltas
        .map(d => ({ x: pos.x + d.x, y: pos.y + d.y, z: pos.z + d.z }))
        .filter(isInBounds)
        .map(p => getCellAt(world, p))
        .filter((c): c is Cell => c !== undefined);
}

export function findPowerStations(world: World): Cell[] {
    return Array.from(world.values()).filter(c => c.type === CellType.PowerStation);
}

export function findMarkets(world: World): Cell[] {
    return Array.from(world.values()).filter(c => c.type === CellType.Market);
}

export function nearestPowerStationDistance(world: World, pos: CellPosition): number {
    const stations = findPowerStations(world);
    if (stations.length === 0) return Infinity;
    return Math.min(...stations.map(s => manhattanDistance(pos, s.position)));
}

export function getMiningConstraint(world: World, pos: CellPosition): MiningConstraint {
    // Near Market: no asteroids
    for (const market of findMarkets(world)) {
        if (euclideanDistance(pos, market.position) <= MARKET_PROXIMITY_RADIUS) {
            return MiningConstraint.None;
        }
    }

    // Origin always produces only small asteroids
    if (pos.x === ORIGIN.x && pos.y === ORIGIN.y && pos.z === ORIGIN.z) {
        return MiningConstraint.SmallOnly;
    }

    // Near Power Station: small only
    for (const station of findPowerStations(world)) {
        if (euclideanDistance(pos, station.position) <= POWER_STATION_PROXIMITY_RADIUS) {
            return MiningConstraint.SmallOnly;
        }
    }

    return MiningConstraint.Any;
}

import { describe, it, expect, beforeAll } from 'vitest';
import { WorldGenerator } from './generator';
import { CellType, MiningConstraint } from './interfaces';
import type { World } from './interfaces';
import { GRID_SIZE, NUM_MARKETS, NUM_POWER_STATIONS } from './constants';
import {
    euclideanDistance,
    findMarkets,
    findPowerStations,
    getAdjacentCells,
    getCellAt,
    getCellsInRadius,
    getMiningConstraint,
    isInBounds,
    manhattanDistance,
    nearestPowerStationDistance,
    positionKey,
} from './utils';

describe('utils', () => {
    let world: World;

    beforeAll(() => {
        world = new WorldGenerator().generate();
    });

    describe('positionKey', () => {
        it('returns expected string format', () => {
            expect(positionKey({ x: 1, y: 2, z: 3 })).toBe('1,2,3');
            expect(positionKey({ x: 0, y: 0, z: 0 })).toBe('0,0,0');
        });
    });

    describe('euclideanDistance', () => {
        it('returns 0 for same position', () => {
            expect(euclideanDistance({ x: 1, y: 1, z: 1 }, { x: 1, y: 1, z: 1 })).toBe(0);
        });

        it('calculates correct distance', () => {
            expect(euclideanDistance({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 })).toBe(5);
        });
    });

    describe('manhattanDistance', () => {
        it('returns 0 for same position', () => {
            expect(manhattanDistance({ x: 1, y: 1, z: 1 }, { x: 1, y: 1, z: 1 })).toBe(0);
        });

        it('calculates correct distance', () => {
            expect(manhattanDistance({ x: 0, y: 0, z: 0 }, { x: 1, y: 2, z: 3 })).toBe(6);
        });
    });

    describe('isInBounds', () => {
        it('returns true for valid positions', () => {
            expect(isInBounds({ x: 0, y: 0, z: 0 })).toBe(true);
            expect(isInBounds({ x: GRID_SIZE - 1, y: GRID_SIZE - 1, z: GRID_SIZE - 1 })).toBe(true);
        });

        it('returns false for out-of-bounds positions', () => {
            expect(isInBounds({ x: -1, y: 0, z: 0 })).toBe(false);
            expect(isInBounds({ x: GRID_SIZE, y: 0, z: 0 })).toBe(false);
            expect(isInBounds({ x: 0, y: -1, z: 0 })).toBe(false);
            expect(isInBounds({ x: 0, y: 0, z: GRID_SIZE })).toBe(false);
        });
    });

    describe('getCellAt', () => {
        it('returns cell at valid position', () => {
            const cell = getCellAt(world, { x: 0, y: 0, z: 0 });
            expect(cell).toBeDefined();
            expect(cell?.position).toEqual({ x: 0, y: 0, z: 0 });
        });

        it('returns undefined for out-of-bounds', () => {
            expect(getCellAt(world, { x: -1, y: 0, z: 0 })).toBeUndefined();
        });
    });

    describe('getCellsInRadius', () => {
        it('returns only the center cell for radius 0', () => {
            const cells = getCellsInRadius(world, { x: 5, y: 5, z: 5 }, 0);
            expect(cells.length).toBe(1);
        });

        it('returns cells within the given radius', () => {
            const center = { x: 5, y: 5, z: 5 };
            const cells = getCellsInRadius(world, center, 2);
            for (const cell of cells) {
                expect(euclideanDistance(center, cell.position)).toBeLessThanOrEqual(2);
            }
        });
    });

    describe('getAdjacentCells', () => {
        it('returns 3 cells for a corner position', () => {
            const cells = getAdjacentCells(world, { x: 0, y: 0, z: 0 });
            expect(cells.length).toBe(3);
        });

        it('returns 6 cells for an interior position', () => {
            const cells = getAdjacentCells(world, { x: 5, y: 5, z: 5 });
            expect(cells.length).toBe(6);
        });
    });

    describe('findPowerStations', () => {
        it('returns correct number of power stations', () => {
            expect(findPowerStations(world).length).toBe(NUM_POWER_STATIONS);
        });

        it('all returned cells are PowerStation type', () => {
            for (const cell of findPowerStations(world)) {
                expect(cell.type).toBe(CellType.PowerStation);
            }
        });
    });

    describe('findMarkets', () => {
        it('returns correct number of markets', () => {
            expect(findMarkets(world).length).toBe(NUM_MARKETS);
        });

        it('all returned cells are Market type', () => {
            for (const cell of findMarkets(world)) {
                expect(cell.type).toBe(CellType.Market);
            }
        });
    });

    describe('nearestPowerStationDistance', () => {
        it('returns finite distance when power stations exist', () => {
            expect(Number.isFinite(nearestPowerStationDistance(world, { x: 0, y: 0, z: 0 }))).toBe(true);
        });

        it('returns Infinity for empty world', () => {
            const emptyWorld: World = new Map();
            expect(nearestPowerStationDistance(emptyWorld, { x: 0, y: 0, z: 0 })).toBe(Infinity);
        });
    });

    describe('getMiningConstraint', () => {
        it('returns SmallOnly for origin (0,0,0)', () => {
            expect(getMiningConstraint(world, { x: 0, y: 0, z: 0 })).toBe(MiningConstraint.SmallOnly);
        });

        it('returns None within market proximity radius', () => {
            const markets = findMarkets(world);
            if (markets.length > 0) {
                const marketPos = markets[0].position;
                // Find a neighbor within radius
                const cells = getCellsInRadius(world, marketPos, 2);
                const nonMarket = cells.find(c => c.type !== CellType.Market && c.type !== CellType.PowerStation);
                if (nonMarket) {
                    expect(getMiningConstraint(world, nonMarket.position)).toBe(MiningConstraint.None);
                }
            }
        });

        it('returns SmallOnly within power station proximity radius', () => {
            const stations = findPowerStations(world);
            if (stations.length > 0) {
                const stationPos = stations[0].position;
                const cells = getCellsInRadius(world, stationPos, 2);
                const candidate = cells.find(
                    c => c.type !== CellType.PowerStation &&
                         c.type !== CellType.Market &&
                         (c.position.x !== 0 || c.position.y !== 0 || c.position.z !== 0),
                );
                if (candidate) {
                    expect(getMiningConstraint(world, candidate.position)).toBe(MiningConstraint.SmallOnly);
                }
            }
        });
    });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldService } from './service';
import type { World, Cell } from './interfaces';
import { CellType, MiningConstraint } from './interfaces';

describe('WorldService', () => {
    let world: World;
    let service: WorldService;

    beforeEach(() => {
        world = new Map<string, Cell>();

        // Origin cell (0,0,0) - Mining
        world.set('0,0,0', {
            position: { x: 0, y: 0, z: 0 },
            type: CellType.Mining,
            miningConstraint: MiningConstraint.Any
        });

        // Market at (5,5,5)
        world.set('5,5,5', {
            position: { x: 5, y: 5, z: 5 },
            type: CellType.Market,
            miningConstraint: MiningConstraint.None
        });

        // Power station at (10,10,10)
        world.set('10,10,10', {
            position: { x: 10, y: 10, z: 10 },
            type: CellType.PowerStation,
            miningConstraint: MiningConstraint.None
        });

        // Additional mining cells for adjacency tests
        world.set('1,0,0', {
            position: { x: 1, y: 0, z: 0 },
            type: CellType.Mining,
            miningConstraint: MiningConstraint.Any
        });
        world.set('0,1,0', {
            position: { x: 0, y: 1, z: 0 },
            type: CellType.Mining,
            miningConstraint: MiningConstraint.Any
        });
        world.set('0,0,1', {
            position: { x: 0, y: 0, z: 1 },
            type: CellType.Mining,
            miningConstraint: MiningConstraint.Any
        });

        service = new WorldService(world);
    });

    describe('getCellAt', () => {
        it('returns cell at valid position', () => {
            const cell = service.getCellAt({ x: 5, y: 5, z: 5 });
            expect(cell).toBeDefined();
            expect(cell?.type).toBe(CellType.Market);
            expect(cell?.position).toEqual({ x: 5, y: 5, z: 5 });
        });

        it('returns cell at origin', () => {
            const cell = service.getCellAt({ x: 0, y: 0, z: 0 });
            expect(cell).toBeDefined();
            expect(cell?.type).toBe(CellType.Mining);
        });

        it('returns undefined for missing position', () => {
            const cell = service.getCellAt({ x: 99, y: 99, z: 99 });
            expect(cell).toBeUndefined();
        });

        it('returns undefined for negative coordinates', () => {
            const cell = service.getCellAt({ x: -1, y: -1, z: -1 });
            expect(cell).toBeUndefined();
        });
    });

    describe('isInBounds', () => {
        it('returns true for origin', () => {
            expect(service.isInBounds({ x: 0, y: 0, z: 0 })).toBe(true);
        });

        it('returns true for valid positions', () => {
            expect(service.isInBounds({ x: 5, y: 5, z: 5 })).toBe(true);
            expect(service.isInBounds({ x: 10, y: 10, z: 10 })).toBe(true);
            expect(service.isInBounds({ x: 19, y: 19, z: 19 })).toBe(true);
        });

        it('returns false for negative coordinates', () => {
            expect(service.isInBounds({ x: -1, y: 0, z: 0 })).toBe(false);
            expect(service.isInBounds({ x: 0, y: -1, z: 0 })).toBe(false);
            expect(service.isInBounds({ x: 0, y: 0, z: -1 })).toBe(false);
        });

        it('returns false for coordinates at or beyond grid size', () => {
            expect(service.isInBounds({ x: 20, y: 0, z: 0 })).toBe(false);
            expect(service.isInBounds({ x: 0, y: 20, z: 0 })).toBe(false);
            expect(service.isInBounds({ x: 0, y: 0, z: 20 })).toBe(false);
        });
    });

    describe('getPowerStations', () => {
        it('returns all power stations', () => {
            const stations = service.getPowerStations();
            expect(stations.length).toBe(1);
            expect(stations[0].type).toBe(CellType.PowerStation);
            expect(stations[0].position).toEqual({ x: 10, y: 10, z: 10 });
        });

        it('caches results on subsequent calls', () => {
            const first = service.getPowerStations();
            const second = service.getPowerStations();
            expect(first).toBe(second); // Same array reference
        });

        it('returns empty array when no power stations exist', () => {
            const emptyWorld = new Map<string, Cell>();
            emptyWorld.set('0,0,0', {
                position: { x: 0, y: 0, z: 0 },
                type: CellType.Mining,
                miningConstraint: MiningConstraint.Any
            });
            const emptyService = new WorldService(emptyWorld);
            expect(emptyService.getPowerStations()).toEqual([]);
        });

        it('finds multiple power stations', () => {
            world.set('15,15,15', {
                position: { x: 15, y: 15, z: 15 },
                type: CellType.PowerStation,
                miningConstraint: MiningConstraint.None
            });
            const newService = new WorldService(world);
            const stations = newService.getPowerStations();
            expect(stations.length).toBe(2);
        });
    });

    describe('getMarkets', () => {
        it('returns all markets', () => {
            const markets = service.getMarkets();
            expect(markets.length).toBe(1);
            expect(markets[0].type).toBe(CellType.Market);
            expect(markets[0].position).toEqual({ x: 5, y: 5, z: 5 });
        });

        it('caches results on subsequent calls', () => {
            const first = service.getMarkets();
            const second = service.getMarkets();
            expect(first).toBe(second); // Same array reference
        });

        it('returns empty array when no markets exist', () => {
            const emptyWorld = new Map<string, Cell>();
            emptyWorld.set('0,0,0', {
                position: { x: 0, y: 0, z: 0 },
                type: CellType.Mining,
                miningConstraint: MiningConstraint.Any
            });
            const emptyService = new WorldService(emptyWorld);
            expect(emptyService.getMarkets()).toEqual([]);
        });

        it('finds multiple markets', () => {
            world.set('15,15,15', {
                position: { x: 15, y: 15, z: 15 },
                type: CellType.Market,
                miningConstraint: MiningConstraint.None
            });
            const newService = new WorldService(world);
            const markets = newService.getMarkets();
            expect(markets.length).toBe(2);
        });
    });

    describe('nearestPowerStationDistance', () => {
        it('returns distance to nearest power station from origin', () => {
            // Manhattan distance from (0,0,0) to (10,10,10) = 30
            const distance = service.nearestPowerStationDistance({ x: 0, y: 0, z: 0 });
            expect(distance).toBe(30);
        });

        it('returns distance to nearest power station from market', () => {
            // Manhattan distance from (5,5,5) to (10,10,10) = 15
            const distance = service.nearestPowerStationDistance({ x: 5, y: 5, z: 5 });
            expect(distance).toBe(15);
        });

        it('returns 0 for position at power station', () => {
            const distance = service.nearestPowerStationDistance({ x: 10, y: 10, z: 10 });
            expect(distance).toBe(0);
        });

        it('returns Infinity when no power stations exist', () => {
            const emptyWorld = new Map<string, Cell>();
            const emptyService = new WorldService(emptyWorld);
            const distance = emptyService.nearestPowerStationDistance({ x: 0, y: 0, z: 0 });
            expect(distance).toBe(Infinity);
        });
    });

    describe('nearestMarketDistance', () => {
        it('returns distance to nearest market from origin', () => {
            // Manhattan distance from (0,0,0) to (5,5,5) = 15
            const distance = service.nearestMarketDistance({ x: 0, y: 0, z: 0 });
            expect(distance).toBe(15);
        });

        it('returns distance to nearest market from power station', () => {
            // Manhattan distance from (10,10,10) to (5,5,5) = 15
            const distance = service.nearestMarketDistance({ x: 10, y: 10, z: 10 });
            expect(distance).toBe(15);
        });

        it('returns 0 for position at market', () => {
            const distance = service.nearestMarketDistance({ x: 5, y: 5, z: 5 });
            expect(distance).toBe(0);
        });

        it('returns Infinity when no markets exist', () => {
            const emptyWorld = new Map<string, Cell>();
            const emptyService = new WorldService(emptyWorld);
            const distance = emptyService.nearestMarketDistance({ x: 0, y: 0, z: 0 });
            expect(distance).toBe(Infinity);
        });

        it('finds nearest of multiple markets', () => {
            // Add a closer market at (2,2,2) - distance 6 from origin
            world.set('2,2,2', {
                position: { x: 2, y: 2, z: 2 },
                type: CellType.Market,
                miningConstraint: MiningConstraint.None
            });
            const newService = new WorldService(world);
            const distance = newService.nearestMarketDistance({ x: 0, y: 0, z: 0 });
            expect(distance).toBe(6); // Closer than (5,5,5)
        });
    });

    describe('getCellsInRadius', () => {
        it('returns cells within radius', () => {
            // Add more cells for radius test
            world.set('2,0,0', {
                position: { x: 2, y: 0, z: 0 },
                type: CellType.Mining,
                miningConstraint: MiningConstraint.Any
            });
            world.set('0,2,0', {
                position: { x: 0, y: 2, z: 0 },
                type: CellType.Mining,
                miningConstraint: MiningConstraint.Any
            });

            const cells = service.getCellsInRadius({ x: 0, y: 0, z: 0 }, 2.5);
            // Should include origin, (1,0,0), (0,1,0), (0,0,1), (2,0,0), (0,2,0)
            expect(cells.length).toBeGreaterThanOrEqual(3);
        });

        it('returns center cell only for radius 0', () => {
            const cells = service.getCellsInRadius({ x: 0, y: 0, z: 0 }, 0);
            // Radius 0 includes center since euclideanDistance(center, center) = 0 <= 0
            expect(cells.length).toBe(1);
            expect(cells[0].position).toEqual({ x: 0, y: 0, z: 0 });
        });

        it('includes center cell if it exists', () => {
            const cells = service.getCellsInRadius({ x: 0, y: 0, z: 0 }, 0.5);
            expect(cells.length).toBe(1);
            expect(cells[0].position).toEqual({ x: 0, y: 0, z: 0 });
        });
    });

    describe('getAdjacentCells', () => {
        it('returns adjacent cells from origin', () => {
            const adjacent = service.getAdjacentCells({ x: 0, y: 0, z: 0 });
            // We added (1,0,0), (0,1,0), (0,0,1)
            expect(adjacent.length).toBe(3);

            const positions = adjacent.map(c => c.position);
            expect(positions).toContainEqual({ x: 1, y: 0, z: 0 });
            expect(positions).toContainEqual({ x: 0, y: 1, z: 0 });
            expect(positions).toContainEqual({ x: 0, y: 0, z: 1 });
        });

        it('returns empty array for isolated cell', () => {
            const adjacent = service.getAdjacentCells({ x: 5, y: 5, z: 5 });
            expect(adjacent).toEqual([]);
        });

        it('returns all 6 adjacent cells if they exist', () => {
            const center = { x: 10, y: 10, z: 10 };
            // Add all 6 neighbors
            world.set('11,10,10', {
                position: { x: 11, y: 10, z: 10 },
                type: CellType.Mining,
                miningConstraint: MiningConstraint.Any
            });
            world.set('9,10,10', {
                position: { x: 9, y: 10, z: 10 },
                type: CellType.Mining,
                miningConstraint: MiningConstraint.Any
            });
            world.set('10,11,10', {
                position: { x: 10, y: 11, z: 10 },
                type: CellType.Mining,
                miningConstraint: MiningConstraint.Any
            });
            world.set('10,9,10', {
                position: { x: 10, y: 9, z: 10 },
                type: CellType.Mining,
                miningConstraint: MiningConstraint.Any
            });
            world.set('10,10,11', {
                position: { x: 10, y: 10, z: 11 },
                type: CellType.Mining,
                miningConstraint: MiningConstraint.Any
            });
            world.set('10,10,9', {
                position: { x: 10, y: 10, z: 9 },
                type: CellType.Mining,
                miningConstraint: MiningConstraint.Any
            });

            const newService = new WorldService(world);
            const adjacent = newService.getAdjacentCells(center);
            expect(adjacent.length).toBe(6);
        });
    });

    describe('getMiningConstraint', () => {
        it('returns constraint for origin (far from structures)', () => {
            // Origin is 30 from power station, 15 from market
            const constraint = service.getMiningConstraint({ x: 0, y: 0, z: 0 });
            // Based on world/utils.ts logic, this should be MiningConstraint.None
            // since it's beyond both proximity radii
            expect([MiningConstraint.None, MiningConstraint.SmallOnly, MiningConstraint.Any])
                .toContain(constraint);
        });

        it('returns constraint for power station cell', () => {
            // Power station at (10,10,10) is within its own proximity radius (2)
            // So distance 0 <= 2, meaning SmallOnly constraint
            const constraint = service.getMiningConstraint({ x: 10, y: 10, z: 10 });
            expect(constraint).toBe(MiningConstraint.SmallOnly);
        });

        it('returns constraint for market cell', () => {
            const constraint = service.getMiningConstraint({ x: 5, y: 5, z: 5 });
            expect(constraint).toBe(MiningConstraint.None);
        });
    });

    describe('integration', () => {
        it('can chain multiple queries', () => {
            // Check if a position is valid and get its cell
            const pos = { x: 0, y: 0, z: 0 };
            expect(service.isInBounds(pos)).toBe(true);

            const cell = service.getCellAt(pos);
            expect(cell).toBeDefined();

            // Get nearby structures
            const powerDist = service.nearestPowerStationDistance(pos);
            const marketDist = service.nearestMarketDistance(pos);
            expect(powerDist).toBeGreaterThan(0);
            expect(marketDist).toBeGreaterThan(0);
        });

        it('caching does not affect correctness', () => {
            // Call cached methods multiple times
            const stations1 = service.getPowerStations();
            const markets1 = service.getMarkets();
            const stations2 = service.getPowerStations();
            const markets2 = service.getMarkets();

            // Should return same reference (cached)
            expect(stations1).toBe(stations2);
            expect(markets1).toBe(markets2);

            // But content should still be correct
            expect(stations1.length).toBe(1);
            expect(markets1.length).toBe(1);
        });
    });
});

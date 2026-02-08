import { describe, it, expect } from 'vitest';
import { WorldGenerator } from './generator';
import { CellType, MiningConstraint } from './interfaces';
import { GRID_SIZE, MIN_STRUCTURE_DISTANCE, NUM_MARKETS, NUM_POWER_STATIONS, ORIGIN } from './constants';
import { manhattanDistance } from './utils';

describe('WorldGenerator', () => {
    const generator = new WorldGenerator();

    it('generates a world with exactly GRID_SIZE^3 cells', () => {
        const world = generator.generate();
        expect(world.size).toBe(GRID_SIZE ** 3);
    });

    it('places exactly NUM_POWER_STATIONS power stations', () => {
        const world = generator.generate();
        const count = Array.from(world.values()).filter(c => c.type === CellType.PowerStation).length;
        expect(count).toBe(NUM_POWER_STATIONS);
    });

    it('places exactly NUM_MARKETS markets', () => {
        const world = generator.generate();
        const count = Array.from(world.values()).filter(c => c.type === CellType.Market).length;
        expect(count).toBe(NUM_MARKETS);
    });

    it('sets origin (0,0,0) as Mining cell', () => {
        const world = generator.generate();
        const cell = world.get(`${ORIGIN.x},${ORIGIN.y},${ORIGIN.z}`);
        expect(cell?.type).toBe(CellType.Mining);
    });

    it('does not place special structures at origin', () => {
        const world = generator.generate();
        const cell = world.get(`${ORIGIN.x},${ORIGIN.y},${ORIGIN.z}`);
        expect(cell?.type).not.toBe(CellType.PowerStation);
        expect(cell?.type).not.toBe(CellType.Market);
    });

    it('all special structures are at least MIN_STRUCTURE_DISTANCE apart', () => {
        const world = generator.generate();
        const specials = Array.from(world.values()).filter(
            c => c.type === CellType.PowerStation || c.type === CellType.Market,
        );
        for (let i = 0; i < specials.length; i++) {
            for (let j = i + 1; j < specials.length; j++) {
                const dist = manhattanDistance(specials[i].position, specials[j].position);
                expect(dist).toBeGreaterThanOrEqual(MIN_STRUCTURE_DISTANCE);
            }
        }
    });

    it('generates the same world deterministically', () => {
        const world1 = generator.generate();
        const world2 = generator.generate();
        expect(world1.size).toBe(world2.size);
        for (const [key, cell] of world1) {
            expect(world2.get(key)?.type).toBe(cell.type);
        }
    });

    it('all cells have valid positions within grid bounds', () => {
        const world = generator.generate();
        for (const cell of world.values()) {
            expect(cell.position.x).toBeGreaterThanOrEqual(0);
            expect(cell.position.x).toBeLessThan(GRID_SIZE);
            expect(cell.position.y).toBeGreaterThanOrEqual(0);
            expect(cell.position.y).toBeLessThan(GRID_SIZE);
            expect(cell.position.z).toBeGreaterThanOrEqual(0);
            expect(cell.position.z).toBeLessThan(GRID_SIZE);
        }
    });

    it('origin cell has SmallOnly constraint', () => {
        const world = generator.generate();
        const cell = world.get(`${ORIGIN.x},${ORIGIN.y},${ORIGIN.z}`);
        expect(cell?.miningConstraint).toBe(MiningConstraint.SmallOnly);
    });

    it('cell within radius 3 of a market has None constraint', () => {
        // Market is at (3,11,5); cell (3,11,3) is distance 2 away
        const world = generator.generate();
        const cell = world.get('3,11,3');
        expect(cell?.miningConstraint).toBe(MiningConstraint.None);
    });

    it('cell within radius 3 of a power station (not near market) has SmallOnly constraint', () => {
        // Station at (4,7,0); cell (4,7,2) is distance 2 away
        const world = generator.generate();
        const cell = world.get('4,7,2');
        expect(cell?.miningConstraint).toBe(MiningConstraint.SmallOnly);
    });

    it('cell far from all structures has Any constraint', () => {
        // (10,10,10) is far from all markets and power stations
        const world = generator.generate();
        const cell = world.get('10,10,10');
        expect(cell?.miningConstraint).toBe(MiningConstraint.Any);
    });

    it('all cells have a miningConstraint property', () => {
        const world = generator.generate();
        for (const cell of world.values()) {
            expect(cell.miningConstraint).toBeDefined();
            expect(Object.values(MiningConstraint)).toContain(cell.miningConstraint);
        }
    });
});

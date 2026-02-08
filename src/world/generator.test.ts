import { describe, it, expect } from 'vitest';
import { WorldGenerator } from './generator';
import { CellType } from './interfaces';
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
});

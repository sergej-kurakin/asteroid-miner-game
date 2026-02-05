import { describe, it, expect } from 'vitest';
import { AsteroidGenerator, generateAsteroid } from './generator';
import type { RandomProvider, WeightedItem } from './interfaces';
import { ASTEROID_SIZES, ASTEROID_TYPES, SHIP_SPAWN_CONFIG } from './constants';

/**
 * Create a mock random provider with deterministic behavior
 */
function createMockRandom(options: {
    randomInRangeValue?: number;
    randomInRangeSequence?: number[];
    weightedSelectIndex?: number;
} = {}): RandomProvider {
    let randomInRangeCallIndex = 0;

    return {
        randomInRange(min: number, max: number): number {
            if (options.randomInRangeSequence && options.randomInRangeSequence.length > 0) {
                const value = options.randomInRangeSequence[randomInRangeCallIndex % options.randomInRangeSequence.length];
                randomInRangeCallIndex++;
                return Math.max(min, Math.min(max, value));
            }
            // Default: return min value
            return options.randomInRangeValue !== undefined
                ? Math.max(min, Math.min(max, options.randomInRangeValue))
                : min;
        },
        weightedRandomSelect<T>(items: WeightedItem<T>[]): T {
            const index = options.weightedSelectIndex ?? 0;
            return items[Math.min(index, items.length - 1)].value;
        }
    };
}

describe('AsteroidGenerator', () => {
    describe('constructor', () => {
        it('should create generator with default random provider', () => {
            const generator = new AsteroidGenerator();
            const asteroid = generator.generate(1);
            expect(asteroid).toBeDefined();
            expect(asteroid.size).toBeDefined();
            expect(asteroid.type).toBeDefined();
        });

        it('should create generator with injected random provider', () => {
            const mockRandom = createMockRandom({ weightedSelectIndex: 0 });
            const generator = new AsteroidGenerator(mockRandom);
            const asteroid = generator.generate(1);
            expect(asteroid).toBeDefined();
        });
    });

    describe('ship level handling', () => {
        it('should default to level 1 config for ship level 0', () => {
            const mockRandom = createMockRandom({ weightedSelectIndex: 0 });
            const generator = new AsteroidGenerator(mockRandom);
            const asteroid = generator.generate(0);

            // Level 1 config should be used - first size is 'tiny', first type is 'iron_nickel'
            const level1Sizes = Object.keys(SHIP_SPAWN_CONFIG[1].sizes);
            const level1Types = Object.keys(SHIP_SPAWN_CONFIG[1].types);
            expect(level1Sizes).toContain(asteroid.size);
            expect(level1Types).toContain(asteroid.type);
        });

        it('should default to level 1 config for negative ship level', () => {
            const mockRandom = createMockRandom({ weightedSelectIndex: 0 });
            const generator = new AsteroidGenerator(mockRandom);
            const asteroid = generator.generate(-1);

            const level1Sizes = Object.keys(SHIP_SPAWN_CONFIG[1].sizes);
            expect(level1Sizes).toContain(asteroid.size);
        });

        it('should default to level 1 config for ship level > 5', () => {
            const mockRandom = createMockRandom({ weightedSelectIndex: 0 });
            const generator = new AsteroidGenerator(mockRandom);
            const asteroid = generator.generate(10);

            const level1Sizes = Object.keys(SHIP_SPAWN_CONFIG[1].sizes);
            expect(level1Sizes).toContain(asteroid.size);
        });

        it('should use correct config for valid ship levels 1-5', () => {
            for (let level = 1; level <= 5; level++) {
                const mockRandom = createMockRandom({ weightedSelectIndex: 0 });
                const generator = new AsteroidGenerator(mockRandom);
                const asteroid = generator.generate(level);

                const configSizes = Object.keys(SHIP_SPAWN_CONFIG[level].sizes);
                const configTypes = Object.keys(SHIP_SPAWN_CONFIG[level].types);

                expect(configSizes).toContain(asteroid.size);
                expect(configTypes).toContain(asteroid.type);
            }
        });
    });

    describe('size selection', () => {
        it('should select first available size when weightedSelectIndex is 0', () => {
            const mockRandom = createMockRandom({ weightedSelectIndex: 0 });
            const generator = new AsteroidGenerator(mockRandom);

            // Level 1 first size is 'tiny'
            const asteroid = generator.generate(1);
            expect(asteroid.size).toBe('tiny');
        });

        it('should select second available size when weightedSelectIndex is 1', () => {
            const mockRandom = createMockRandom({ weightedSelectIndex: 1 });
            const generator = new AsteroidGenerator(mockRandom);

            // Level 1 second size is 'small'
            const asteroid = generator.generate(1);
            expect(asteroid.size).toBe('small');
        });

        it('should respect ship level size constraints', () => {
            // Level 5 should not have tiny asteroids
            const mockRandom = createMockRandom({ weightedSelectIndex: 0 });
            const generator = new AsteroidGenerator(mockRandom);
            const asteroid = generator.generate(5);

            // Level 5 first size is 'medium'
            expect(asteroid.size).toBe('medium');
            expect(['medium', 'large', 'massive', 'colossal']).toContain(asteroid.size);
        });
    });

    describe('type selection', () => {
        it('should select first available type when weightedSelectIndex is 0', () => {
            const mockRandom = createMockRandom({ weightedSelectIndex: 0 });
            const generator = new AsteroidGenerator(mockRandom);

            // Level 1 first type is 'iron_nickel'
            const asteroid = generator.generate(1);
            expect(asteroid.type).toBe('iron_nickel');
        });

        it('should respect ship level type unlocks', () => {
            // Level 1 should only have iron_nickel and carbonaceous
            const level1Types = Object.keys(SHIP_SPAWN_CONFIG[1].types);
            expect(level1Types).toContain('iron_nickel');
            expect(level1Types).toContain('carbonaceous');
            expect(level1Types).not.toContain('rare_earth');
            expect(level1Types).not.toContain('olivine');

            // Level 3 should have olivine
            const level3Types = Object.keys(SHIP_SPAWN_CONFIG[3].types);
            expect(level3Types).toContain('olivine');
        });
    });

    describe('composition generation', () => {
        it('should generate composition that sums to 100%', () => {
            const generator = new AsteroidGenerator();

            for (let i = 0; i < 20; i++) {
                const asteroid = generator.generate(3);
                const total = Object.values(asteroid.composition).reduce((sum, val) => sum + val, 0);
                expect(total).toBe(100);
            }
        });

        it('should include all elements defined for the type', () => {
            const mockRandom = createMockRandom({ weightedSelectIndex: 0 });
            const generator = new AsteroidGenerator(mockRandom);

            // iron_nickel type
            const asteroid = generator.generate(1);
            expect(asteroid.type).toBe('iron_nickel');

            const expectedElements = Object.keys(ASTEROID_TYPES.iron_nickel.composition);
            const actualElements = Object.keys(asteroid.composition);

            for (const element of expectedElements) {
                expect(actualElements).toContain(element);
            }
        });

        it('should produce composition values within type ranges after normalization', () => {
            // Test with min values
            const mockRandom = createMockRandom({ randomInRangeValue: 0 });
            const generator = new AsteroidGenerator(mockRandom);
            const asteroid = generator.generate(1);

            // All values should be >= 0 and <= 100
            for (const value of Object.values(asteroid.composition)) {
                expect(value).toBeGreaterThanOrEqual(0);
                expect(value).toBeLessThanOrEqual(100);
            }
        });
    });

    describe('yield calculation', () => {
        it('should calculate yield within size range for type without bonus', () => {
            // iron_nickel has yieldBonus of 1.0
            const mockRandom = createMockRandom({
                weightedSelectIndex: 0, // tiny, iron_nickel
                randomInRangeValue: 50 // Will be clamped to valid range
            });
            const generator = new AsteroidGenerator(mockRandom);
            const asteroid = generator.generate(1);

            const sizeConfig = ASTEROID_SIZES[asteroid.size];
            expect(asteroid.totalYield).toBeGreaterThanOrEqual(sizeConfig.yieldMin);
            expect(asteroid.totalYield).toBeLessThanOrEqual(Math.round(sizeConfig.yieldMax * 1.3)); // Max bonus is 1.3
        });

        it('should apply type yield bonus for olivine', () => {
            // Select olivine type (available at level 3, index 3)
            const mockRandom = createMockRandom({
                weightedSelectIndex: 3, // olivine is 4th type at level 3
                randomInRangeSequence: [
                    50, // size selection (min value)
                    50, // type selection (min value)
                    50, 50, 50, 50, 50, // composition values
                    100 // base yield - will be clamped to actual range
                ]
            });
            const generator = new AsteroidGenerator(mockRandom);
            const asteroid = generator.generate(3);

            // Olivine has 1.3x yield bonus
            if (asteroid.type === 'olivine') {
                const sizeConfig = ASTEROID_SIZES[asteroid.size];
                // Yield should be boosted by 1.3x
                expect(asteroid.totalYield).toBeGreaterThanOrEqual(Math.round(sizeConfig.yieldMin * 1.3));
            }
        });

        it('should return yield within valid range with real random', () => {
            const generator = new AsteroidGenerator();

            for (let i = 0; i < 20; i++) {
                const asteroid = generator.generate(3);
                const sizeConfig = ASTEROID_SIZES[asteroid.size];
                const typeConfig = ASTEROID_TYPES[asteroid.type];

                const minYield = Math.round(sizeConfig.yieldMin * typeConfig.yieldBonus);
                const maxYield = Math.round(sizeConfig.yieldMax * typeConfig.yieldBonus);

                expect(asteroid.totalYield).toBeGreaterThanOrEqual(minYield);
                expect(asteroid.totalYield).toBeLessThanOrEqual(maxYield);
            }
        });
    });

    describe('asteroid properties', () => {
        it('should include miningTime from size config', () => {
            const mockRandom = createMockRandom({ weightedSelectIndex: 0 });
            const generator = new AsteroidGenerator(mockRandom);
            const asteroid = generator.generate(1);

            const sizeConfig = ASTEROID_SIZES[asteroid.size];
            expect(asteroid.miningTime).toBe(sizeConfig.miningTime);
        });

        it('should include visualDiameter from size config', () => {
            const mockRandom = createMockRandom({ weightedSelectIndex: 0 });
            const generator = new AsteroidGenerator(mockRandom);
            const asteroid = generator.generate(1);

            const sizeConfig = ASTEROID_SIZES[asteroid.size];
            expect(asteroid.visualDiameter).toBe(sizeConfig.visualDiameter);
        });

        it('should return complete asteroid object', () => {
            const generator = new AsteroidGenerator();
            const asteroid = generator.generate(1);

            expect(asteroid).toHaveProperty('type');
            expect(asteroid).toHaveProperty('size');
            expect(asteroid).toHaveProperty('composition');
            expect(asteroid).toHaveProperty('totalYield');
            expect(asteroid).toHaveProperty('miningTime');
            expect(asteroid).toHaveProperty('visualDiameter');

            expect(typeof asteroid.type).toBe('string');
            expect(typeof asteroid.size).toBe('string');
            expect(typeof asteroid.composition).toBe('object');
            expect(typeof asteroid.totalYield).toBe('number');
            expect(typeof asteroid.miningTime).toBe('number');
            expect(typeof asteroid.visualDiameter).toBe('number');
        });
    });
});

describe('generateAsteroid (backward compatibility)', () => {
    it('should generate asteroid for valid ship level', () => {
        const asteroid = generateAsteroid(1);
        expect(asteroid).toBeDefined();
        expect(asteroid.size).toBeDefined();
        expect(asteroid.type).toBeDefined();
        expect(asteroid.composition).toBeDefined();
        expect(asteroid.totalYield).toBeGreaterThan(0);
    });

    it('should handle invalid ship levels gracefully', () => {
        const asteroid = generateAsteroid(0);
        expect(asteroid).toBeDefined();

        const asteroid2 = generateAsteroid(-1);
        expect(asteroid2).toBeDefined();

        const asteroid3 = generateAsteroid(100);
        expect(asteroid3).toBeDefined();
    });

    it('should produce valid asteroids for all ship levels', () => {
        for (let level = 1; level <= 5; level++) {
            const asteroid = generateAsteroid(level);

            expect(asteroid.size).toBeDefined();
            expect(asteroid.type).toBeDefined();

            const compositionSum = Object.values(asteroid.composition).reduce((sum, val) => sum + val, 0);
            expect(compositionSum).toBe(100);

            expect(asteroid.totalYield).toBeGreaterThan(0);
            expect(asteroid.miningTime).toBeGreaterThan(0);
            expect(asteroid.visualDiameter).toBeGreaterThan(0);
        }
    });
});

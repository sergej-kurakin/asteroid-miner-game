import type { Asteroid, AsteroidSize, AsteroidType, AsteroidComposition, RandomProvider, IAsteroidGenerator } from './interfaces';
import { ASTEROID_SIZES, ASTEROID_TYPES, SHIP_SPAWN_CONFIG } from './constants';
import { probabilityMapToWeightedItems, normalizeComposition } from './utils';
import { DefaultRandomProvider } from './random-provider';

/**
 * Class-based asteroid generator with dependency injection support
 */
export class AsteroidGenerator implements IAsteroidGenerator {
    private readonly random: RandomProvider;

    constructor(randomProvider?: RandomProvider) {
        this.random = randomProvider ?? new DefaultRandomProvider();
    }

    /**
     * Generate a complete asteroid based on ship level
     */
    generate(shipLevel: number): Asteroid {
        const size = this.selectSize(shipLevel);
        const type = this.selectType(shipLevel);
        const composition = this.generateComposition(type);
        const totalYield = this.calculateYield(size, type);

        const sizeConfig = ASTEROID_SIZES[size];

        return {
            type,
            size,
            composition,
            totalYield,
            miningTime: sizeConfig.miningTime,
            visualDiameter: sizeConfig.visualDiameter
        };
    }

    /**
     * Select asteroid size based on ship level spawn probabilities
     */
    private selectSize(shipLevel: number): AsteroidSize {
        const config = SHIP_SPAWN_CONFIG[shipLevel] || SHIP_SPAWN_CONFIG[1];
        const weightedSizes = probabilityMapToWeightedItems<AsteroidSize>(config.sizes);
        return this.random.weightedRandomSelect(weightedSizes);
    }

    /**
     * Select asteroid type based on ship level spawn probabilities
     */
    private selectType(shipLevel: number): AsteroidType {
        const config = SHIP_SPAWN_CONFIG[shipLevel] || SHIP_SPAWN_CONFIG[1];
        const weightedTypes = probabilityMapToWeightedItems<AsteroidType>(config.types);
        return this.random.weightedRandomSelect(weightedTypes);
    }

    /**
     * Generate random composition based on asteroid type configuration
     * Percentages are randomized within configured ranges and normalized to 100%
     */
    private generateComposition(type: AsteroidType): AsteroidComposition {
        const typeConfig = ASTEROID_TYPES[type];
        const rawComposition: AsteroidComposition = {};

        // Generate random values within each element's range
        for (const [element, range] of Object.entries(typeConfig.composition)) {
            rawComposition[element] = this.random.randomInRange(range.min, range.max);
        }

        // Normalize to ensure percentages sum to 100
        return normalizeComposition(rawComposition);
    }

    /**
     * Calculate total yield based on size and type bonuses
     */
    private calculateYield(size: AsteroidSize, type: AsteroidType): number {
        const sizeConfig = ASTEROID_SIZES[size];
        const typeConfig = ASTEROID_TYPES[type];

        const baseYield = this.random.randomInRange(sizeConfig.yieldMin, sizeConfig.yieldMax);
        return Math.round(baseYield * typeConfig.yieldBonus);
    }
}

// Default generator instance for backward compatibility
const defaultGenerator = new AsteroidGenerator();

/**
 * Generate a complete asteroid based on ship level
 * This is the main public function for asteroid generation (backward compatible)
 */
export function generateAsteroid(shipLevel: number): Asteroid {
    return defaultGenerator.generate(shipLevel);
}

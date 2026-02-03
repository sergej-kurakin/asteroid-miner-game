import type { Asteroid, AsteroidSize, AsteroidType, AsteroidComposition } from './interfaces';
import { ASTEROID_SIZES, ASTEROID_TYPES, SHIP_SPAWN_CONFIG } from './constants';
import { randomInRange, weightedRandomSelect, probabilityMapToWeightedItems, normalizeComposition } from './utils';

/**
 * Select asteroid size based on ship level spawn probabilities
 */
function selectSize(shipLevel: number): AsteroidSize {
    const config = SHIP_SPAWN_CONFIG[shipLevel] || SHIP_SPAWN_CONFIG[1];
    const weightedSizes = probabilityMapToWeightedItems<AsteroidSize>(config.sizes);
    return weightedRandomSelect(weightedSizes);
}

/**
 * Select asteroid type based on ship level spawn probabilities
 */
function selectType(shipLevel: number): AsteroidType {
    const config = SHIP_SPAWN_CONFIG[shipLevel] || SHIP_SPAWN_CONFIG[1];
    const weightedTypes = probabilityMapToWeightedItems<AsteroidType>(config.types);
    return weightedRandomSelect(weightedTypes);
}

/**
 * Generate random composition based on asteroid type configuration
 * Percentages are randomized within configured ranges and normalized to 100%
 */
function generateComposition(type: AsteroidType): AsteroidComposition {
    const typeConfig = ASTEROID_TYPES[type];
    const rawComposition: AsteroidComposition = {};

    // Generate random values within each element's range
    for (const [element, range] of Object.entries(typeConfig.composition)) {
        rawComposition[element] = randomInRange(range.min, range.max);
    }

    // Normalize to ensure percentages sum to 100
    return normalizeComposition(rawComposition);
}

/**
 * Calculate total yield based on size and type bonuses
 */
function calculateYield(size: AsteroidSize, type: AsteroidType): number {
    const sizeConfig = ASTEROID_SIZES[size];
    const typeConfig = ASTEROID_TYPES[type];

    const baseYield = randomInRange(sizeConfig.yieldMin, sizeConfig.yieldMax);
    return Math.round(baseYield * typeConfig.yieldBonus);
}

/**
 * Generate a complete asteroid based on ship level
 * This is the main public function for asteroid generation
 */
export function generateAsteroid(shipLevel: number): Asteroid {
    const size = selectSize(shipLevel);
    const type = selectType(shipLevel);
    const composition = generateComposition(type);
    const totalYield = calculateYield(size, type);

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

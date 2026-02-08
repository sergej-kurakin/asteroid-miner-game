import type { Asteroid, AsteroidSize, AsteroidType, AsteroidComposition, WeightedItem, RandomProvider, IAsteroidGenerator } from './interfaces';
import { ASTEROID_SIZES, ASTEROID_TYPES, SHIP_SPAWN_CONFIG } from './constants';
import { DefaultRandomProvider } from './random-provider';
import { MiningConstraint } from '../world/interfaces';

const SMALL_ONLY_SIZES: AsteroidSize[] = ['tiny', 'small'];

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
    generate(shipLevel: number, constraint?: MiningConstraint): Asteroid {
        const size = this.selectSize(shipLevel, constraint);
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
    private selectSize(shipLevel: number, constraint?: MiningConstraint): AsteroidSize {
        const config = SHIP_SPAWN_CONFIG[shipLevel] || SHIP_SPAWN_CONFIG[1];
        let sizesMap = config.sizes;
        if (constraint === MiningConstraint.SmallOnly) {
            const filtered = Object.fromEntries(
                Object.entries(sizesMap).filter(([k]) => (SMALL_ONLY_SIZES as string[]).includes(k))
            ) as typeof sizesMap;
            if (Object.keys(filtered).length > 0) {
                sizesMap = filtered;
            }
        }
        const weightedSizes = this.probabilityMapToWeightedItems<AsteroidSize>(sizesMap);
        return this.random.weightedRandomSelect(weightedSizes);
    }

    /**
     * Select asteroid type based on ship level spawn probabilities
     */
    private selectType(shipLevel: number): AsteroidType {
        const config = SHIP_SPAWN_CONFIG[shipLevel] || SHIP_SPAWN_CONFIG[1];
        const weightedTypes = this.probabilityMapToWeightedItems<AsteroidType>(config.types);
        return this.random.weightedRandomSelect(weightedTypes);
    }

    /**
     * Convert a probability map (key -> percentage) to weighted items
     */
    private probabilityMapToWeightedItems<T extends string>(
        probMap: { [key in T]?: number }
    ): WeightedItem<T>[] {
        const items: WeightedItem<T>[] = [];

        for (const key of Object.keys(probMap) as T[]) {
            const weight = probMap[key];
            if (weight !== undefined && weight > 0) {
                items.push({
                    value: key,
                    weight: weight
                });
            }
        }

        return items;
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
        return this.normalizeComposition(rawComposition);
    }

    /**
     * Normalize composition percentages to sum to 100
     */
    private normalizeComposition(composition: AsteroidComposition): AsteroidComposition {
        const total = Object.values(composition).reduce((sum, val) => sum + val, 0);

        if (total === 0) {
            return composition;
        }

        const normalized: AsteroidComposition = {};
        const elements = Object.keys(composition);
        let runningTotal = 0;

        // Normalize all but the last element
        for (let i = 0; i < elements.length - 1; i++) {
            const element = elements[i];
            const normalizedValue = Math.round((composition[element] / total) * 100);
            normalized[element] = normalizedValue;
            runningTotal += normalizedValue;
        }

        // Last element gets the remainder to ensure exact sum of 100
        const lastElement = elements[elements.length - 1];
        normalized[lastElement] = 100 - runningTotal;

        return normalized;
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

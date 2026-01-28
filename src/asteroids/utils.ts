import type { WeightedItem, AsteroidComposition } from './interfaces';

/**
 * Generate a random integer between min and max (inclusive)
 */
export function randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random float between min and max
 */
export function randomFloatInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

/**
 * Select a random item from a weighted list
 * @param items Array of items with weights
 * @returns The selected item's value
 */
export function weightedRandomSelect<T>(items: WeightedItem<T>[]): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of items) {
        random -= item.weight;
        if (random <= 0) {
            return item.value;
        }
    }

    // Fallback to last item (shouldn't reach here in normal operation)
    return items[items.length - 1].value;
}

/**
 * Convert a probability map (key -> percentage) to weighted items
 * @param probMap Object mapping keys to probability percentages
 * @returns Array of weighted items
 */
export function probabilityMapToWeightedItems<T extends string>(
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
 * Normalize composition percentages to sum to 100
 * @param composition Raw composition object
 * @returns Normalized composition with percentages summing to 100
 */
export function normalizeComposition(composition: AsteroidComposition): AsteroidComposition {
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

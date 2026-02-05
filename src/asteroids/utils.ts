import type { WeightedItem } from './interfaces';

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

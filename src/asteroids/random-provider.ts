import type { RandomProvider, WeightedItem } from './interfaces';

/**
 * Default random provider using Math.random()
 */
export class DefaultRandomProvider implements RandomProvider {
    /**
     * Generate a random integer between min and max (inclusive)
     */
    randomInRange(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Select a random item from a weighted list
     * @param items Array of items with weights
     * @returns The selected item's value
     */
    weightedRandomSelect<T>(items: WeightedItem<T>[]): T {
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
}

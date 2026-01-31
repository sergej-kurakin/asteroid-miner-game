import type { Asteroid } from '../asteroids/interfaces';
import type {
    IMiningSystem,
    MiningYield,
    SellResult,
    ElementPrices
} from './interfaces';

export class MiningSystem implements IMiningSystem {
    calculateYield(asteroid: Asteroid): MiningYield {
        const collected: { [element: string]: number } = {};
        let totalAmount = 0;

        for (const [element, percent] of Object.entries(asteroid.composition)) {
            const amount = Math.round((percent / 100) * asteroid.totalYield);
            if (amount > 0) {
                collected[element] = amount;
                totalAmount += amount;
            }
        }

        return { collected, totalAmount };
    }

    calculateSellValue(
        inventory: { [element: string]: number },
        prices: ElementPrices
    ): SellResult {
        const itemsSold: { [element: string]: number } = {};
        let totalValue = 0;

        for (const [element, amount] of Object.entries(inventory)) {
            if (amount > 0) {
                const price = prices[element] ?? 0;
                totalValue += amount * price;
                itemsSold[element] = amount;
            }
        }

        return { totalValue, itemsSold };
    }

    findNewDiscoveries(
        collected: { [element: string]: number },
        discovered: string[]
    ): string[] {
        const newDiscoveries: string[] = [];

        for (const element of Object.keys(collected)) {
            if (!discovered.includes(element)) {
                newDiscoveries.push(element);
            }
        }

        return newDiscoveries;
    }

    mergeIntoInventory(
        current: { [element: string]: number },
        collected: { [element: string]: number }
    ): { [element: string]: number } {
        const merged = { ...current };

        for (const [element, amount] of Object.entries(collected)) {
            merged[element] = (merged[element] || 0) + amount;
        }

        return merged;
    }

    calculateNewHoldUsed(
        currentUsed: number,
        totalCollected: number,
        capacity: number
    ): number {
        return Math.min(currentUsed + totalCollected, capacity);
    }
}

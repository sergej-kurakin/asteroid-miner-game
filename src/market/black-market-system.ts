import type { IMarketSystem } from './interfaces';

export class BlackMarketSystem implements IMarketSystem {
    private readonly prices: { [element: string]: number } = {
        Co: 400,
        Cr: 360,
        Mn: 240,
    };

    evaluate(inventory: { [element: string]: number }): number {
        let total = 0;

        for (const [element, amount] of Object.entries(inventory)) {
            const price = this.prices[element] ?? 0;
            total += amount * price;
        }

        return total;
    }
}

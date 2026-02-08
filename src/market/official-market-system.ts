import type { IMarketSystem } from './interfaces';

export class OfficialMarketSystem implements IMarketSystem {
    private readonly prices: { [element: string]: number } = {
        Fe: 50,
        O: 20,
        Si: 40,
        Ni: 150,
        Mg: 80,
        S: 60,
        Co: 200,
        Cr: 180,
        Mn: 120,
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

import type { ElementPrices, TradeTransaction } from './interfaces';

export class TradeMediator {
    constructor(private readonly prices: ElementPrices) {}

    evaluate(inventory: { [element: string]: number }): TradeTransaction | null {
        const itemsSold: { [element: string]: number } = {};
        let creditsDelta = 0;

        for (const [element, amount] of Object.entries(inventory)) {
            if (amount > 0) {
                const price = this.prices[element] ?? 0;
                creditsDelta += amount * price;
                itemsSold[element] = amount;
            }
        }

        if (creditsDelta === 0 && Object.keys(itemsSold).length === 0) {
            return null;
        }

        return { creditsDelta, itemsSold };
    }
}

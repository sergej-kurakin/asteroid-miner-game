import type { IMarketSystem, TradeTransaction } from './interfaces';

export class TradeMediator {
    constructor(private readonly marketSystem: IMarketSystem) {}

    evaluate(inventory: { [element: string]: number }): TradeTransaction | null {
        const itemsSold: { [element: string]: number } = {};

        for (const [element, amount] of Object.entries(inventory)) {
            if (amount > 0) {
                itemsSold[element] = amount;
            }
        }

        if (Object.keys(itemsSold).length === 0) {
            return null;
        }

        return { creditsDelta: this.marketSystem.evaluate(itemsSold), itemsSold };
    }
}

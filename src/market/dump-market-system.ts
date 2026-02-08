import type { IMarketSystem } from './interfaces';

const DUMP_PRICE_PER_UNIT = 1;

export class DumpMarketSystem implements IMarketSystem {
    evaluate(inventory: { [element: string]: number }): number {
        let total = 0;

        for (const [, amount] of Object.entries(inventory)) {
            if (amount > 0) {
                total += amount * DUMP_PRICE_PER_UNIT;
            }
        }

        return total;
    }
}

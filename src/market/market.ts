import type { Observable, GameState } from '../gamestate';
import type { ElementPrices, IMarket, SellAllResult } from './interfaces';
import { TradeMediator } from './mediator';
import { SellResourcesCommand } from './commands';

export class Market implements IMarket {
    private readonly mediator: TradeMediator;

    constructor(
        private readonly state$: Observable<GameState>,
        prices: ElementPrices,
        mediator?: TradeMediator
    ) {
        this.mediator = mediator ?? new TradeMediator(prices);
    }

    sellAll(): SellAllResult {
        const state = this.state$.getState();
        const transaction = this.mediator.evaluate(state.inventory);

        if (!transaction) {
            return { success: false, error: 'empty_hold' };
        }

        new SellResourcesCommand(this.state$, transaction).execute();

        return {
            success: true,
            totalValue: transaction.creditsDelta,
            itemsSold: transaction.itemsSold
        };
    }

    canSell(): boolean {
        const { inventory } = this.state$.getState();
        return Object.values(inventory).some(amount => amount > 0);
    }
}

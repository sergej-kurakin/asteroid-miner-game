import type { Observable, GameState } from '../gamestate';
import type { IMarket, SellAllResult, IMarketSystem } from './interfaces';
import { TradeMediator } from './mediator';
import { SellResourcesCommand } from './commands';

export class Market implements IMarket {
    private readonly strategies: Map<string, IMarketSystem>;

    constructor(
        private readonly state$: Observable<GameState>,
        strategies: Record<string, IMarketSystem> | Map<string, IMarketSystem>
    ) {
        this.strategies = strategies instanceof Map
            ? strategies
            : new Map(Object.entries(strategies));
    }

    sellAll(key: string): SellAllResult {
        const strategy = this.strategies.get(key);
        if (!strategy) {
            return { success: false, error: 'empty_hold' };
        }

        const state = this.state$.getState();
        const mediator = new TradeMediator(strategy);
        const transaction = mediator.evaluate(state.inventory);

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

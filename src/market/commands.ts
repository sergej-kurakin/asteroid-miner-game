import type { Observable, Command, GameState } from '../gamestate';
import type { SellAllResult } from './interfaces';
import { TradeMediator } from './mediator';

/**
 * Evaluates inventory with a market system and applies the transaction to state.
 * Returns the result of the sale operation.
 */
export class SellResourcesCommand implements Command<SellAllResult> {
    constructor(
        private readonly state$: Observable<GameState>,
        private readonly mediator: TradeMediator
    ) {}

    execute(): SellAllResult {
        const state = this.state$.getState();
        const transaction = this.mediator.evaluate(state.inventory);

        if (!transaction) {
            return { success: false, error: 'empty_hold' };
        }

        this.state$.setState({
            credits: state.credits + transaction.creditsDelta,
            inventory: {},
            hold_used: 0
        });

        return {
            success: true,
            totalValue: transaction.creditsDelta,
            itemsSold: transaction.itemsSold
        };
    }
}

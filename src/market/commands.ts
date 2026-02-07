import type { Observable, Command, GameState } from '../gamestate';
import type { TradeTransaction } from './interfaces';

/**
 * Adds trade value to credits and clears inventory.
 *
 * @precondition transaction.creditsDelta > 0 || Object.keys(transaction.itemsSold).length > 0
 */
export class SellResourcesCommand implements Command<void> {
    constructor(
        private readonly state$: Observable<GameState>,
        private readonly transaction: TradeTransaction
    ) {}

    execute(): void {
        const state = this.state$.getState();

        this.state$.setState({
            credits: state.credits + this.transaction.creditsDelta,
            inventory: {},
            hold_used: 0
        });
    }
}

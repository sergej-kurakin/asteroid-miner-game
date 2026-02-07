import type { Observable, Command } from '../gamestate';
import type { GameState } from '../gamestate/interfaces';
import { POWER_COST, POWER_GAIN } from './constants';

/**
 * Adds POWER_GAIN to power (capped at capacity) and deducts POWER_COST from credits.
 *
 * @precondition state.credits >= POWER_COST
 * @precondition state.power < state.power_capacity
 */
export class BuyPowerCommand implements Command<number> {
    constructor(private readonly state$: Observable<GameState>) {}

    execute(): number {
        const state = this.state$.getState();
        const newPower = Math.min(state.power + POWER_GAIN, state.power_capacity);

        this.state$.setState({
            power: newPower,
            credits: state.credits - POWER_COST
        });

        return newPower;
    }
}

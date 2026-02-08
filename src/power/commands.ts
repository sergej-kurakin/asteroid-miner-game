import type { Observable, Command, GameState } from '../gamestate';
import { POWER_GAIN } from './constants';

/**
 * Adds POWER_GAIN to power (capped at capacity) and deducts cost from credits.
 *
 * @precondition state.credits >= cost
 * @precondition state.power < state.power_capacity
 */
export class BuyPowerCommand implements Command<number> {
    constructor(
        private readonly state$: Observable<GameState>,
        private readonly cost: number,
    ) {}

    execute(): number {
        const state = this.state$.getState();
        const newPower = Math.min(state.power + POWER_GAIN, state.power_capacity);

        this.state$.setState({
            power: newPower,
            credits: state.credits - this.cost
        });

        return newPower;
    }
}

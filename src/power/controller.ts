import type { Observable } from '../gamestate';
import type { GameState } from '../gamestate/interfaces';
import { POWER_COST, POWER_GAIN } from './constants';
import type { IPowerController, BuyPowerResult } from './interfaces';

export class PowerController implements IPowerController {
    constructor(
        private readonly state$: Observable<GameState>,
    ) {}

    buyPower(): BuyPowerResult {
        const state = this.state$.getState();

        // Validation checks
        if (state.credits < POWER_COST) {
            return { success: false, error: 'insufficient_credits' };
        }

        if (state.power >= state.power_capacity) {
            return { success: false, error: 'power_full' };
        }

        // Calculate new power (cap at max)
        const newPower = Math.min(state.power + POWER_GAIN, state.power_capacity);

        // Execute transaction
        this.state$.setState({
            power: newPower,
            credits: state.credits - POWER_COST
        });

        return { success: true, newPower };
    }

    canBuyPower(): boolean {
        const state = this.state$.getState();
        return state.credits >= POWER_COST && state.power < state.power_capacity;
    }

    getCurrentPower(): number {
        return this.state$.getState().power;
    }

    getMaxPower(): number {
        return this.state$.getState().power_capacity;
    }
}

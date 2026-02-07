import type { Observable } from '../gamestate';
import type { GameState } from '../gamestate/interfaces';
import { POWER_COST } from './constants';
import type { IPowerController, BuyPowerResult } from './interfaces';
import { BuyPowerCommand } from './commands';

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

        const newPower = new BuyPowerCommand(this.state$).execute();
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

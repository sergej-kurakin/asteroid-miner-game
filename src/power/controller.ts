import type { Observable } from '../gamestate';
import type { GameState } from '../gamestate/interfaces';
import type { IWorldService } from '../world/interfaces';
import { POWER_BASE_COST, POWER_DISTANCE_RATE } from './constants';
import type { IPowerController, BuyPowerResult } from './interfaces';
import { BuyPowerCommand } from './commands';

export class PowerController implements IPowerController {
    constructor(
        private readonly state$: Observable<GameState>,
        private readonly worldService: IWorldService,
    ) {}

    getPowerCost(): number {
        const distance = this.worldService.nearestPowerStationDistance(this.state$.getState().current_cell);
        const distanceCost = distance === Infinity ? 0 : distance * POWER_DISTANCE_RATE;
        return POWER_BASE_COST + distanceCost;
    }

    buyPower(): BuyPowerResult {
        const state = this.state$.getState();
        const cost = this.getPowerCost();

        if (state.credits < cost) {
            return { success: false, error: 'insufficient_credits' };
        }

        if (state.power >= state.power_capacity) {
            return { success: false, error: 'power_full' };
        }

        const newPower = new BuyPowerCommand(this.state$, cost).execute();
        return { success: true, newPower };
    }

    canBuyPower(): boolean {
        const state = this.state$.getState();
        return state.credits >= this.getPowerCost() && state.power < state.power_capacity;
    }

    getCurrentPower(): number {
        return this.state$.getState().power;
    }

    getMaxPower(): number {
        return this.state$.getState().power_capacity;
    }
}

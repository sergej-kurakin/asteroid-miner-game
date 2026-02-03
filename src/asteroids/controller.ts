import type { Observable } from '../gamestate';
import type { GameState } from '../gamestate/interfaces';
import type { Asteroid, IAsteroidsController, ScanResult, AbandonResult } from './interfaces';
import { SCAN_POWER_COST } from './constants';
import { generateAsteroid } from './generator';

export class AsteroidsController implements IAsteroidsController {
    constructor(private readonly state$: Observable<GameState>) {}

    scan(): ScanResult {
        const state = this.state$.getState();

        if (state.is_mining) {
            return { success: false, error: 'is_mining' };
        }
        if (state.asteroid !== null) {
            return { success: false, error: 'asteroid_exists' };
        }
        if (state.power < SCAN_POWER_COST) {
            return { success: false, error: 'insufficient_power' };
        }

        const asteroid = generateAsteroid(state.current_ship_level);
        this.state$.setState({
            power: state.power - SCAN_POWER_COST,
            asteroid
        });

        return { success: true, asteroid };
    }

    abandon(): AbandonResult {
        const state = this.state$.getState();

        if (state.is_mining) {
            return { success: false, error: 'is_mining' };
        }
        if (state.asteroid === null) {
            return { success: false, error: 'no_asteroid' };
        }

        this.state$.updateProperty('asteroid', null);
        return { success: true };
    }

    canScan(): boolean {
        const state = this.state$.getState();
        return !state.is_mining &&
               state.asteroid === null &&
               state.power >= SCAN_POWER_COST;
    }

    canAbandon(): boolean {
        const state = this.state$.getState();
        return !state.is_mining && state.asteroid !== null;
    }

    getCurrentAsteroid(): Asteroid | null {
        return this.state$.getState().asteroid;
    }
}

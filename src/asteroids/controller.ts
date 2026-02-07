import type { Observable } from '../gamestate';
import type { GameState } from '../gamestate/interfaces';
import type { Asteroid, IAsteroidsController, IAsteroidGenerator, ScanResult, AbandonResult } from './interfaces';
import { SCAN_POWER_COST } from './constants';
import { ScanCommand, AbandonCommand } from './commands';
import { AsteroidGenerator } from './generator';

export class AsteroidsController implements IAsteroidsController {
    private readonly generator: IAsteroidGenerator;

    constructor(
        private readonly state$: Observable<GameState>,
        generator?: IAsteroidGenerator
    ) {
        this.generator = generator ?? new AsteroidGenerator();
    }

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

        const command = new ScanCommand(this.state$, this.generator);
        const asteroid = command.execute();
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

        new AbandonCommand(this.state$).execute();
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

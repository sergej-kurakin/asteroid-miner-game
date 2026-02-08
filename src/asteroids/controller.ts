import type { Observable } from '../gamestate';
import type { GameState } from '../gamestate/interfaces';
import type { Asteroid, IAsteroidsController, IAsteroidGenerator, ScanResult, AbandonResult } from './interfaces';
import type { World } from '../world/interfaces';
import { CellType, MiningConstraint } from '../world/interfaces';
import { getCellAt, getMiningConstraint } from '../world/utils';
import { SCAN_POWER_COST } from './constants';
import { ScanCommand, AbandonCommand } from './commands';
import { AsteroidGenerator } from './generator';

export class AsteroidsController implements IAsteroidsController {
    private readonly generator: IAsteroidGenerator;

    constructor(
        private readonly state$: Observable<GameState>,
        generator?: IAsteroidGenerator,
        private readonly world?: World
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

        if (this.world) {
            const cell = getCellAt(this.world, state.current_cell);
            if (!cell || cell.type !== CellType.Mining) {
                return { success: false, error: 'no_mining_zone' };
            }
            const constraint = getMiningConstraint(this.world, state.current_cell);
            if (constraint === MiningConstraint.None) {
                return { success: false, error: 'no_mining_zone' };
            }
            const command = new ScanCommand(this.state$, this.generator, constraint);
            const asteroid = command.execute();
            return { success: true, asteroid };
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
        if (state.is_mining || state.asteroid !== null || state.power < SCAN_POWER_COST) {
            return false;
        }
        if (this.world) {
            const cell = getCellAt(this.world, state.current_cell);
            if (!cell || cell.type !== CellType.Mining) return false;
            if (getMiningConstraint(this.world, state.current_cell) === MiningConstraint.None) return false;
        }
        return true;
    }

    canAbandon(): boolean {
        const state = this.state$.getState();
        return !state.is_mining && state.asteroid !== null;
    }

    getCurrentAsteroid(): Asteroid | null {
        return this.state$.getState().asteroid;
    }
}

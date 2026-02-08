import type { Observable, Command } from '../gamestate';
import type { GameState } from '../gamestate/interfaces';
import type { Asteroid, IAsteroidGenerator } from './interfaces';
import { SCAN_POWER_COST } from './constants';

export class ScanCommand implements Command<Asteroid> {
    constructor(
        private readonly state$: Observable<GameState>,
        private readonly generator: IAsteroidGenerator
    ) {}

    execute(): Asteroid {
        const state = this.state$.getState();
        const asteroid = this.generator.generate(state.current_ship_level);
        this.state$.setState({
            power: state.power - SCAN_POWER_COST,
            asteroid
        });
        return asteroid;
    }
}

export class AbandonCommand implements Command<void> {
    constructor(private readonly state$: Observable<GameState>) {}

    execute(): void {
        this.state$.updateProperty('asteroid', null);
    }
}

import type { Observable, Command, GameState } from '../gamestate';
import type { ShipData } from './interfaces';
import type { CellPosition } from '../world/interfaces';

/**
 * Upgrades the ship to the next tier, adjusting hold/power proportionally.
 *
 * @precondition state.credits >= nextShip.cost
 * @precondition nextShip is the valid next tier (current_ship_level < MAX_SHIP_LEVEL)
 * @precondition !state.is_mining
 */
export class UpgradeShipCommand implements Command<ShipData> {
    constructor(
        private readonly state$: Observable<GameState>,
        private readonly nextShip: ShipData
    ) {}

    execute(): ShipData {
        const state = this.state$.getState();

        // Guard against division by zero when hold_capacity is 0
        const currentPercent = state.hold_capacity > 0
            ? state.hold_used / state.hold_capacity
            : 0;
        const newHoldUsed = Math.min(
            Math.floor(currentPercent * this.nextShip.holdCapacity),
            this.nextShip.holdCapacity
        );

        const newPower = Math.min(state.power, this.nextShip.powerCell);

        this.state$.setState({
            credits: state.credits - this.nextShip.cost,
            current_ship_level: this.nextShip.id,
            hold_capacity: this.nextShip.holdCapacity,
            hold_used: newHoldUsed,
            power: newPower,
            power_capacity: this.nextShip.powerCell,
        });

        return this.nextShip;
    }
}

/**
 * Moves the ship to an adjacent cell, deducting power and clearing asteroid state.
 *
 * @precondition !state.is_mining
 * @precondition destination is adjacent (Manhattan distance = 1) and in bounds
 * @precondition state.power >= moveCost
 */
export class TravelCommand implements Command<void> {
    constructor(
        private readonly state$: Observable<GameState>,
        private readonly destination: CellPosition,
        private readonly moveCost: number
    ) {}

    execute(): void {
        const state = this.state$.getState();
        this.state$.setState({
            current_cell: this.destination,
            power: state.power - this.moveCost,
            asteroid: null,
            is_mining: false,
            mining_progress: 0,
        });
    }
}

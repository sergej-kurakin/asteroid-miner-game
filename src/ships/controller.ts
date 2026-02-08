import type { Observable, GameState } from '../gamestate';
import type { ShipData, IShipController, UpgradeResult, TravelResult } from './interfaces';
import { SHIPS, MAX_SHIP_LEVEL, BASE_MOVE_COST, CARGO_COST_STEP, CARGO_COST_PENALTY } from './constants';
import { UpgradeShipCommand, TravelCommand } from './commands';
import type { CellPosition } from '../world/interfaces';
import { isInBounds } from '../world';

export class ShipController implements IShipController {
    constructor(private readonly state$: Observable<GameState>) {}

    getCurrentShip(): ShipData {
        const ship = SHIPS[this.state$.getState().current_ship_level - 1];
        if (!ship) throw new Error(`Invalid ship level: ${this.state$.getState().current_ship_level}`);
        return ship;
    }

    getNextShip(): ShipData | undefined {

        if (this.state$.getState().current_ship_level >= MAX_SHIP_LEVEL) return undefined;

        return SHIPS[this.state$.getState().current_ship_level];
    }

    canAffordUpgrade(): boolean {
        const nextShip = this.getNextShip();
        if (!nextShip) return false;
        return this.state$.getState().credits >= nextShip.cost;
    }

    isMaxLevel(): boolean {
        return this.state$.getState().current_ship_level >= MAX_SHIP_LEVEL;
    }

    getLevel(): number {
        return this.state$.getState().current_ship_level;
    }

    getMiningTime(): number {
        return this.getCurrentShip().miningTime;
    }

    getToolSlots(): number {
        return this.getCurrentShip().toolSlots;
    }

    calculateMoveCost(): number {
        const state = this.state$.getState();
        const steps = Math.floor(state.hold_used / CARGO_COST_STEP);
        return Math.ceil(BASE_MOVE_COST * (1 + steps * CARGO_COST_PENALTY));
    }

    travel(destination: CellPosition): TravelResult {
        const state = this.state$.getState();
        if (state.is_mining) return { success: false, error: 'is_mining' };

        const dx = Math.abs(destination.x - state.current_cell.x);
        const dy = Math.abs(destination.y - state.current_cell.y);
        const dz = Math.abs(destination.z - state.current_cell.z);
        if (dx + dy + dz !== 1 || !isInBounds(destination)) {
            return { success: false, error: 'invalid_destination' };
        }

        const cost = this.calculateMoveCost();
        if (state.power < cost) return { success: false, error: 'insufficient_power' };

        new TravelCommand(this.state$, destination, cost).execute();
        return { success: true, newCell: destination };
    }

    upgrade(): UpgradeResult {
        const state = this.state$.getState();
        const nextShip = this.getNextShip();

        if (!nextShip) {
            return { success: false, error: 'max_level_reached' };
        }

        if (state.credits < nextShip.cost) {
            return { success: false, error: 'insufficient_credits' };
        }

        if (state.is_mining) {
            return { success: false, error: 'is_mining' };
        }

        const newShip = new UpgradeShipCommand(this.state$, nextShip).execute();
        return { success: true, newShip };
    }
}

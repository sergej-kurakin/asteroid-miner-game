import type { Observable } from '../gamestate';
import type { GameState } from '../gamestate/interfaces';
import type { ShipData, IShipController, UpgradeResult } from './interfaces';
import { SHIPS, MAX_SHIP_LEVEL } from './constants';

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

    upgrade(): UpgradeResult {
        const state = this.state$.getState();
        const nextShip = this.getNextShip();

        if (!nextShip) {
            return { success: false, error: 'max_level_reached' };
        }

        if (state.credits < nextShip.cost) {
            return { success: false, error: 'insufficient_credits' };
        }

        // Calculate new hold_used proportionally
        const currentPercent = state.hold_used / state.hold_capacity;
        const newHoldUsed = Math.min(
            Math.floor(currentPercent * nextShip.holdCapacity),
            nextShip.holdCapacity
        );

        // Cap power to new ship's powerCell
        const newPower = Math.min(state.power, nextShip.powerCell);

        this.state$.setState({
            credits: state.credits - nextShip.cost,
            current_ship_level: nextShip.id,
            hold_capacity: nextShip.holdCapacity,
            hold_used: newHoldUsed,
            power: newPower,
            power_capacity: nextShip.powerCell,
        });

        return { success: true, newShip: nextShip };
    }
}

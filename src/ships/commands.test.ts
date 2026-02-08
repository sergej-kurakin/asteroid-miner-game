import { describe, it, expect } from 'vitest';
import { UpgradeShipCommand } from './commands';
import { StateObserver } from '../gamestate';
import type { GameState } from '../gamestate/interfaces';
import type { ShipData } from './interfaces';

const createTestState = (overrides?: Partial<GameState>): GameState => ({
    credits: 10000,
    current_ship_level: 1,
    discovered_elements: [],
    inventory: {},
    hold_capacity: 100,
    hold_used: 0,
    asteroid: null,
    is_mining: false,
    mining_progress: 0,
    power: 100,
    power_capacity: 100,
    equipped_tools: [],
    tools_owned: [],
    current_cell: { x: 0, y: 0, z: 0 },
    ...overrides
});

const createNextShip = (overrides?: Partial<ShipData>): ShipData => ({
    id: 2,
    name: 'Prospector Class',
    holdCapacity: 150,
    powerCell: 120,
    miningTime: 2500,
    toolSlots: 2,
    cost: 2000,
    special: 'Improved mining efficiency',
    ...overrides
});

describe('UpgradeShipCommand', () => {
    it('deducts ship cost from credits', () => {
        const nextShip = createNextShip({ cost: 2000 });
        const state$ = new StateObserver(createTestState({ credits: 5000 }));
        new UpgradeShipCommand(state$, nextShip).execute();

        expect(state$.getState().credits).toBe(3000);
    });

    it('sets current_ship_level to nextShip.id', () => {
        const nextShip = createNextShip({ id: 3 });
        const state$ = new StateObserver(createTestState());
        new UpgradeShipCommand(state$, nextShip).execute();

        expect(state$.getState().current_ship_level).toBe(3);
    });

    it('sets hold_capacity and power_capacity from nextShip', () => {
        const nextShip = createNextShip({ holdCapacity: 250, powerCell: 150 });
        const state$ = new StateObserver(createTestState());
        new UpgradeShipCommand(state$, nextShip).execute();

        expect(state$.getState().hold_capacity).toBe(250);
        expect(state$.getState().power_capacity).toBe(150);
    });

    it('calculates proportional hold_used', () => {
        const nextShip = createNextShip({ holdCapacity: 200 });
        // 50 out of 100 = 50%, so new hold_used = floor(0.5 * 200) = 100
        const state$ = new StateObserver(createTestState({ hold_capacity: 100, hold_used: 50 }));
        new UpgradeShipCommand(state$, nextShip).execute();

        expect(state$.getState().hold_used).toBe(100);
    });

    it('floors the proportional hold_used', () => {
        const nextShip = createNextShip({ holdCapacity: 150 });
        // 33 out of 100 = 33%, so new hold_used = floor(0.33 * 150) = 49
        const state$ = new StateObserver(createTestState({ hold_capacity: 100, hold_used: 33 }));
        new UpgradeShipCommand(state$, nextShip).execute();

        expect(state$.getState().hold_used).toBe(49);
    });

    it('caps power at new ship powerCell', () => {
        const nextShip = createNextShip({ powerCell: 80 });
        const state$ = new StateObserver(createTestState({ power: 100 }));
        new UpgradeShipCommand(state$, nextShip).execute();

        expect(state$.getState().power).toBe(80);
    });

    it('keeps power unchanged when below new powerCell', () => {
        const nextShip = createNextShip({ powerCell: 120 });
        const state$ = new StateObserver(createTestState({ power: 50 }));
        new UpgradeShipCommand(state$, nextShip).execute();

        expect(state$.getState().power).toBe(50);
    });

    it('returns the nextShip', () => {
        const nextShip = createNextShip();
        const state$ = new StateObserver(createTestState());
        const result = new UpgradeShipCommand(state$, nextShip).execute();

        expect(result).toBe(nextShip);
    });

    it('reads state at execute time, not construction time', () => {
        const nextShip = createNextShip({ cost: 2000 });
        const state$ = new StateObserver(createTestState({ credits: 5000 }));
        const command = new UpgradeShipCommand(state$, nextShip);

        state$.setState({ credits: 8000 });
        command.execute();

        expect(state$.getState().credits).toBe(6000);
    });

    it('does not modify unrelated state properties', () => {
        const nextShip = createNextShip();
        const state$ = new StateObserver(createTestState({
            is_mining: false,
            asteroid: null,
            discovered_elements: ['Fe', 'Si'],
            tools_owned: ['laser_drill'],
            current_cell: { x: 0, y: 0, z: 0 },
        }));
        new UpgradeShipCommand(state$, nextShip).execute();

        const state = state$.getState();
        expect(state.is_mining).toBe(false);
        expect(state.asteroid).toBeNull();
        expect(state.discovered_elements).toEqual(['Fe', 'Si']);
        expect(state.tools_owned).toEqual(['laser_drill']);
    });

    it('returns hold_used=0 when hold_capacity is 0 (no division by zero)', () => {
        const nextShip = createNextShip({ holdCapacity: 200 });
        const state$ = new StateObserver(createTestState({ hold_capacity: 0, hold_used: 0 }));
        new UpgradeShipCommand(state$, nextShip).execute();

        expect(state$.getState().hold_used).toBe(0);
        expect(Number.isNaN(state$.getState().hold_used)).toBe(false);
    });
});

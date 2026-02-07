import { describe, it, expect } from 'vitest';
import { BuyPowerCommand } from './commands';
import { StateObserver } from '../gamestate';
import type { GameState } from '../gamestate/interfaces';
import { POWER_COST, POWER_GAIN } from './constants';

const createTestState = (overrides?: Partial<GameState>): GameState => ({
    credits: 1000,
    current_ship_level: 1,
    discovered_elements: [],
    inventory: {},
    hold_capacity: 100,
    hold_used: 0,
    asteroid: null,
    is_mining: false,
    mining_progress: 0,
    power: 50,
    power_capacity: 100,
    equipped_tools: [],
    tools_owned: [],
    ...overrides
});

describe('BuyPowerCommand', () => {
    it('deducts POWER_COST from credits', () => {
        const state$ = new StateObserver(createTestState({ credits: 500 }));
        new BuyPowerCommand(state$).execute();

        expect(state$.getState().credits).toBe(500 - POWER_COST);
    });

    it('increases power by POWER_GAIN', () => {
        const state$ = new StateObserver(createTestState({ power: 20, power_capacity: 100 }));
        new BuyPowerCommand(state$).execute();

        expect(state$.getState().power).toBe(20 + POWER_GAIN);
    });

    it('caps power at power_capacity', () => {
        const state$ = new StateObserver(createTestState({ power: 90, power_capacity: 100 }));
        new BuyPowerCommand(state$).execute();

        expect(state$.getState().power).toBe(100);
    });

    it('returns the new power value', () => {
        const state$ = new StateObserver(createTestState({ power: 30, power_capacity: 100 }));
        const result = new BuyPowerCommand(state$).execute();

        expect(result).toBe(30 + POWER_GAIN);
    });

    it('returns capped power when near capacity', () => {
        const state$ = new StateObserver(createTestState({ power: 80, power_capacity: 100 }));
        const result = new BuyPowerCommand(state$).execute();

        expect(result).toBe(100);
    });

    it('reads state at execute time, not construction time', () => {
        const state$ = new StateObserver(createTestState({ credits: 500, power: 20, power_capacity: 100 }));
        const command = new BuyPowerCommand(state$);

        state$.setState({ credits: 300, power: 40 });
        command.execute();

        expect(state$.getState().credits).toBe(300 - POWER_COST);
        expect(state$.getState().power).toBe(40 + POWER_GAIN);
    });

    it('deducts POWER_COST even when credits are insufficient (caller must validate)', () => {
        const state$ = new StateObserver(createTestState({ credits: 30 }));
        new BuyPowerCommand(state$).execute();

        expect(state$.getState().credits).toBe(30 - POWER_COST);
    });

    it('does not modify unrelated state properties', () => {
        const state$ = new StateObserver(createTestState({
            credits: 500,
            power: 30,
            power_capacity: 100,
            hold_used: 50,
            is_mining: false,
            current_ship_level: 3
        }));
        new BuyPowerCommand(state$).execute();

        const state = state$.getState();
        expect(state.hold_used).toBe(50);
        expect(state.is_mining).toBe(false);
        expect(state.current_ship_level).toBe(3);
    });
});

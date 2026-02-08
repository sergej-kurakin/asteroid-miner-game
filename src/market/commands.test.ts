import { describe, it, expect } from 'vitest';
import { SellResourcesCommand } from './commands';
import { TradeMediator } from './mediator';
import { StateObserver } from '../gamestate';
import type { GameState } from '../gamestate/interfaces';
import type { IMarketSystem } from './interfaces';

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
    power: 100,
    power_capacity: 100,
    equipped_tools: [],
    tools_owned: [],
    ...overrides
});

const makeSystem = (priceMap: { [key: string]: number }): IMarketSystem => ({
    evaluate: (inv) => Object.entries(inv).reduce(
        (sum, [el, amt]) => sum + amt * (priceMap[el] ?? 0), 0
    )
});

describe('SellResourcesCommand', () => {
    const priceMap = { Fe: 50, Ni: 150 };
    const marketSystem = makeSystem(priceMap);

    it('adds creditsDelta to credits', () => {
        const state$ = new StateObserver(createTestState({
            credits: 1000,
            inventory: { Fe: 10 },
            hold_used: 10
        }));
        const mediator = new TradeMediator(marketSystem);

        const result = new SellResourcesCommand(state$, mediator).execute();

        expect(result.success).toBe(true);
        expect(state$.getState().credits).toBe(1000 + 10 * 50);
    });

    it('clears inventory', () => {
        const state$ = new StateObserver(createTestState({
            inventory: { Fe: 10, Ni: 5 },
            hold_used: 15
        }));
        const mediator = new TradeMediator(marketSystem);

        new SellResourcesCommand(state$, mediator).execute();

        expect(state$.getState().inventory).toEqual({});
    });

    it('resets hold_used to 0', () => {
        const state$ = new StateObserver(createTestState({
            hold_used: 50,
            inventory: { Fe: 1 }
        }));
        const mediator = new TradeMediator(marketSystem);

        new SellResourcesCommand(state$, mediator).execute();

        expect(state$.getState().hold_used).toBe(0);
    });

    it('reads state at execute time, not construction time', () => {
        const state$ = new StateObserver(createTestState({
            credits: 1000,
            inventory: { Fe: 10 }
        }));
        const mediator = new TradeMediator(marketSystem);
        const command = new SellResourcesCommand(state$, mediator);

        state$.setState({ ...state$.getState(), credits: 3000 });
        command.execute();

        expect(state$.getState().credits).toBe(3000 + 10 * 50);
    });

    it('does not modify unrelated state properties', () => {
        const state$ = new StateObserver(createTestState({
            inventory: { Fe: 10 },
            hold_used: 10,
            power: 42,
            is_mining: false,
            discovered_elements: ['Fe']
        }));
        const mediator = new TradeMediator(marketSystem);

        new SellResourcesCommand(state$, mediator).execute();

        const state = state$.getState();
        expect(state.power).toBe(42);
        expect(state.is_mining).toBe(false);
        expect(state.discovered_elements).toEqual(['Fe']);
    });

    it('returns failure for empty inventory', () => {
        const state$ = new StateObserver(createTestState({
            inventory: {}
        }));
        const mediator = new TradeMediator(marketSystem);

        const result = new SellResourcesCommand(state$, mediator).execute();

        expect(result.success).toBe(false);
        expect(result.error).toBe('empty_hold');
    });
});

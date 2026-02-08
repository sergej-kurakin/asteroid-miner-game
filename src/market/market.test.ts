import { describe, it, expect } from 'vitest';
import { Market } from './market';
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

describe('Market', () => {
    const marketSystem = makeSystem({ Fe: 50, Ni: 150, Co: 200 });

    describe('sellAll', () => {
        it('should sell inventory and return success result', () => {
            const state$ = new StateObserver(createTestState({
                inventory: { Fe: 10, Ni: 5 },
                hold_used: 15
            }));
            const market = new Market(state$, { official: marketSystem });

            const result = market.sellAll('official');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.totalValue).toBe(10 * 50 + 5 * 150); // 1250
                expect(result.itemsSold).toEqual({ Fe: 10, Ni: 5 });
            }
            expect(state$.getState().credits).toBe(1000 + 1250);
            expect(state$.getState().inventory).toEqual({});
            expect(state$.getState().hold_used).toBe(0);
        });

        it('should return failure for empty inventory', () => {
            const state$ = new StateObserver(createTestState());
            const market = new Market(state$, { official: marketSystem });

            const result = market.sellAll('official');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('empty_hold');
            }
            expect(state$.getState().credits).toBe(1000);
        });

        it('should handle inventory with only zero amounts', () => {
            const state$ = new StateObserver(createTestState({
                inventory: { Fe: 0, Ni: 0 }
            }));
            const market = new Market(state$, { official: marketSystem });

            const result = market.sellAll('official');

            expect(result.success).toBe(false);
        });

        it('should return failure for unknown market key', () => {
            const state$ = new StateObserver(createTestState({
                inventory: { Fe: 10 }
            }));
            const market = new Market(state$, { official: marketSystem });

            const result = market.sellAll('unknown');

            expect(result.success).toBe(false);
        });

        it('should support multiple strategies', () => {
            const state$ = new StateObserver(createTestState({
                inventory: { Fe: 10 }
            }));
            const officialSystem = makeSystem({ Fe: 50 });
            const blackMarketSystem = makeSystem({ Fe: 75 });
            const market = new Market(state$, {
                official: officialSystem,
                black: blackMarketSystem
            });

            const officialResult = market.sellAll('official');
            expect(officialResult.success && officialResult.totalValue).toBe(500);

            // Reset inventory
            state$.setState({ ...state$.getState(), inventory: { Fe: 10 }, credits: 1000 });

            const blackResult = market.sellAll('black');
            expect(blackResult.success && blackResult.totalValue).toBe(750);
        });
    });

    describe('canSell', () => {
        it('should return true when inventory has items', () => {
            const state$ = new StateObserver(createTestState({
                inventory: { Fe: 10 }
            }));
            const market = new Market(state$, { official: marketSystem });

            expect(market.canSell()).toBe(true);
        });

        it('should return false for empty inventory', () => {
            const state$ = new StateObserver(createTestState());
            const market = new Market(state$, { official: marketSystem });

            expect(market.canSell()).toBe(false);
        });

        it('should return false when all amounts are zero', () => {
            const state$ = new StateObserver(createTestState({
                inventory: { Fe: 0, Ni: 0 }
            }));
            const market = new Market(state$, { official: marketSystem });

            expect(market.canSell()).toBe(false);
        });
    });
});

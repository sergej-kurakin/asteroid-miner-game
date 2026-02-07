import { describe, it, expect, vi } from 'vitest';
import { StartMiningCommand, CancelMiningCommand, CompleteMiningCommand, SellResourcesCommand } from './commands';
import { StateObserver } from '../gamestate';
import type { GameState } from '../gamestate/interfaces';
import type { Asteroid } from '../asteroids/interfaces';
import type { IMiningSystem } from './interfaces';

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

const createTestAsteroid = (overrides?: Partial<Asteroid>): Asteroid => ({
    type: 'iron_nickel',
    size: 'medium',
    composition: { Fe: 60, Ni: 30, Co: 10 },
    totalYield: 100,
    miningTime: 100,
    visualDiameter: 80,
    ...overrides
});

const createMockSystem = (overrides?: Partial<IMiningSystem>): IMiningSystem => ({
    calculateYield: vi.fn().mockReturnValue({ collected: { Fe: 60, Ni: 30, Co: 10 }, totalAmount: 100 }),
    capYieldToAvailableSpace: vi.fn().mockImplementation((y) => y),
    findNewDiscoveries: vi.fn().mockReturnValue([]),
    mergeIntoInventory: vi.fn().mockImplementation((_cur, col) => col),
    calculateNewHoldUsed: vi.fn().mockReturnValue(100),
    calculateSellValue: vi.fn(),
    ...overrides
});

const DEFAULT_BONUSES = { yieldMultiplier: 1.0, rareMultiplier: 1.0, powerCostMultiplier: 1.0 };

describe('StartMiningCommand', () => {
    it('sets is_mining to true', () => {
        const state$ = new StateObserver(createTestState({ asteroid: createTestAsteroid() }));
        new StartMiningCommand(state$, 10).execute();

        expect(state$.getState().is_mining).toBe(true);
    });

    it('sets mining_progress to 0', () => {
        const state$ = new StateObserver(createTestState({ asteroid: createTestAsteroid(), mining_progress: 0.5 }));
        new StartMiningCommand(state$, 10).execute();

        expect(state$.getState().mining_progress).toBe(0);
    });

    it('deducts effectivePowerCost from power', () => {
        const state$ = new StateObserver(createTestState({ power: 50 }));
        new StartMiningCommand(state$, 15).execute();

        expect(state$.getState().power).toBe(35);
    });

    it('reads state at execute time, not construction time', () => {
        const state$ = new StateObserver(createTestState({ power: 50 }));
        const command = new StartMiningCommand(state$, 10);

        state$.setState({ power: 80 });
        command.execute();

        expect(state$.getState().power).toBe(70);
    });

    it('does not modify unrelated state properties', () => {
        const state$ = new StateObserver(createTestState({
            credits: 5000,
            asteroid: createTestAsteroid(),
            discovered_elements: ['Fe'],
            inventory: { Fe: 10 }
        }));
        new StartMiningCommand(state$, 10).execute();

        const state = state$.getState();
        expect(state.credits).toBe(5000);
        expect(state.discovered_elements).toEqual(['Fe']);
        expect(state.inventory).toEqual({ Fe: 10 });
    });
});

describe('CancelMiningCommand', () => {
    it('sets is_mining to false', () => {
        const state$ = new StateObserver(createTestState({ is_mining: true }));
        new CancelMiningCommand(state$).execute();

        expect(state$.getState().is_mining).toBe(false);
    });

    it('sets mining_progress to 0', () => {
        const state$ = new StateObserver(createTestState({ is_mining: true, mining_progress: 0.75 }));
        new CancelMiningCommand(state$).execute();

        expect(state$.getState().mining_progress).toBe(0);
    });

    it('reads state at execute time, not construction time', () => {
        const state$ = new StateObserver(createTestState({ is_mining: false }));
        const command = new CancelMiningCommand(state$);

        state$.setState({ is_mining: true, mining_progress: 0.5 });
        command.execute();

        expect(state$.getState().is_mining).toBe(false);
        expect(state$.getState().mining_progress).toBe(0);
    });

    it('does not modify unrelated state properties', () => {
        const state$ = new StateObserver(createTestState({
            is_mining: true,
            credits: 5000,
            power: 42,
            asteroid: createTestAsteroid()
        }));
        new CancelMiningCommand(state$).execute();

        const state = state$.getState();
        expect(state.credits).toBe(5000);
        expect(state.power).toBe(42);
        expect(state.asteroid).not.toBeNull();
    });
});

describe('CompleteMiningCommand', () => {
    it('returns cappedYield and newDiscoveries', () => {
        const system = createMockSystem({
            findNewDiscoveries: vi.fn().mockReturnValue(['Ni', 'Co'])
        });
        const state$ = new StateObserver(createTestState({
            is_mining: true,
            asteroid: createTestAsteroid()
        }));

        const result = new CompleteMiningCommand(state$, system, DEFAULT_BONUSES).execute();

        expect(result.cappedYield).toEqual({ collected: { Fe: 60, Ni: 30, Co: 10 }, totalAmount: 100 });
        expect(result.newDiscoveries).toEqual(['Ni', 'Co']);
    });

    it('sets is_mining to false and clears asteroid', () => {
        const system = createMockSystem();
        const state$ = new StateObserver(createTestState({
            is_mining: true,
            asteroid: createTestAsteroid()
        }));

        new CompleteMiningCommand(state$, system, DEFAULT_BONUSES).execute();

        expect(state$.getState().is_mining).toBe(false);
        expect(state$.getState().mining_progress).toBe(0);
        expect(state$.getState().asteroid).toBeNull();
    });

    it('merges yield into inventory', () => {
        const system = createMockSystem({
            mergeIntoInventory: vi.fn().mockReturnValue({ Fe: 70, Ni: 30, Co: 10 })
        });
        const state$ = new StateObserver(createTestState({
            is_mining: true,
            asteroid: createTestAsteroid(),
            inventory: { Fe: 10 }
        }));

        new CompleteMiningCommand(state$, system, DEFAULT_BONUSES).execute();

        expect(state$.getState().inventory).toEqual({ Fe: 70, Ni: 30, Co: 10 });
    });

    it('updates hold_used via system.calculateNewHoldUsed', () => {
        const system = createMockSystem({
            calculateNewHoldUsed: vi.fn().mockReturnValue(75)
        });
        const state$ = new StateObserver(createTestState({
            is_mining: true,
            asteroid: createTestAsteroid(),
            hold_used: 25
        }));

        new CompleteMiningCommand(state$, system, DEFAULT_BONUSES).execute();

        expect(state$.getState().hold_used).toBe(75);
    });

    it('appends new discoveries to discovered_elements', () => {
        const system = createMockSystem({
            findNewDiscoveries: vi.fn().mockReturnValue(['Ni', 'Co'])
        });
        const state$ = new StateObserver(createTestState({
            is_mining: true,
            asteroid: createTestAsteroid(),
            discovered_elements: ['Fe']
        }));

        new CompleteMiningCommand(state$, system, DEFAULT_BONUSES).execute();

        expect(state$.getState().discovered_elements).toEqual(['Fe', 'Ni', 'Co']);
    });

    it('does not replace discovered_elements when no new discoveries', () => {
        const system = createMockSystem({
            findNewDiscoveries: vi.fn().mockReturnValue([])
        });
        const existingDiscovered = ['Fe', 'Si'];
        const state$ = new StateObserver(createTestState({
            is_mining: true,
            asteroid: createTestAsteroid(),
            discovered_elements: existingDiscovered
        }));

        new CompleteMiningCommand(state$, system, DEFAULT_BONUSES).execute();

        expect(state$.getState().discovered_elements).toBe(existingDiscovered);
    });

    it('passes tool bonuses to system.calculateYield', () => {
        const system = createMockSystem();
        const bonuses = { yieldMultiplier: 1.5, rareMultiplier: 2.0, powerCostMultiplier: 0.8 };
        const asteroid = createTestAsteroid();
        const state$ = new StateObserver(createTestState({
            is_mining: true,
            asteroid
        }));

        new CompleteMiningCommand(state$, system, bonuses).execute();

        expect(system.calculateYield).toHaveBeenCalledWith(asteroid, bonuses);
    });

    it('caps yield to available hold space', () => {
        const cappedYield = { collected: { Fe: 6 }, totalAmount: 6 };
        const system = createMockSystem({
            capYieldToAvailableSpace: vi.fn().mockReturnValue(cappedYield)
        });
        const state$ = new StateObserver(createTestState({
            is_mining: true,
            asteroid: createTestAsteroid(),
            hold_capacity: 100,
            hold_used: 94
        }));

        const result = new CompleteMiningCommand(state$, system, DEFAULT_BONUSES).execute();

        expect(system.capYieldToAvailableSpace).toHaveBeenCalledWith(
            { collected: { Fe: 60, Ni: 30, Co: 10 }, totalAmount: 100 },
            6 // 100 - 94
        );
        expect(result.cappedYield).toBe(cappedYield);
    });

    it('reads state at execute time, not construction time', () => {
        const system = createMockSystem();
        const state$ = new StateObserver(createTestState({
            is_mining: true,
            asteroid: createTestAsteroid(),
            hold_used: 0
        }));
        const command = new CompleteMiningCommand(state$, system, DEFAULT_BONUSES);

        state$.setState({ hold_used: 50 });
        command.execute();

        // capYieldToAvailableSpace should use updated hold_used (50, not 0)
        expect(system.capYieldToAvailableSpace).toHaveBeenCalledWith(
            expect.anything(),
            50 // 100 - 50
        );
    });

    it('does not modify unrelated state properties', () => {
        const system = createMockSystem();
        const state$ = new StateObserver(createTestState({
            is_mining: true,
            asteroid: createTestAsteroid(),
            credits: 5000,
            power: 42,
            tools_owned: ['laser_drill']
        }));

        new CompleteMiningCommand(state$, system, DEFAULT_BONUSES).execute();

        const state = state$.getState();
        expect(state.credits).toBe(5000);
        expect(state.power).toBe(42);
        expect(state.tools_owned).toEqual(['laser_drill']);
    });

    it('throws when asteroid is null', () => {
        const system = createMockSystem();
        const state$ = new StateObserver(createTestState({ is_mining: true, asteroid: null }));

        expect(() => {
            new CompleteMiningCommand(state$, system, DEFAULT_BONUSES).execute();
        }).toThrow('precondition violated');
    });
});

describe('SellResourcesCommand', () => {
    it('adds totalValue to credits', () => {
        const state$ = new StateObserver(createTestState({
            credits: 1000,
            inventory: { Fe: 10 },
            hold_used: 10
        }));
        const sellResult = { totalValue: 500, itemsSold: { Fe: 10 } };

        new SellResourcesCommand(state$, sellResult).execute();

        expect(state$.getState().credits).toBe(1500);
    });

    it('clears inventory', () => {
        const state$ = new StateObserver(createTestState({
            inventory: { Fe: 10, Ni: 5 },
            hold_used: 15
        }));
        const sellResult = { totalValue: 500, itemsSold: { Fe: 10, Ni: 5 } };

        new SellResourcesCommand(state$, sellResult).execute();

        expect(state$.getState().inventory).toEqual({});
    });

    it('resets hold_used to 0', () => {
        const state$ = new StateObserver(createTestState({ hold_used: 50 }));
        const sellResult = { totalValue: 500, itemsSold: { Fe: 10 } };

        new SellResourcesCommand(state$, sellResult).execute();

        expect(state$.getState().hold_used).toBe(0);
    });

    it('returns the sellResult', () => {
        const state$ = new StateObserver(createTestState({ inventory: { Fe: 10 } }));
        const sellResult = { totalValue: 500, itemsSold: { Fe: 10 } };

        const result = new SellResourcesCommand(state$, sellResult).execute();

        expect(result).toBe(sellResult);
    });

    it('reads state at execute time, not construction time', () => {
        const state$ = new StateObserver(createTestState({ credits: 1000 }));
        const sellResult = { totalValue: 500, itemsSold: { Fe: 10 } };
        const command = new SellResourcesCommand(state$, sellResult);

        state$.setState({ credits: 3000 });
        command.execute();

        expect(state$.getState().credits).toBe(3500);
    });

    it('does not modify unrelated state properties', () => {
        const state$ = new StateObserver(createTestState({
            inventory: { Fe: 10 },
            hold_used: 10,
            power: 42,
            is_mining: false,
            discovered_elements: ['Fe']
        }));
        const sellResult = { totalValue: 500, itemsSold: { Fe: 10 } };

        new SellResourcesCommand(state$, sellResult).execute();

        const state = state$.getState();
        expect(state.power).toBe(42);
        expect(state.is_mining).toBe(false);
        expect(state.discovered_elements).toEqual(['Fe']);
    });
});

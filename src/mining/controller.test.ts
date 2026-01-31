import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MiningController } from './controller';
import { StateObserver } from '../gamestate';
import type { GameState } from '../gamestate/interfaces';
import type { Asteroid } from '../asteroids/interfaces';
import type { MiningEvent, ElementPrices } from './interfaces';

describe('MiningController', () => {
    const prices: ElementPrices = {
        Fe: 50,
        Ni: 150,
        Co: 200
    };

    const createTestAsteroid = (): Asteroid => ({
        type: 'iron_nickel',
        size: 'medium',
        composition: { Fe: 60, Ni: 30, Co: 10 },
        totalYield: 100,
        miningTime: 100, // Short time for testing
        visualDiameter: 80
    });

    const createInitialState = (overrides?: Partial<GameState>): GameState => ({
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
        ...overrides
    });

    let state$: StateObserver<GameState>;
    let controller: MiningController;

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('startMining', () => {
        it('should return false when no asteroid is present', () => {
            state$ = new StateObserver(createInitialState());
            controller = new MiningController(state$, prices);

            const result = controller.startMining();

            expect(result).toBe(false);
            expect(state$.getState().is_mining).toBe(false);
        });

        it('should return false when already mining', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid(),
                is_mining: true
            }));
            controller = new MiningController(state$, prices);

            const result = controller.startMining();

            expect(result).toBe(false);
        });

        it('should start mining when asteroid is present', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid()
            }));
            controller = new MiningController(state$, prices);

            const result = controller.startMining();

            expect(result).toBe(true);
            expect(state$.getState().is_mining).toBe(true);
            expect(state$.getState().mining_progress).toBe(0);
        });

        it('should emit mining_started event', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid()
            }));
            controller = new MiningController(state$, prices);

            const events: MiningEvent[] = [];
            controller.subscribe(event => events.push(event));

            controller.startMining();

            expect(events).toHaveLength(1);
            expect(events[0].type).toBe('mining_started');
        });
    });

    describe('cancelMining', () => {
        it('should cancel active mining', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid(),
                is_mining: true,
                mining_progress: 0.5
            }));
            controller = new MiningController(state$, prices);

            controller.cancelMining();

            expect(state$.getState().is_mining).toBe(false);
            expect(state$.getState().mining_progress).toBe(0);
        });

        it('should do nothing when not mining', () => {
            state$ = new StateObserver(createInitialState());
            controller = new MiningController(state$, prices);

            // Should not throw
            controller.cancelMining();

            expect(state$.getState().is_mining).toBe(false);
        });
    });

    describe('isMining', () => {
        it('should return current mining state', () => {
            state$ = new StateObserver(createInitialState({ is_mining: true }));
            controller = new MiningController(state$, prices);

            expect(controller.isMining()).toBe(true);
        });
    });

    describe('getProgress', () => {
        it('should return current progress', () => {
            state$ = new StateObserver(createInitialState({ mining_progress: 0.75 }));
            controller = new MiningController(state$, prices);

            expect(controller.getProgress()).toBe(0.75);
        });
    });

    describe('sellResources', () => {
        it('should sell inventory and return result', () => {
            state$ = new StateObserver(createInitialState({
                inventory: { Fe: 10, Ni: 5 },
                hold_used: 15
            }));
            controller = new MiningController(state$, prices);

            const result = controller.sellResources();

            expect(result).not.toBeNull();
            expect(result!.totalValue).toBe(10 * 50 + 5 * 150); // 1250
            expect(state$.getState().credits).toBe(1000 + 1250);
            expect(state$.getState().inventory).toEqual({});
            expect(state$.getState().hold_used).toBe(0);
        });

        it('should return null for empty inventory', () => {
            state$ = new StateObserver(createInitialState());
            controller = new MiningController(state$, prices);

            const result = controller.sellResources();

            expect(result).toBeNull();
            expect(state$.getState().credits).toBe(1000);
        });
    });

    describe('subscribe', () => {
        it('should allow subscribing to events', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid()
            }));
            controller = new MiningController(state$, prices);

            const events: MiningEvent[] = [];
            controller.subscribe(event => events.push(event));

            controller.startMining();

            expect(events.length).toBeGreaterThan(0);
        });

        it('should return unsubscribe function', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid()
            }));
            controller = new MiningController(state$, prices);

            const events: MiningEvent[] = [];
            const unsubscribe = controller.subscribe(event => events.push(event));

            unsubscribe();
            controller.startMining();

            expect(events).toHaveLength(0);
        });
    });

    describe('mining completion', () => {
        it('should emit discovery events for new elements', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid(),
                discovered_elements: ['Fe'] // Already discovered Fe
            }));
            controller = new MiningController(state$, prices);

            const events: MiningEvent[] = [];
            controller.subscribe(event => events.push(event));

            controller.startMining();

            // Advance time past mining completion (miningTime is 100ms)
            vi.advanceTimersByTime(150);

            const discoveries = events.filter(e => e.type === 'discovery');
            // Should discover Ni and Co (Fe is already discovered)
            expect(discoveries).toHaveLength(2);
            expect(discoveries.map(d => (d as { type: 'discovery'; element: string }).element).sort())
                .toEqual(['Co', 'Ni']);
        });

        it('should update discovered_elements in state', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid(),
                discovered_elements: []
            }));
            controller = new MiningController(state$, prices);

            controller.startMining();

            // Advance time past mining completion
            vi.advanceTimersByTime(150);

            const discovered = state$.getState().discovered_elements;
            expect(discovered).toContain('Fe');
            expect(discovered).toContain('Ni');
            expect(discovered).toContain('Co');
        });

        it('should add resources to inventory on completion', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid(),
                inventory: { Fe: 10 }, // Start with some Fe
                hold_used: 10
            }));
            controller = new MiningController(state$, prices);

            controller.startMining();
            vi.advanceTimersByTime(150);

            const state = state$.getState();
            // Original 10 Fe + 60% of 100 yield = 70 Fe
            expect(state.inventory.Fe).toBe(70);
            // 30% of 100 = 30 Ni
            expect(state.inventory.Ni).toBe(30);
            // 10% of 100 = 10 Co
            expect(state.inventory.Co).toBe(10);
            // Hold should be updated
            expect(state.hold_used).toBe(100); // 10 original + 100 collected, capped at capacity
        });

        it('should emit mining_completed event with yield', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid()
            }));
            controller = new MiningController(state$, prices);

            const events: MiningEvent[] = [];
            controller.subscribe(event => events.push(event));

            controller.startMining();
            vi.advanceTimersByTime(150);

            const completedEvent = events.find(e => e.type === 'mining_completed');
            expect(completedEvent).toBeDefined();
            expect(completedEvent!.type).toBe('mining_completed');
            const yield_ = (completedEvent as { type: 'mining_completed'; yield: { collected: Record<string, number>; totalAmount: number } }).yield;
            expect(yield_.totalAmount).toBe(100);
            expect(yield_.collected.Fe).toBe(60);
        });
    });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MiningController } from './controller';
import { StateObserver } from '../gamestate';
import type { GameState } from '../gamestate/interfaces';
import type { Asteroid } from '../asteroids/interfaces';
import type { IToolController } from '../tools/interfaces';
import type { MiningEvent } from './interfaces';

describe('MiningController', () => {
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
        power_capacity: 100,
        equipped_tools: [],
        tools_owned: [],
        current_cell: { x: 0, y: 0, z: 0 },
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
            controller = new MiningController(state$);

            const result = controller.startMining();

            expect(result).toBe(false);
            expect(state$.getState().is_mining).toBe(false);
        });

        it('should return false when already mining', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid(),
                is_mining: true
            }));
            controller = new MiningController(state$);

            const result = controller.startMining();

            expect(result).toBe(false);
        });

        it('should start mining when asteroid is present', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid()
            }));
            controller = new MiningController(state$);

            const result = controller.startMining();

            expect(result).toBe(true);
            expect(state$.getState().is_mining).toBe(true);
            expect(state$.getState().mining_progress).toBe(0);
        });

        it('should emit mining_started event', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid()
            }));
            controller = new MiningController(state$);

            const events: MiningEvent[] = [];
            controller.subscribe(event => events.push(event));

            controller.startMining();

            expect(events).toHaveLength(1);
            expect(events[0].type).toBe('mining_started');
        });

        it('should deduct 10 power when starting mining', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid(),
                power: 50
            }));
            controller = new MiningController(state$);

            controller.startMining();

            expect(state$.getState().power).toBe(40);
        });

        it('should not start mining when power < 10', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid(),
                power: 9
            }));
            controller = new MiningController(state$);

            const events: MiningEvent[] = [];
            controller.subscribe(event => events.push(event));

            const result = controller.startMining();

            expect(result).toBe(false);
            expect(state$.getState().is_mining).toBe(false);
            expect(state$.getState().power).toBe(9); // Unchanged

            // Should emit mining_failed event
            expect(events).toHaveLength(1);
            expect(events[0].type).toBe('mining_failed');
            expect((events[0] as { type: 'mining_failed'; reason: 'insufficient_power' }).reason).toBe('insufficient_power');
        });
    });

    describe('cancelMining', () => {
        it('should cancel active mining', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid(),
                is_mining: true,
                mining_progress: 0.5
            }));
            controller = new MiningController(state$);

            controller.cancelMining();

            expect(state$.getState().is_mining).toBe(false);
            expect(state$.getState().mining_progress).toBe(0);
        });

        it('should do nothing when not mining', () => {
            state$ = new StateObserver(createInitialState());
            controller = new MiningController(state$);

            // Should not throw
            controller.cancelMining();

            expect(state$.getState().is_mining).toBe(false);
        });
    });

    describe('isMining', () => {
        it('should return current mining state', () => {
            state$ = new StateObserver(createInitialState({ is_mining: true }));
            controller = new MiningController(state$);

            expect(controller.isMining()).toBe(true);
        });
    });

    describe('getProgress', () => {
        it('should return current progress', () => {
            state$ = new StateObserver(createInitialState({ mining_progress: 0.75 }));
            controller = new MiningController(state$);

            expect(controller.getProgress()).toBe(0.75);
        });
    });

    describe('subscribe', () => {
        it('should allow subscribing to events', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid()
            }));
            controller = new MiningController(state$);

            const events: MiningEvent[] = [];
            controller.subscribe(event => events.push(event));

            controller.startMining();

            expect(events.length).toBeGreaterThan(0);
        });

        it('should return unsubscribe function', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid()
            }));
            controller = new MiningController(state$);

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
            controller = new MiningController(state$);

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
            controller = new MiningController(state$);

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
            controller = new MiningController(state$);

            controller.startMining();
            vi.advanceTimersByTime(150);

            const state = state$.getState();
            // Original 10 Fe + 60% of 90 yield = 64 Fe
            expect(state.inventory.Fe).toBe(64);
            // 30% of 90 = 27 Ni
            expect(state.inventory.Ni).toBe(27);
            // 10% of 90 = 9 Co
            expect(state.inventory.Co).toBe(9);
            // Hold should be updated
            expect(state.hold_used).toBe(100); // 10 original + 90 collected, capped at capacity
        });

        it('should emit mining_completed event with yield', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid()
            }));
            controller = new MiningController(state$);

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

        it('should cap yield to available hold space', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid(), // 100kg total yield
                inventory: {},
                hold_capacity: 100,
                hold_used: 90 // Only 10kg space available
            }));
            controller = new MiningController(state$);

            const events: MiningEvent[] = [];
            controller.subscribe(event => events.push(event));

            controller.startMining();
            vi.advanceTimersByTime(150);

            const state = state$.getState();

            // Should only collect 10kg total (scaled proportionally)
            // Scale factor = 10/100 = 0.1
            // Fe: floor(60 * 0.1) = 6
            // Ni: floor(30 * 0.1) = 3
            // Co: floor(10 * 0.1) = 1
            expect(state.inventory.Fe).toBe(6);
            expect(state.inventory.Ni).toBe(3);
            expect(state.inventory.Co).toBe(1);
            expect(state.hold_used).toBe(100); // 90 + 10 = 100

            // Verify the emitted event also has capped yield
            const completedEvent = events.find(e => e.type === 'mining_completed');
            expect(completedEvent).toBeDefined();
            const yield_ = (completedEvent as { type: 'mining_completed'; yield: { collected: Record<string, number>; totalAmount: number } }).yield;
            expect(yield_.totalAmount).toBe(10);
        });

        it('should collect nothing when hold is full', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid(),
                inventory: { Fe: 100 },
                hold_capacity: 100,
                hold_used: 100 // No space available
            }));
            controller = new MiningController(state$);

            controller.startMining();
            vi.advanceTimersByTime(150);

            const state = state$.getState();

            // Inventory should not change
            expect(state.inventory).toEqual({ Fe: 100 });
            expect(state.hold_used).toBe(100);
        });
    });

    describe('tool bonuses integration', () => {
        const createMockToolController = (overrides = {}): IToolController => ({
            buyTool: vi.fn(),
            equipTool: vi.fn(),
            unequipTool: vi.fn(),
            getEquippedTools: vi.fn().mockReturnValue([]),
            getOwnedTools: vi.fn().mockReturnValue([]),
            getToolBonuses: vi.fn().mockReturnValue({
                yieldMultiplier: 1.0,
                rareMultiplier: 1.0,
                powerCostMultiplier: 1.0,
                ...overrides
            }),
            getAvailableSlots: vi.fn().mockReturnValue(2),
            isToolOwned: vi.fn().mockReturnValue(false),
            isToolEquipped: vi.fn().mockReturnValue(false),
            getToolData: vi.fn(),
            getAllTools: vi.fn().mockReturnValue([])
        });

        it('should apply power cost multiplier when starting mining', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid(),
                power: 50
            }));
            const toolCtrl = createMockToolController({ powerCostMultiplier: 1.5 });
            controller = new MiningController(state$, toolCtrl);

            controller.startMining();

            // Base cost = 10, with 1.5x = ceil(15) = 15
            expect(state$.getState().power).toBe(35); // 50 - 15
        });

        it('should fail mining when power < effective cost', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid(),
                power: 12
            }));
            const toolCtrl = createMockToolController({ powerCostMultiplier: 1.5 });
            controller = new MiningController(state$, toolCtrl);

            const events: MiningEvent[] = [];
            controller.subscribe(e => events.push(e));

            const result = controller.startMining();

            // Effective cost = ceil(10 * 1.5) = 15, but power is only 12
            expect(result).toBe(false);
            expect(events[0].type).toBe('mining_failed');
        });

        it('should apply yield bonus to mining output', () => {
            state$ = new StateObserver(createInitialState({
                asteroid: createTestAsteroid()
            }));
            const toolCtrl = createMockToolController({ yieldMultiplier: 1.5 });

            // Use a spy on MiningSystem to verify bonuses are passed
            const mockSystem = {
                calculateYield: vi.fn().mockReturnValue({
                    collected: { Fe: 90, Ni: 45, Co: 15 },
                    totalAmount: 150
                }),
                capYieldToAvailableSpace: vi.fn().mockImplementation(
                    (yield_: { collected: Record<string, number>; totalAmount: number }) => yield_
                ),
                findNewDiscoveries: vi.fn().mockReturnValue([]),
                mergeIntoInventory: vi.fn().mockImplementation(
                    (_current: Record<string, number>, collected: Record<string, number>) => collected
                ),
                calculateNewHoldUsed: vi.fn().mockReturnValue(150)
            };

            controller = new MiningController(state$, toolCtrl, mockSystem);

            controller.startMining();
            vi.advanceTimersByTime(150);

            // Verify calculateYield was called with tool bonuses
            expect(mockSystem.calculateYield).toHaveBeenCalledWith(
                createTestAsteroid(),
                expect.objectContaining({ yieldMultiplier: 1.5 })
            );

            const state = state$.getState();
            expect(state.inventory.Fe).toBe(90);
            expect(state.inventory.Ni).toBe(45);
            expect(state.inventory.Co).toBe(15);
        });
    });
});

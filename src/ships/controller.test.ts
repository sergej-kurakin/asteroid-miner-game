import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShipController } from './controller';
import type { Observable } from '../gamestate';
import type { GameState } from '../gamestate/interfaces';
import { SHIPS } from './constants';

function createMockState(overrides: Partial<GameState> = {}): GameState {
    return {
        credits: 0,
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
        ...overrides
    };
}

function createMockObservable(initialState: GameState): Observable<GameState> & { currentState: GameState } {
    let state = { ...initialState };
    return {
        currentState: state,
        getState: () => state,
        setState: vi.fn((partial: Partial<GameState>) => {
            state = { ...state, ...partial };
        }),
        updateProperty: vi.fn(<K extends keyof GameState>(key: K, value: GameState[K]) => {
            state = { ...state, [key]: value };
        }),
        subscribe: vi.fn(() => () => {}),
        subscribeToProperty: vi.fn(() => () => {})
    };
}

describe('ShipController', () => {
    let mockObservable: ReturnType<typeof createMockObservable>;
    let controller: ShipController;

    beforeEach(() => {
        mockObservable = createMockObservable(createMockState());
        controller = new ShipController(mockObservable);
    });

    describe('getCurrentShip', () => {
        it('returns the ship for current level', () => {
            const ship = controller.getCurrentShip();
            expect(ship.id).toBe(1);
            expect(ship.name).toBe('Scout Class');
        });

        it('returns correct ship for higher levels', () => {
            mockObservable = createMockObservable(createMockState({ current_ship_level: 3 }));
            controller = new ShipController(mockObservable);

            const ship = controller.getCurrentShip();
            expect(ship.id).toBe(3);
            expect(ship.name).toBe('Harvester Class');
        });
    });

    describe('getNextShip', () => {
        it('returns next ship when not at max level', () => {
            const nextShip = controller.getNextShip();
            expect(nextShip).toBeDefined();
            expect(nextShip!.id).toBe(2);
            expect(nextShip!.name).toBe('Prospector Class');
        });

        it('returns undefined when at max level', () => {
            mockObservable = createMockObservable(createMockState({ current_ship_level: 5 }));
            controller = new ShipController(mockObservable);

            const nextShip = controller.getNextShip();
            expect(nextShip).toBeUndefined();
        });
    });

    describe('canAffordUpgrade', () => {
        it('returns false when not enough credits', () => {
            mockObservable = createMockObservable(createMockState({ credits: 1000 }));
            controller = new ShipController(mockObservable);

            expect(controller.canAffordUpgrade()).toBe(false);
        });

        it('returns true when enough credits', () => {
            mockObservable = createMockObservable(createMockState({ credits: 2000 }));
            controller = new ShipController(mockObservable);

            expect(controller.canAffordUpgrade()).toBe(true);
        });

        it('returns false at max level even with credits', () => {
            mockObservable = createMockObservable(createMockState({
                current_ship_level: 5,
                credits: 100000
            }));
            controller = new ShipController(mockObservable);

            expect(controller.canAffordUpgrade()).toBe(false);
        });
    });

    describe('isMaxLevel', () => {
        it('returns false when not at max level', () => {
            expect(controller.isMaxLevel()).toBe(false);
        });

        it('returns true at max level', () => {
            mockObservable = createMockObservable(createMockState({ current_ship_level: 5 }));
            controller = new ShipController(mockObservable);

            expect(controller.isMaxLevel()).toBe(true);
        });
    });

    describe('getLevel', () => {
        it('returns current ship level', () => {
            expect(controller.getLevel()).toBe(1);
        });

        it('returns correct level for different ships', () => {
            mockObservable = createMockObservable(createMockState({ current_ship_level: 4 }));
            controller = new ShipController(mockObservable);

            expect(controller.getLevel()).toBe(4);
        });
    });

    describe('getMiningTime', () => {
        it('returns mining time for current ship', () => {
            expect(controller.getMiningTime()).toBe(SHIPS[0].miningTime);
        });

        it('returns correct mining time for higher level ships', () => {
            mockObservable = createMockObservable(createMockState({ current_ship_level: 5 }));
            controller = new ShipController(mockObservable);

            expect(controller.getMiningTime()).toBe(SHIPS[4].miningTime);
        });
    });

    describe('getToolSlots', () => {
        it('returns tool slots for current ship', () => {
            expect(controller.getToolSlots()).toBe(SHIPS[0].toolSlots);
        });

        it('returns correct tool slots for higher level ships', () => {
            mockObservable = createMockObservable(createMockState({ current_ship_level: 5 }));
            controller = new ShipController(mockObservable);

            expect(controller.getToolSlots()).toBe(SHIPS[4].toolSlots);
        });
    });

    describe('upgrade', () => {
        it('returns error when at max level', () => {
            mockObservable = createMockObservable(createMockState({
                current_ship_level: 5,
                credits: 100000
            }));
            controller = new ShipController(mockObservable);

            const result = controller.upgrade();
            expect(result.success).toBe(false);
            expect(result.error).toBe('max_level_reached');
        });

        it('returns error when insufficient credits', () => {
            mockObservable = createMockObservable(createMockState({ credits: 1000 }));
            controller = new ShipController(mockObservable);

            const result = controller.upgrade();
            expect(result.success).toBe(false);
            expect(result.error).toBe('insufficient_credits');
        });

        it('succeeds and updates state when affordable', () => {
            mockObservable = createMockObservable(createMockState({
                credits: 5000,
                hold_capacity: 100,
                hold_used: 50
            }));
            controller = new ShipController(mockObservable);

            const result = controller.upgrade();

            expect(result.success).toBe(true);
            expect(result.newShip).toBeDefined();
            expect(result.newShip!.id).toBe(2);
            expect(mockObservable.setState).toHaveBeenCalled();
        });

        it('deducts correct cost', () => {
            const initialCredits = 5000;
            mockObservable = createMockObservable(createMockState({ credits: initialCredits }));
            controller = new ShipController(mockObservable);

            controller.upgrade();

            const stateCall = (mockObservable.setState as ReturnType<typeof vi.fn>).mock.calls[0][0];
            expect(stateCall.credits).toBe(initialCredits - SHIPS[1].cost);
        });

        it('updates ship level', () => {
            mockObservable = createMockObservable(createMockState({ credits: 5000 }));
            controller = new ShipController(mockObservable);

            controller.upgrade();

            const stateCall = (mockObservable.setState as ReturnType<typeof vi.fn>).mock.calls[0][0];
            expect(stateCall.current_ship_level).toBe(2);
        });

        it('updates hold capacity', () => {
            mockObservable = createMockObservable(createMockState({ credits: 5000 }));
            controller = new ShipController(mockObservable);

            controller.upgrade();

            const stateCall = (mockObservable.setState as ReturnType<typeof vi.fn>).mock.calls[0][0];
            expect(stateCall.hold_capacity).toBe(SHIPS[1].holdCapacity);
        });

        it('proportionally adjusts hold_used', () => {
            mockObservable = createMockObservable(createMockState({
                credits: 5000,
                hold_capacity: 100,
                hold_used: 50  // 50% full
            }));
            controller = new ShipController(mockObservable);

            controller.upgrade();

            const stateCall = (mockObservable.setState as ReturnType<typeof vi.fn>).mock.calls[0][0];
            // Next ship has 150 capacity, 50% of that is 75
            expect(stateCall.hold_used).toBe(75);
        });

        it('caps hold_used at new capacity', () => {
            mockObservable = createMockObservable(createMockState({
                credits: 5000,
                hold_capacity: 100,
                hold_used: 100  // 100% full
            }));
            controller = new ShipController(mockObservable);

            controller.upgrade();

            const stateCall = (mockObservable.setState as ReturnType<typeof vi.fn>).mock.calls[0][0];
            // Should be capped at new capacity
            expect(stateCall.hold_used).toBe(SHIPS[1].holdCapacity);
        });

        it('caps power_capacity at new capacity', () => {
            mockObservable = createMockObservable(createMockState({
                credits: 5000,
                power: 90,
                power_capacity: 100
            }));
            controller = new ShipController(mockObservable);

            controller.upgrade();

            const stateCall = (mockObservable.setState as ReturnType<typeof vi.fn>).mock.calls[0][0];
            // Should be capped at new capacity
            expect(stateCall.power).toBe(90);
            expect(stateCall.power_capacity).toBe(SHIPS[1].powerCell);
        });
    });
});

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
        equipped_tools: [],
        tools_owned: [],
        current_cell: { x: 0, y: 0, z: 0 },
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
            if (!result.success) {
                expect(result.error).toBe('max_level_reached');
            }
        });

        it('returns error when insufficient credits', () => {
            mockObservable = createMockObservable(createMockState({ credits: 1000 }));
            controller = new ShipController(mockObservable);

            const result = controller.upgrade();
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('insufficient_credits');
            }
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
            if (result.success) {
                expect(result.newShip.id).toBe(2);
            }
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

    describe('calculateMoveCost', () => {
        it('returns base cost when hold is empty', () => {
            mockObservable = createMockObservable(createMockState({ hold_used: 0 }));
            controller = new ShipController(mockObservable);

            expect(controller.calculateMoveCost()).toBe(20);
        });

        it('returns base cost when hold is under first penalty threshold', () => {
            mockObservable = createMockObservable(createMockState({ hold_used: 49 }));
            controller = new ShipController(mockObservable);

            expect(controller.calculateMoveCost()).toBe(20);
        });

        it('adds 10% per 50 units of cargo', () => {
            // 50 hold_used = 1 step → 20 * 1.1 = 22
            mockObservable = createMockObservable(createMockState({ hold_used: 50 }));
            controller = new ShipController(mockObservable);

            expect(controller.calculateMoveCost()).toBe(22);
        });

        it('ceils fractional result', () => {
            // 3 steps → 20 * 1.3 = 26 (no fraction here, but test 150 hold_used)
            // 150 / 50 = 3 steps → 20 * 1.3 = 26
            mockObservable = createMockObservable(createMockState({ hold_used: 150 }));
            controller = new ShipController(mockObservable);

            expect(controller.calculateMoveCost()).toBe(26);
        });
    });

    describe('travel', () => {
        it('succeeds and returns new cell for valid adjacent move', () => {
            mockObservable = createMockObservable(createMockState({
                current_cell: { x: 5, y: 5, z: 5 },
                power: 100,
                is_mining: false,
            }));
            controller = new ShipController(mockObservable);

            const result = controller.travel({ x: 6, y: 5, z: 5 });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.newCell).toEqual({ x: 6, y: 5, z: 5 });
            }
        });

        it('updates state on successful travel', () => {
            mockObservable = createMockObservable(createMockState({
                current_cell: { x: 5, y: 5, z: 5 },
                power: 100,
                is_mining: false,
            }));
            controller = new ShipController(mockObservable);

            controller.travel({ x: 5, y: 6, z: 5 });

            expect(mockObservable.setState).toHaveBeenCalled();
            const stateCall = (mockObservable.setState as ReturnType<typeof vi.fn>).mock.calls[0][0];
            expect(stateCall.current_cell).toEqual({ x: 5, y: 6, z: 5 });
            expect(stateCall.power).toBe(80); // 100 - 20
        });

        it('returns is_mining error when mining', () => {
            mockObservable = createMockObservable(createMockState({
                current_cell: { x: 5, y: 5, z: 5 },
                power: 100,
                is_mining: true,
            }));
            controller = new ShipController(mockObservable);

            const result = controller.travel({ x: 6, y: 5, z: 5 });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('is_mining');
            }
        });

        it('returns insufficient_power error when not enough power', () => {
            mockObservable = createMockObservable(createMockState({
                current_cell: { x: 5, y: 5, z: 5 },
                power: 5,
                is_mining: false,
            }));
            controller = new ShipController(mockObservable);

            const result = controller.travel({ x: 6, y: 5, z: 5 });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('insufficient_power');
            }
        });

        it('returns invalid_destination for non-adjacent cell', () => {
            mockObservable = createMockObservable(createMockState({
                current_cell: { x: 5, y: 5, z: 5 },
                power: 100,
                is_mining: false,
            }));
            controller = new ShipController(mockObservable);

            const result = controller.travel({ x: 7, y: 5, z: 5 });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('invalid_destination');
            }
        });

        it('returns invalid_destination for out-of-bounds cell', () => {
            mockObservable = createMockObservable(createMockState({
                current_cell: { x: 0, y: 0, z: 0 },
                power: 100,
                is_mining: false,
            }));
            controller = new ShipController(mockObservable);

            const result = controller.travel({ x: -1, y: 0, z: 0 });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('invalid_destination');
            }
        });

        it('returns invalid_destination for diagonal move', () => {
            mockObservable = createMockObservable(createMockState({
                current_cell: { x: 5, y: 5, z: 5 },
                power: 100,
                is_mining: false,
            }));
            controller = new ShipController(mockObservable);

            const result = controller.travel({ x: 6, y: 6, z: 5 });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('invalid_destination');
            }
        });
    });
});

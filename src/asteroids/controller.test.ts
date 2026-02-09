import { describe, it, expect } from 'vitest';
import { AsteroidsController } from './controller';
import { StateObserver } from '../gamestate';
import type { GameState } from '../gamestate/interfaces';
import type { World } from '../world/interfaces';
import { CellType, MiningConstraint } from '../world/interfaces';
import { positionKey } from '../world/utils';
import { SCAN_POWER_COST } from './constants';

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
    current_cell: { x: 0, y: 0, z: 0 },
    ...overrides
});

describe('AsteroidsController', () => {
    describe('scan()', () => {
        it('generates asteroid and deducts power on success', () => {
            const state$ = new StateObserver(createTestState({ power: 100 }));
            const controller = new AsteroidsController(state$);

            const result = controller.scan();

            expect(result.success).toBe(true);
            expect(result.asteroid).toBeDefined();
            expect(state$.getState().power).toBe(100 - SCAN_POWER_COST);
            expect(state$.getState().asteroid).toBe(result.asteroid);
        });

        it('returns error when is_mining is true', () => {
            const state$ = new StateObserver(createTestState({ is_mining: true }));
            const controller = new AsteroidsController(state$);
            const initialPower = state$.getState().power;

            const result = controller.scan();

            expect(result.success).toBe(false);
            expect(result.error).toBe('is_mining');
            expect(state$.getState().power).toBe(initialPower);
            expect(state$.getState().asteroid).toBeNull();
        });

        it('returns error when asteroid already exists', () => {
            const existingAsteroid = {
                type: 'iron_nickel' as const,
                size: 'small' as const,
                composition: { Fe: 90, Ni: 10 },
                totalYield: 100,
                miningTime: 2500,
                visualDiameter: 120
            };
            const state$ = new StateObserver(createTestState({ asteroid: existingAsteroid }));
            const controller = new AsteroidsController(state$);
            const initialPower = state$.getState().power;

            const result = controller.scan();

            expect(result.success).toBe(false);
            expect(result.error).toBe('asteroid_exists');
            expect(state$.getState().power).toBe(initialPower);
            expect(state$.getState().asteroid).toBe(existingAsteroid);
        });

        it('returns error when power is insufficient', () => {
            const state$ = new StateObserver(createTestState({ power: SCAN_POWER_COST - 1 }));
            const controller = new AsteroidsController(state$);

            const result = controller.scan();

            expect(result.success).toBe(false);
            expect(result.error).toBe('insufficient_power');
            expect(state$.getState().power).toBe(SCAN_POWER_COST - 1);
            expect(state$.getState().asteroid).toBeNull();
        });

        it('succeeds when power is exactly at threshold', () => {
            const state$ = new StateObserver(createTestState({ power: SCAN_POWER_COST }));
            const controller = new AsteroidsController(state$);

            const result = controller.scan();

            expect(result.success).toBe(true);
            expect(state$.getState().power).toBe(0);
            expect(state$.getState().asteroid).toBeDefined();
        });
    });

    describe('abandon()', () => {
        it('clears asteroid on success', () => {
            const existingAsteroid = {
                type: 'iron_nickel' as const,
                size: 'small' as const,
                composition: { Fe: 90, Ni: 10 },
                totalYield: 100,
                miningTime: 2500,
                visualDiameter: 120
            };
            const state$ = new StateObserver(createTestState({ asteroid: existingAsteroid }));
            const controller = new AsteroidsController(state$);

            const result = controller.abandon();

            expect(result.success).toBe(true);
            expect(state$.getState().asteroid).toBeNull();
        });

        it('returns error when is_mining is true', () => {
            const existingAsteroid = {
                type: 'iron_nickel' as const,
                size: 'small' as const,
                composition: { Fe: 90, Ni: 10 },
                totalYield: 100,
                miningTime: 2500,
                visualDiameter: 120
            };
            const state$ = new StateObserver(createTestState({
                asteroid: existingAsteroid,
                is_mining: true
            }));
            const controller = new AsteroidsController(state$);

            const result = controller.abandon();

            expect(result.success).toBe(false);
            expect(result.error).toBe('is_mining');
            expect(state$.getState().asteroid).toBe(existingAsteroid);
        });

        it('returns error when no asteroid exists', () => {
            const state$ = new StateObserver(createTestState({ asteroid: null }));
            const controller = new AsteroidsController(state$);

            const result = controller.abandon();

            expect(result.success).toBe(false);
            expect(result.error).toBe('no_asteroid');
        });
    });

    describe('canScan()', () => {
        it('returns true when no asteroid, not mining, and power >= threshold', () => {
            const state$ = new StateObserver(createTestState({
                asteroid: null,
                is_mining: false,
                power: SCAN_POWER_COST
            }));
            const controller = new AsteroidsController(state$);

            expect(controller.canScan()).toBe(true);
        });

        it('returns false when is_mining is true', () => {
            const state$ = new StateObserver(createTestState({
                asteroid: null,
                is_mining: true,
                power: 100
            }));
            const controller = new AsteroidsController(state$);

            expect(controller.canScan()).toBe(false);
        });

        it('returns false when asteroid exists', () => {
            const existingAsteroid = {
                type: 'iron_nickel' as const,
                size: 'small' as const,
                composition: { Fe: 90, Ni: 10 },
                totalYield: 100,
                miningTime: 2500,
                visualDiameter: 120
            };
            const state$ = new StateObserver(createTestState({
                asteroid: existingAsteroid,
                is_mining: false,
                power: 100
            }));
            const controller = new AsteroidsController(state$);

            expect(controller.canScan()).toBe(false);
        });

        it('returns false when power is insufficient', () => {
            const state$ = new StateObserver(createTestState({
                asteroid: null,
                is_mining: false,
                power: SCAN_POWER_COST - 1
            }));
            const controller = new AsteroidsController(state$);

            expect(controller.canScan()).toBe(false);
        });
    });

    describe('canAbandon()', () => {
        it('returns true when has asteroid and not mining', () => {
            const existingAsteroid = {
                type: 'iron_nickel' as const,
                size: 'small' as const,
                composition: { Fe: 90, Ni: 10 },
                totalYield: 100,
                miningTime: 2500,
                visualDiameter: 120
            };
            const state$ = new StateObserver(createTestState({
                asteroid: existingAsteroid,
                is_mining: false
            }));
            const controller = new AsteroidsController(state$);

            expect(controller.canAbandon()).toBe(true);
        });

        it('returns false when is_mining is true', () => {
            const existingAsteroid = {
                type: 'iron_nickel' as const,
                size: 'small' as const,
                composition: { Fe: 90, Ni: 10 },
                totalYield: 100,
                miningTime: 2500,
                visualDiameter: 120
            };
            const state$ = new StateObserver(createTestState({
                asteroid: existingAsteroid,
                is_mining: true
            }));
            const controller = new AsteroidsController(state$);

            expect(controller.canAbandon()).toBe(false);
        });

        it('returns false when no asteroid exists', () => {
            const state$ = new StateObserver(createTestState({
                asteroid: null,
                is_mining: false
            }));
            const controller = new AsteroidsController(state$);

            expect(controller.canAbandon()).toBe(false);
        });
    });

    describe('world constraints', () => {
        function makeWorld(cells: Array<{ pos: { x: number; y: number; z: number }; type: CellType; miningConstraint?: MiningConstraint }>): World {
            const world: World = new Map();
            for (const { pos, type, miningConstraint = MiningConstraint.Any } of cells) {
                world.set(positionKey(pos), { position: pos, type, miningConstraint });
            }
            return world;
        }

        it('blocks scan when cell is not a Mining cell', () => {
            const world = makeWorld([
                { pos: { x: 0, y: 0, z: 0 }, type: CellType.PowerStation }
            ]);
            const state$ = new StateObserver(createTestState({ power: 100, current_cell: { x: 0, y: 0, z: 0 } }));
            const controller = new AsteroidsController(state$, undefined, world);

            const result = controller.scan();
            expect(result.success).toBe(false);
            expect(result.error).toBe('no_mining_zone');
        });

        it('blocks scan when constraint is None (near market)', () => {
            // Place a market at (0,0,0) and a mining cell at (1,0,0) within radius 3
            const world = makeWorld([
                { pos: { x: 0, y: 0, z: 0 }, type: CellType.Market },
                { pos: { x: 1, y: 0, z: 0 }, type: CellType.Mining, miningConstraint: MiningConstraint.None }
            ]);
            const state$ = new StateObserver(createTestState({ power: 100, current_cell: { x: 1, y: 0, z: 0 } }));
            const controller = new AsteroidsController(state$, undefined, world);

            const result = controller.scan();
            expect(result.success).toBe(false);
            expect(result.error).toBe('no_mining_zone');
        });

        it('succeeds scan on Mining cell with Any constraint', () => {
            // Mining cell far from any market/power station
            const world = makeWorld([
                { pos: { x: 10, y: 10, z: 10 }, type: CellType.Mining }
            ]);
            const state$ = new StateObserver(createTestState({ power: 100, current_cell: { x: 10, y: 10, z: 10 } }));
            const controller = new AsteroidsController(state$, undefined, world);

            const result = controller.scan();
            expect(result.success).toBe(true);
            expect(result.asteroid).toBeDefined();
        });

        it('canScan returns false on non-Mining cell', () => {
            const world = makeWorld([
                { pos: { x: 5, y: 5, z: 5 }, type: CellType.Market }
            ]);
            const state$ = new StateObserver(createTestState({ power: 100, current_cell: { x: 5, y: 5, z: 5 } }));
            const controller = new AsteroidsController(state$, undefined, world);

            expect(controller.canScan()).toBe(false);
        });

        it('canScan returns true on Mining cell with Any constraint', () => {
            const world = makeWorld([
                { pos: { x: 15, y: 15, z: 15 }, type: CellType.Mining }
            ]);
            const state$ = new StateObserver(createTestState({ power: 100, current_cell: { x: 15, y: 15, z: 15 } }));
            const controller = new AsteroidsController(state$, undefined, world);

            expect(controller.canScan()).toBe(true);
        });
    });

    describe('getCurrentAsteroid()', () => {
        it('returns current asteroid when one exists', () => {
            const existingAsteroid = {
                type: 'iron_nickel' as const,
                size: 'small' as const,
                composition: { Fe: 90, Ni: 10 },
                totalYield: 100,
                miningTime: 2500,
                visualDiameter: 120
            };
            const state$ = new StateObserver(createTestState({ asteroid: existingAsteroid }));
            const controller = new AsteroidsController(state$);

            expect(controller.getCurrentAsteroid()).toBe(existingAsteroid);
        });

        it('returns null when no asteroid exists', () => {
            const state$ = new StateObserver(createTestState({ asteroid: null }));
            const controller = new AsteroidsController(state$);

            expect(controller.getCurrentAsteroid()).toBeNull();
        });
    });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { PowerController } from './controller';
import { StateObserver } from '../gamestate/observer';
import type { GameState } from '../gamestate/interfaces';
import type { World } from '../world/interfaces';
import { CellType, MiningConstraint, WorldService } from '../world';
import { POWER_BASE_COST, POWER_DISTANCE_RATE, POWER_GAIN } from './constants';

function makeWorld(powerStationAt?: { x: number; y: number; z: number }): World {
    const world: World = new Map();
    if (powerStationAt) {
        const key = `${powerStationAt.x},${powerStationAt.y},${powerStationAt.z}`;
        world.set(key, {
            position: powerStationAt,
            type: CellType.PowerStation,
            miningConstraint: MiningConstraint.Any,
        });
    }
    return world;
}

describe('PowerController', () => {
    let gameState$: StateObserver<GameState>;
    let powerController: PowerController;

    beforeEach(() => {
        gameState$ = new StateObserver<GameState>({
            credits: 500,
            power: 80,
            current_ship_level: 1,
            discovered_elements: [],
            inventory: {},
            hold_used: 0,
            hold_capacity: 100,
            asteroid: null,
            is_mining: false,
            mining_progress: 0,
            power_capacity: 100,
            equipped_tools: [],
            tools_owned: [],
            current_cell: { x: 0, y: 0, z: 0 },
        });
        // Power station at Manhattan distance 2 from origin → cost = 100 + 2*10 = 120
        const world = makeWorld({ x: 2, y: 0, z: 0 });
        powerController = new PowerController(gameState$, new WorldService(world));
    });

    describe('getPowerCost', () => {
        it('returns base cost plus distance surcharge', () => {
            expect(powerController.getPowerCost()).toBe(POWER_BASE_COST + 2 * POWER_DISTANCE_RATE);
        });

        it('returns base cost only when no power stations exist', () => {
            const world = makeWorld();
            const ctrl = new PowerController(gameState$, new WorldService(world));
            expect(ctrl.getPowerCost()).toBe(POWER_BASE_COST);
        });

        it('returns base cost when standing on a power station', () => {
            gameState$.updateProperty('current_cell', { x: 0, y: 0, z: 0 });
            const world = makeWorld({ x: 0, y: 0, z: 0 });
            const ctrl = new PowerController(gameState$, new WorldService(world));
            expect(ctrl.getPowerCost()).toBe(POWER_BASE_COST);
        });

        it('scales with distance', () => {
            gameState$.updateProperty('current_cell', { x: 5, y: 0, z: 0 });
            // Power station at (2,0,0), distance = 3
            expect(powerController.getPowerCost()).toBe(POWER_BASE_COST + 3 * POWER_DISTANCE_RATE);
        });
    });

    describe('buyPower', () => {
        it('should deduct distance-based cost and increase power when affordable', () => {
            const cost = powerController.getPowerCost();
            gameState$.updateProperty('credits', cost + 100);

            const result = powerController.buyPower();
            const state = gameState$.getState();

            expect(result.success).toBe(true);
            expect(state.credits).toBe(100);
            expect(state.power).toBe(Math.min(80 + POWER_GAIN, 100));
        });

        it('should fail when credits insufficient for distance-adjusted cost', () => {
            const cost = powerController.getPowerCost();
            gameState$.updateProperty('credits', cost - 1);
            const result = powerController.buyPower();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('insufficient_credits');
            }
        });

        it('should fail when power is full', () => {
            gameState$.updateProperty('power', 100);
            const result = powerController.buyPower();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('power_full');
            }
        });

        it('should cap power at ship power_capacity', () => {
            gameState$.updateProperty('power', 95);
            gameState$.updateProperty('credits', 10000);
            const result = powerController.buyPower();

            if (result.success) {
                expect(result.newPower).toBe(100);
            }
            expect(gameState$.getState().power).toBe(100);
        });

        it('should not modify state when purchase fails', () => {
            gameState$.updateProperty('credits', 50);
            const initialState = gameState$.getState();

            powerController.buyPower();

            const finalState = gameState$.getState();
            expect(finalState.credits).toBe(initialState.credits);
            expect(finalState.power).toBe(initialState.power);
        });

        it('should return newPower on success', () => {
            gameState$.updateProperty('credits', 10000);
            const result = powerController.buyPower();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.newPower).toBe(Math.min(80 + POWER_GAIN, 100));
            }
        });
    });

    describe('canBuyPower', () => {
        it('should return true when affordable and not full', () => {
            const cost = powerController.getPowerCost();
            gameState$.updateProperty('credits', cost);
            gameState$.updateProperty('power_capacity', 100);
            gameState$.updateProperty('power', 99);

            expect(powerController.canBuyPower()).toBe(true);
        });

        it('should return false when credits insufficient for distance cost', () => {
            const cost = powerController.getPowerCost();
            gameState$.updateProperty('credits', cost - 1);
            expect(powerController.canBuyPower()).toBe(false);
        });

        it('should return false when power is full', () => {
            gameState$.updateProperty('power', 100);
            expect(powerController.canBuyPower()).toBe(false);
        });

        it('should return false when both credits insufficient and power full', () => {
            gameState$.setState({ credits: 50, power: 100 });
            expect(powerController.canBuyPower()).toBe(false);
        });
    });

    describe('getCurrentPower', () => {
        it('should return current power level', () => {
            expect(powerController.getCurrentPower()).toBe(80);

            gameState$.updateProperty('power', 50);
            expect(powerController.getCurrentPower()).toBe(50);
        });
    });

    describe('getMaxPower', () => {
        it('should return current ship power_capacity', () => {
            gameState$.setState({
                power_capacity: 120,
            });

            expect(powerController.getMaxPower()).toBe(120);
        });
    });
});

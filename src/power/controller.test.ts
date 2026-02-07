import { describe, it, expect, beforeEach } from 'vitest';
import { PowerController } from './controller';
import { StateObserver } from '../gamestate/observer';
import type { GameState } from '../gamestate/interfaces';
import { POWER_COST, POWER_GAIN } from './constants';

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
            tools_owned: []
        });
        powerController = new PowerController(gameState$);
    });

    describe('buyPower', () => {
        it('should deduct credits and increase power when affordable', () => {
            const result = powerController.buyPower();
            const state = gameState$.getState();

            expect(result.success).toBe(true);
            expect(state.credits).toBe(500 - POWER_COST);
            expect(state.power).toBe(Math.min(80 + POWER_GAIN, 100));
        });

        it('should fail when credits insufficient', () => {
            gameState$.updateProperty('credits', 50);
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
            const result = powerController.buyPower();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.newPower).toBe(Math.min(80 + POWER_GAIN, 100));
            }
        });
    });

    describe('canBuyPower', () => {
        it('should return true when affordable and not full', () => {
            gameState$.updateProperty('credits', 100);
            gameState$.updateProperty('power_capacity', 100);
            gameState$.updateProperty('power', 99);

            expect(powerController.canBuyPower()).toBe(true);
        });

        it('should return false when credits insufficient', () => {
            gameState$.updateProperty('credits', 50);
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

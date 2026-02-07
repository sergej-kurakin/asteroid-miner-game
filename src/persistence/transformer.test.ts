import { describe, it, expect } from 'vitest';
import { toSaveData, toGameState, createDefaultGameState } from './transformer';
import { DEFAULT_SAVE_DATA } from './constants';
import type { GameState } from '../gamestate/interfaces';

describe('transformer', () => {
    const createFullGameState = (overrides: Partial<GameState> = {}): GameState => ({
        credits: 1500,
        current_ship_level: 3,
        discovered_elements: ['Fe', 'Si'],
        inventory: { Fe: 50, Si: 20 },
        hold_capacity: 200,
        hold_used: 70,
        asteroid: { type: 'iron_nickel', size: 'medium', composition: { Fe: 60, Ni: 30, O: 10 }, totalYield: 100, miningTime: 3000, visualDiameter: 80 },
        is_mining: true,
        mining_progress: 0.5,
        power: 75,
        power_capacity: 150,
        equipped_tools: [{ toolId: 'laser_mk2', slot: 0 }],
        tools_owned: ['laser_mk2'],
        ...overrides
    });

    describe('toSaveData', () => {
        it('extracts persistent fields from GameState', () => {
            const state = createFullGameState();
            const saveData = toSaveData(state);

            expect(saveData.credits).toBe(1500);
            expect(saveData.current_ship_level).toBe(3);
            expect(saveData.discovered_elements).toEqual(['Fe', 'Si']);
            expect(saveData.inventory).toEqual({ Fe: 50, Si: 20 });
            expect(saveData.hold_capacity).toBe(200);
            expect(saveData.hold_used).toBe(70);
            expect(saveData.power).toBe(75);
            expect(saveData.power_capacity).toBe(150);
            expect(saveData.equipped_tools).toEqual([{ toolId: 'laser_mk2', slot: 0 }]);
            expect(saveData.tools_owned).toEqual(['laser_mk2']);
        });

        it('excludes transient fields', () => {
            const state = createFullGameState();
            const saveData = toSaveData(state);

            expect(saveData).not.toHaveProperty('asteroid');
            expect(saveData).not.toHaveProperty('is_mining');
            expect(saveData).not.toHaveProperty('mining_progress');
        });

        it('preserves zero values', () => {
            const state = createFullGameState({ credits: 0, hold_used: 0, power: 0 });
            const saveData = toSaveData(state);

            expect(saveData.credits).toBe(0);
            expect(saveData.hold_used).toBe(0);
            expect(saveData.power).toBe(0);
        });
    });

    describe('toGameState', () => {
        it('applies saved data to game state', () => {
            const state = toGameState({
                credits: 500,
                current_ship_level: 2,
                power: 80,
                power_capacity: 120
            });

            expect(state.credits).toBe(500);
            expect(state.current_ship_level).toBe(2);
            expect(state.power).toBe(80);
            expect(state.power_capacity).toBe(120);
        });

        it('uses defaults for missing fields', () => {
            const state = toGameState({});

            expect(state.credits).toBe(DEFAULT_SAVE_DATA.credits);
            expect(state.current_ship_level).toBe(DEFAULT_SAVE_DATA.current_ship_level);
            expect(state.hold_capacity).toBe(DEFAULT_SAVE_DATA.hold_capacity);
            expect(state.power).toBe(DEFAULT_SAVE_DATA.power);
            expect(state.power_capacity).toBe(DEFAULT_SAVE_DATA.power_capacity);
        });

        it('resets transient fields', () => {
            const state = toGameState({ credits: 100 });

            expect(state.asteroid).toBeNull();
            expect(state.is_mining).toBe(false);
            expect(state.mining_progress).toBe(0);
        });

        it('preserves zero values (unlike || operator)', () => {
            const state = toGameState({
                credits: 0,
                hold_used: 0,
                power: 0,
                current_ship_level: 1
            });

            expect(state.credits).toBe(0);
            expect(state.hold_used).toBe(0);
            expect(state.power).toBe(0);
            expect(state.current_ship_level).toBe(1);
        });

        it('preserves empty arrays', () => {
            const state = toGameState({
                discovered_elements: [],
                equipped_tools: [],
                tools_owned: []
            });

            expect(state.discovered_elements).toEqual([]);
            expect(state.equipped_tools).toEqual([]);
            expect(state.tools_owned).toEqual([]);
        });
    });

    describe('createDefaultGameState', () => {
        it('returns a valid default game state', () => {
            const state = createDefaultGameState();

            expect(state.credits).toBe(0);
            expect(state.current_ship_level).toBe(1);
            expect(state.discovered_elements).toEqual([]);
            expect(state.inventory).toEqual({});
            expect(state.hold_used).toBe(0);
            expect(state.hold_capacity).toBe(100);
            expect(state.asteroid).toBeNull();
            expect(state.is_mining).toBe(false);
            expect(state.mining_progress).toBe(0);
            expect(state.power).toBe(100);
            expect(state.power_capacity).toBe(100);
            expect(state.equipped_tools).toEqual([]);
            expect(state.tools_owned).toEqual([]);
        });
    });
});

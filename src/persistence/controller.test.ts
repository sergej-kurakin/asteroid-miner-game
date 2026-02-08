import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PersistenceController } from './controller';
import type { IGameStorage, SaveData } from './interfaces';
import type { GameState } from '../gamestate/interfaces';

describe('PersistenceController', () => {
    let mockStorage: IGameStorage;
    let controller: PersistenceController;

    const createGameState = (overrides: Partial<GameState> = {}): GameState => ({
        credits: 1000,
        current_ship_level: 2,
        discovered_elements: ['Fe'],
        inventory: { Fe: 30 },
        hold_capacity: 150,
        hold_used: 30,
        asteroid: null,
        is_mining: false,
        mining_progress: 0,
        power: 80,
        power_capacity: 120,
        equipped_tools: [],
        tools_owned: [],
        ...overrides
    });

    beforeEach(() => {
        mockStorage = {
            load: vi.fn().mockReturnValue(null),
            save: vi.fn()
        };
        controller = new PersistenceController(mockStorage);
    });

    describe('save', () => {
        it('converts state to save data and passes to storage', () => {
            const state = createGameState();
            controller.save(state);

            expect(mockStorage.save).toHaveBeenCalledOnce();
            const savedData = (mockStorage.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as SaveData;
            expect(savedData.credits).toBe(1000);
            expect(savedData.current_ship_level).toBe(2);
            expect(savedData).not.toHaveProperty('asteroid');
            expect(savedData).not.toHaveProperty('is_mining');
        });
    });

    describe('load', () => {
        it('returns game state from storage data', () => {
            (mockStorage.load as ReturnType<typeof vi.fn>).mockReturnValue({
                credits: 500,
                current_ship_level: 3,
                discovered_elements: ['Fe', 'Si'],
                inventory: { Fe: 50 },
                hold_used: 50,
                hold_capacity: 200,
                power: 90,
                power_capacity: 150,
                equipped_tools: [{ toolId: 'laser_mk2', slot: 0 }],
                tools_owned: ['laser_mk2']
            } satisfies SaveData);

            const state = controller.load();

            expect(state.credits).toBe(500);
            expect(state.current_ship_level).toBe(3);
            expect(state.asteroid).toBeNull();
            expect(state.is_mining).toBe(false);
            expect(state.mining_progress).toBe(0);
        });

        it('returns default state when storage is empty', () => {
            (mockStorage.load as ReturnType<typeof vi.fn>).mockReturnValue(null);

            const state = controller.load();

            expect(state.credits).toBe(0);
            expect(state.current_ship_level).toBe(1);
            expect(state.hold_capacity).toBe(100);
            expect(state.power).toBe(100);
            expect(state.power_capacity).toBe(100);
        });

        it('applies defaults for partial save data', () => {
            (mockStorage.load as ReturnType<typeof vi.fn>).mockReturnValue({
                credits: 200
            });

            const state = controller.load();

            expect(state.credits).toBe(200);
            expect(state.current_ship_level).toBe(1);
            expect(state.hold_capacity).toBe(100);
        });
    });
});

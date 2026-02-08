import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolController } from './controller';
import { StateObserver } from '../gamestate/observer';
import type { GameState } from '../gamestate/interfaces';
import type { IShipController, ShipData } from '../ships/interfaces';

describe('ToolController', () => {
    let state$: StateObserver<GameState>;
    let mockShipController: IShipController;
    let controller: ToolController;

    const createInitialState = (overrides: Partial<GameState> = {}): GameState => ({
        credits: 5000,
        current_ship_level: 2,
        discovered_elements: [],
        inventory: {},
        hold_capacity: 150,
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

    const createMockShipController = (toolSlots = 2): IShipController => ({
        getCurrentShip: vi.fn().mockReturnValue({ toolSlots } as ShipData),
        getNextShip: vi.fn(),
        canAffordUpgrade: vi.fn(),
        isMaxLevel: vi.fn(),
        upgrade: vi.fn(),
        getLevel: vi.fn().mockReturnValue(2),
        getMiningTime: vi.fn().mockReturnValue(2500),
        getToolSlots: vi.fn().mockReturnValue(toolSlots)
    });

    beforeEach(() => {
        state$ = new StateObserver(createInitialState());
        mockShipController = createMockShipController();
        controller = new ToolController(state$, mockShipController);
    });

    describe('buyTool', () => {
        it('should buy a tool when credits are sufficient', () => {
            const result = controller.buyTool('precision_cutter');

            expect(result.success).toBe(true);
            expect(state$.getState().credits).toBe(4500); // 5000 - 500
            expect(state$.getState().tools_owned).toContain('precision_cutter');
        });

        it('should fail when credits are insufficient', () => {
            state$.updateProperty('credits', 100);

            const result = controller.buyTool('precision_cutter');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('insufficient_credits');
            }
            expect(state$.getState().credits).toBe(100);
        });

        it('should fail when tool is already owned', () => {
            controller.buyTool('precision_cutter');
            const result = controller.buyTool('precision_cutter');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('already_owned');
            }
        });

        it('should fail for invalid tool id', () => {
            const result = controller.buyTool('nonexistent_tool');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('insufficient_credits');
            }
        });
    });

    describe('equipTool', () => {
        it('should equip an owned tool to a valid slot', () => {
            controller.buyTool('precision_cutter');

            const result = controller.equipTool('precision_cutter', 0);

            expect(result.success).toBe(true);
            const equipped = controller.getEquippedTools();
            expect(equipped).toHaveLength(1);
            expect(equipped[0].toolId).toBe('precision_cutter');
            expect(equipped[0].slot).toBe(0);
        });

        it('should equip standard_drill without buying', () => {
            const result = controller.equipTool('standard_drill', 0);

            expect(result.success).toBe(true);
        });

        it('should fail when tool is not owned', () => {
            const result = controller.equipTool('precision_cutter', 0);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('not_owned');
            }
        });

        it('should fail when slot is out of range', () => {
            controller.buyTool('precision_cutter');

            const result = controller.equipTool('precision_cutter', 5);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('no_slot_available');
            }
        });

        it('should fail when tool is already equipped', () => {
            controller.buyTool('precision_cutter');
            controller.equipTool('precision_cutter', 0);

            const result = controller.equipTool('precision_cutter', 1);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('already_equipped');
            }
        });

        it('should replace tool in occupied slot', () => {
            controller.buyTool('precision_cutter');
            controller.buyTool('resonance_probe');
            controller.equipTool('precision_cutter', 0);

            const result = controller.equipTool('resonance_probe', 0);

            expect(result.success).toBe(true);
            const equipped = controller.getEquippedTools();
            expect(equipped).toHaveLength(1);
            expect(equipped[0].toolId).toBe('resonance_probe');
        });
    });

    describe('unequipTool', () => {
        it('should remove tool from slot', () => {
            controller.buyTool('precision_cutter');
            controller.equipTool('precision_cutter', 0);

            controller.unequipTool(0);

            expect(controller.getEquippedTools()).toHaveLength(0);
        });

        it('should do nothing for empty slot', () => {
            controller.unequipTool(0);

            expect(controller.getEquippedTools()).toHaveLength(0);
        });
    });

    describe('getToolBonuses', () => {
        it('should return default bonuses with no tools equipped', () => {
            const bonuses = controller.getToolBonuses();

            expect(bonuses.yieldMultiplier).toBe(1.0);
            expect(bonuses.rareMultiplier).toBe(1.0);
            expect(bonuses.powerCostMultiplier).toBe(1.0);
        });

        it('should sum bonuses from equipped tools', () => {
            controller.buyTool('precision_cutter');
            controller.buyTool('resonance_probe');
            controller.equipTool('precision_cutter', 0);
            controller.equipTool('resonance_probe', 1);

            const bonuses = controller.getToolBonuses();

            // Precision Cutter: +10% yield, +5% rare, +10% power
            // Resonance Probe: +5% yield, +10% rare, +15% power
            expect(bonuses.yieldMultiplier).toBeCloseTo(1.15);
            expect(bonuses.rareMultiplier).toBeCloseTo(1.15);
            expect(bonuses.powerCostMultiplier).toBeCloseTo(1.25);
        });

        it('should handle negative bonuses', () => {
            controller.buyTool('power_hammer');
            controller.equipTool('power_hammer', 0);

            const bonuses = controller.getToolBonuses();

            // Power Hammer: +20% yield, -5% rare, +30% power
            expect(bonuses.yieldMultiplier).toBeCloseTo(1.20);
            expect(bonuses.rareMultiplier).toBeCloseTo(0.95);
            expect(bonuses.powerCostMultiplier).toBeCloseTo(1.30);
        });

        it('should exclude tools in slots beyond ship capacity', () => {
            // Start with 2-slot ship, equip 2 tools
            controller.buyTool('precision_cutter');
            controller.buyTool('resonance_probe');
            controller.equipTool('precision_cutter', 0);
            controller.equipTool('resonance_probe', 1);

            // Downgrade to 1-slot ship
            (mockShipController.getToolSlots as ReturnType<typeof vi.fn>).mockReturnValue(1);

            const bonuses = controller.getToolBonuses();

            // Only precision_cutter (slot 0) should count
            expect(bonuses.yieldMultiplier).toBeCloseTo(1.10);
            expect(bonuses.rareMultiplier).toBeCloseTo(1.05);
        });
    });

    describe('getAvailableSlots', () => {
        it('should return max slots when nothing equipped', () => {
            expect(controller.getAvailableSlots()).toBe(2);
        });

        it('should decrease when tools are equipped', () => {
            controller.buyTool('precision_cutter');
            controller.equipTool('precision_cutter', 0);

            expect(controller.getAvailableSlots()).toBe(1);
        });
    });

    describe('isToolOwned', () => {
        it('should return true for standard_drill always', () => {
            expect(controller.isToolOwned('standard_drill')).toBe(true);
        });

        it('should return false for unowned tools', () => {
            expect(controller.isToolOwned('precision_cutter')).toBe(false);
        });

        it('should return true after buying', () => {
            controller.buyTool('precision_cutter');
            expect(controller.isToolOwned('precision_cutter')).toBe(true);
        });
    });

    describe('isToolEquipped', () => {
        it('should return false when not equipped', () => {
            expect(controller.isToolEquipped('precision_cutter')).toBe(false);
        });

        it('should return true when equipped', () => {
            controller.buyTool('precision_cutter');
            controller.equipTool('precision_cutter', 0);

            expect(controller.isToolEquipped('precision_cutter')).toBe(true);
        });
    });

    describe('getToolData', () => {
        it('should return tool data for valid id', () => {
            const tool = controller.getToolData('precision_cutter');
            expect(tool).toBeDefined();
            expect(tool!.name).toBe('Precision Cutter');
            expect(tool!.cost).toBe(500);
        });

        it('should return undefined for invalid id', () => {
            expect(controller.getToolData('invalid')).toBeUndefined();
        });
    });

    describe('getAllTools', () => {
        it('should return all 10 tools', () => {
            expect(controller.getAllTools()).toHaveLength(10);
        });
    });
});

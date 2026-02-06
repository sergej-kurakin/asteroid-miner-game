// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ToolPanel, type ToolPanelHandlers } from './tool-panel';
import { StateObserver } from '../../gamestate/observer';
import type { GameState } from '../../gamestate';
import type { IToolController } from '../../tools/interfaces';
import { TOOLS } from '../../tools/constants';

describe('ToolPanel', () => {
    let state$: StateObserver<GameState>;
    let mockController: IToolController;
    let handlers: ToolPanelHandlers;
    let toolPanel: ToolPanel;

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
        ...overrides
    });

    beforeEach(() => {
        document.body.innerHTML = '<div id="tool-panel"></div>';
        state$ = new StateObserver(createInitialState());
        mockController = {
            buyTool: vi.fn().mockReturnValue({ success: true }),
            equipTool: vi.fn().mockReturnValue({ success: true }),
            unequipTool: vi.fn(),
            getEquippedTools: vi.fn().mockReturnValue([]),
            getOwnedTools: vi.fn().mockReturnValue([]),
            getToolBonuses: vi.fn().mockReturnValue({
                yieldMultiplier: 1.0,
                rareMultiplier: 1.0,
                powerCostMultiplier: 1.0
            }),
            getAvailableSlots: vi.fn().mockReturnValue(2),
            isToolOwned: vi.fn().mockReturnValue(false),
            isToolEquipped: vi.fn().mockReturnValue(false),
            getToolData: vi.fn().mockImplementation((id: string) =>
                TOOLS.find(t => t.id === id)
            ),
            getAllTools: vi.fn().mockReturnValue(TOOLS)
        };
        handlers = {
            onBuy: vi.fn() as unknown as (toolId: string) => void,
            onEquip: vi.fn() as unknown as (toolId: string, slot: number) => void,
            onUnequip: vi.fn() as unknown as (slot: number) => void
        };
        toolPanel = new ToolPanel(state$, mockController, handlers);
    });

    afterEach(() => {
        toolPanel.destroy();
        document.body.innerHTML = '';
    });

    describe('mount()', () => {
        it('renders tool panel content', () => {
            toolPanel.mount();

            const el = document.getElementById('tool-panel');
            expect(el?.innerHTML).toContain('Equipped Tools');
            expect(el?.innerHTML).toContain('Tool Shop');
        });

        it('shows empty slots', () => {
            toolPanel.mount();

            const el = document.getElementById('tool-panel');
            expect(el?.innerHTML).toContain('Slot 1 - Empty');
            expect(el?.innerHTML).toContain('Slot 2 - Empty');
        });
    });

    describe('tool shop', () => {
        it('shows buy buttons for unowned tools', () => {
            toolPanel.mount();

            const el = document.getElementById('tool-panel');
            expect(el?.innerHTML).toContain('Buy');
            expect(el?.innerHTML).toContain('Precision Cutter');
        });

        it('shows equip button for owned tools', () => {
            (mockController.isToolOwned as ReturnType<typeof vi.fn>).mockImplementation(
                (id: string) => id === 'precision_cutter'
            );
            toolPanel.mount();

            const el = document.getElementById('tool-panel');
            const equipBtns = el?.querySelectorAll('[data-action="equip"]');
            expect(equipBtns?.length).toBeGreaterThan(0);
        });

        it('shows "Equipped" status for equipped tools', () => {
            (mockController.isToolOwned as ReturnType<typeof vi.fn>).mockImplementation(
                (id: string) => id === 'precision_cutter'
            );
            (mockController.isToolEquipped as ReturnType<typeof vi.fn>).mockImplementation(
                (id: string) => id === 'precision_cutter'
            );
            toolPanel.mount();

            const el = document.getElementById('tool-panel');
            expect(el?.innerHTML).toContain('Equipped');
        });

        it('shows tier labels', () => {
            toolPanel.mount();

            const el = document.getElementById('tool-panel');
            expect(el?.innerHTML).toContain('Tier 1');
            expect(el?.innerHTML).toContain('Tier 2');
            expect(el?.innerHTML).toContain('Tier 3');
        });
    });

    describe('equipped slots', () => {
        it('shows equipped tool name in slot', () => {
            (mockController.getEquippedTools as ReturnType<typeof vi.fn>).mockReturnValue([
                { toolId: 'precision_cutter', slot: 0 }
            ]);
            (mockController.getAvailableSlots as ReturnType<typeof vi.fn>).mockReturnValue(1);
            toolPanel.mount();

            const el = document.getElementById('tool-panel');
            expect(el?.querySelector('.tool-slot-filled')).not.toBeNull();
            expect(el?.innerHTML).toContain('Precision Cutter');
        });

        it('shows unequip button for equipped tools', () => {
            (mockController.getEquippedTools as ReturnType<typeof vi.fn>).mockReturnValue([
                { toolId: 'precision_cutter', slot: 0 }
            ]);
            (mockController.getAvailableSlots as ReturnType<typeof vi.fn>).mockReturnValue(1);
            toolPanel.mount();

            const el = document.getElementById('tool-panel');
            const unequipBtn = el?.querySelector('[data-action="unequip"]');
            expect(unequipBtn).not.toBeNull();
        });
    });

    describe('button interactions', () => {
        it('calls onBuy when buy button is clicked', () => {
            toolPanel.mount();

            const buyBtn = document.querySelector('[data-action="buy"]') as HTMLButtonElement;
            if (buyBtn) {
                buyBtn.click();
                expect(handlers.onBuy).toHaveBeenCalled();
            }
        });

        it('calls onUnequip when unequip button is clicked', () => {
            (mockController.getEquippedTools as ReturnType<typeof vi.fn>).mockReturnValue([
                { toolId: 'precision_cutter', slot: 0 }
            ]);
            (mockController.getAvailableSlots as ReturnType<typeof vi.fn>).mockReturnValue(1);
            toolPanel.mount();

            const unequipBtn = document.querySelector('[data-action="unequip"]') as HTMLButtonElement;
            if (unequipBtn) {
                unequipBtn.click();
                expect(handlers.onUnequip).toHaveBeenCalledWith(0);
            }
        });
    });

    describe('reactive updates', () => {
        it('re-renders when credits change', () => {
            toolPanel.mount();

            const el = document.getElementById('tool-panel');
            const initialHtml = el?.innerHTML;

            state$.updateProperty('credits', 100);

            // Should re-render (may disable buy buttons)
            expect(el?.innerHTML).not.toBe(initialHtml);
        });

        it('re-renders when equipped_tools change', () => {
            toolPanel.mount();

            // After updating equipped_tools, the mock should return the new equipped tool
            (mockController.getEquippedTools as ReturnType<typeof vi.fn>).mockReturnValue([
                { toolId: 'precision_cutter', slot: 0 }
            ]);
            (mockController.getAvailableSlots as ReturnType<typeof vi.fn>).mockReturnValue(1);
            (mockController.isToolEquipped as ReturnType<typeof vi.fn>).mockImplementation(
                (id: string) => id === 'precision_cutter'
            );

            state$.updateProperty('equipped_tools', [{ toolId: 'precision_cutter', slot: 0 }]);

            const el = document.getElementById('tool-panel');
            expect(el?.querySelector('.tool-slot-filled')).not.toBeNull();
            expect(el?.innerHTML).toContain('Precision Cutter');
        });
    });

    describe('destroy()', () => {
        it('does not throw', () => {
            toolPanel.mount();
            expect(() => toolPanel.destroy()).not.toThrow();
        });
    });

    describe('handles missing DOM gracefully', () => {
        it('does not throw when DOM element is missing', () => {
            document.body.innerHTML = '';
            const panel = new ToolPanel(state$, mockController, handlers);

            expect(() => {
                panel.mount();
                state$.updateProperty('credits', 100);
            }).not.toThrow();

            panel.destroy();
        });
    });
});

// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ShipInfo } from './ship-info';
import { StateObserver } from '../../gamestate/observer';
import type { GameState } from '../../gamestate';
import type { IShipController, ShipData } from '../../ships';

describe('ShipInfo', () => {
    let state$: StateObserver<GameState>;
    let mockController: IShipController;
    let onUpgrade: () => void;
    let shipInfo: ShipInfo;

    const createMockShip = (overrides: Partial<ShipData> = {}): ShipData => ({
        id: 1,
        name: 'Scout',
        holdCapacity: 50,
        powerCell: 100,
        miningTime: 3000,
        toolSlots: 1,
        cost: 0,
        special: 'Basic mining ship',
        ...overrides,
    });

    const createInitialState = (overrides: Partial<GameState> = {}): GameState => ({
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
        ...overrides,
    });

    const setupDOM = () => {
        document.body.innerHTML = '<div id="ship-info"></div>';
    };

    beforeEach(() => {
        setupDOM();
        state$ = new StateObserver<GameState>(createInitialState());
        mockController = {
            getCurrentShip: vi.fn().mockReturnValue(createMockShip()),
            getNextShip: vi.fn().mockReturnValue(createMockShip({
                id: 2,
                name: 'Prospector',
                holdCapacity: 100,
                miningTime: 2500,
                toolSlots: 2,
                cost: 2000,
            })),
            canAffordUpgrade: vi.fn().mockReturnValue(false),
            isMaxLevel: vi.fn().mockReturnValue(false),
            upgrade: vi.fn(),
            getLevel: vi.fn().mockReturnValue(1),
            getMiningTime: vi.fn().mockReturnValue(3000),
            getToolSlots: vi.fn().mockReturnValue(1),
            calculateMoveCost: vi.fn().mockReturnValue(20),
            travel: vi.fn(),
        };
        onUpgrade = vi.fn() as () => void;
        shipInfo = new ShipInfo(state$, mockController, onUpgrade);
    });

    afterEach(() => {
        shipInfo.destroy();
        document.body.innerHTML = '';
    });

    describe('mount()', () => {
        it('acquires DOM element reference', () => {
            shipInfo.mount();

            const el = document.getElementById('ship-info');
            expect(el?.innerHTML).toContain('Scout');
        });

        it('renders initial ship info', () => {
            shipInfo.mount();

            const el = document.getElementById('ship-info');
            expect(el?.innerHTML).toContain('Level 1');
        });
    });

    describe('render() - current ship', () => {
        beforeEach(() => {
            shipInfo.mount();
        });

        it('displays ship level', () => {
            const el = document.getElementById('ship-info');
            expect(el?.innerHTML).toContain('Level 1');
        });

        it('displays ship name', () => {
            const el = document.getElementById('ship-info');
            expect(el?.innerHTML).toContain('Scout');
        });

        it('displays hold capacity', () => {
            const el = document.getElementById('ship-info');
            expect(el?.innerHTML).toContain('50 units');
        });

        it('displays mining speed in seconds', () => {
            const el = document.getElementById('ship-info');
            expect(el?.innerHTML).toContain('3.0s');
        });

        it('displays tool slots', () => {
            const el = document.getElementById('ship-info');
            expect(el?.querySelector('.ship-stats')?.innerHTML).toContain('1');
        });
    });

    describe('render() - upgrade section', () => {
        beforeEach(() => {
            shipInfo.mount();
        });

        it('displays next ship name', () => {
            const el = document.getElementById('ship-info');
            expect(el?.innerHTML).toContain('Prospector');
        });

        it('displays next ship stats', () => {
            const el = document.getElementById('ship-info');
            expect(el?.innerHTML).toContain('100'); // hold capacity
            expect(el?.innerHTML).toContain('2.5s'); // mining time
        });

        it('displays upgrade cost formatted', () => {
            const el = document.getElementById('ship-info');
            // Check for the value regardless of locale-specific formatting
            expect(el?.textContent).toContain('2');
            expect(el?.textContent).toContain('000');
            expect(el?.textContent).toContain('cr');
        });

        it('shows upgrade button', () => {
            const btn = document.getElementById('btn-upgrade-ship');
            expect(btn).not.toBeNull();
        });

        it('disables upgrade button when cannot afford', () => {
            state$.updateProperty('credits', 100);

            const btn = document.getElementById('btn-upgrade-ship') as HTMLButtonElement;
            expect(btn.disabled).toBe(true);
            expect(btn.classList.contains('unaffordable')).toBe(true);
        });

        it('enables upgrade button when can afford', () => {
            state$.updateProperty('credits', 5000);

            const btn = document.getElementById('btn-upgrade-ship') as HTMLButtonElement;
            expect(btn.disabled).toBe(false);
            expect(btn.classList.contains('affordable')).toBe(true);
        });
    });

    describe('render() - max level', () => {
        beforeEach(() => {
            mockController.getNextShip = vi.fn().mockReturnValue(undefined);
            shipInfo.mount();
        });

        it('shows max level message when no next ship', () => {
            const el = document.getElementById('ship-info');
            expect(el?.innerHTML).toContain('Maximum Ship Level Reached');
        });

        it('does not show upgrade button', () => {
            const btn = document.getElementById('btn-upgrade-ship');
            expect(btn).toBeNull();
        });
    });

    describe('upgrade button click', () => {
        beforeEach(() => {
            state$ = new StateObserver<GameState>(createInitialState({ credits: 5000 }));
            shipInfo = new ShipInfo(state$, mockController, onUpgrade);
            shipInfo.mount();
        });

        it('calls onUpgrade when clicked', () => {
            const btn = document.getElementById('btn-upgrade-ship') as HTMLButtonElement;
            btn.click();

            expect(onUpgrade).toHaveBeenCalledTimes(1);
        });
    });

    describe('reactive updates', () => {
        beforeEach(() => {
            shipInfo.mount();
        });

        it('updates when credits change', () => {
            let btn = document.getElementById('btn-upgrade-ship') as HTMLButtonElement;
            expect(btn.disabled).toBe(true);

            state$.updateProperty('credits', 5000);

            btn = document.getElementById('btn-upgrade-ship') as HTMLButtonElement;
            expect(btn.disabled).toBe(false);
        });

        it('updates when ship level changes', () => {
            mockController.getCurrentShip = vi.fn().mockReturnValue(createMockShip({
                id: 2,
                name: 'Prospector',
            }));

            state$.updateProperty('current_ship_level', 2);

            const el = document.getElementById('ship-info');
            expect(el?.innerHTML).toContain('Prospector');
            expect(el?.innerHTML).toContain('Level 2');
        });

        it('cleans up old upgrade button listener on re-render', () => {
            state$.updateProperty('credits', 5000);

            // First button should work
            let btn = document.getElementById('btn-upgrade-ship') as HTMLButtonElement;
            btn.click();
            expect(onUpgrade).toHaveBeenCalledTimes(1);

            // Trigger re-render
            state$.updateProperty('credits', 6000);

            // New button should work
            btn = document.getElementById('btn-upgrade-ship') as HTMLButtonElement;
            btn.click();
            expect(onUpgrade).toHaveBeenCalledTimes(2);
        });
    });

    describe('destroy()', () => {
        it('cleans up upgrade button listener', () => {
            state$ = new StateObserver<GameState>(createInitialState({ credits: 5000 }));
            shipInfo = new ShipInfo(state$, mockController, onUpgrade);
            shipInfo.mount();

            shipInfo.destroy();

            const btn = document.getElementById('btn-upgrade-ship') as HTMLButtonElement;
            btn?.click();

            expect(onUpgrade).not.toHaveBeenCalled();
        });
    });

    describe('handles missing DOM elements gracefully', () => {
        it('does not throw when DOM element is missing', () => {
            document.body.innerHTML = '';
            const infoWithoutDOM = new ShipInfo(state$, mockController, onUpgrade);

            expect(() => {
                infoWithoutDOM.mount();
                state$.updateProperty('credits', 5000);
            }).not.toThrow();

            infoWithoutDOM.destroy();
        });
    });
});

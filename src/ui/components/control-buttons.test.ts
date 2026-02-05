// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ControlButtons, ControlHandlers } from './control-buttons';
import { StateObserver } from '../../gamestate/observer';
import type { GameState } from '../../gamestate';
import type { IAsteroidsController } from '../../asteroids';
import type { Asteroid } from '../../asteroids/interfaces';

describe('ControlButtons', () => {
    let state$: StateObserver<GameState>;
    let mockController: IAsteroidsController;
    let mockHandlers: ControlHandlers;
    let buttons: ControlButtons;

    const createMockAsteroid = (): Asteroid => ({
        type: 'iron_nickel',
        size: 'medium',
        composition: { Fe: 60, Ni: 30, Co: 10 },
        totalYield: 100,
        miningTime: 5000,
        visualDiameter: 80,
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
        ...overrides,
    });

    const setupDOM = () => {
        document.body.innerHTML = `
            <button id="btn-scan"></button>
            <button id="btn-mine"></button>
            <button id="btn-abandon"></button>
        `;
    };

    beforeEach(() => {
        setupDOM();
        state$ = new StateObserver<GameState>(createInitialState());
        mockController = {
            scan: vi.fn(),
            abandon: vi.fn(),
            canScan: vi.fn().mockReturnValue(true),
            canAbandon: vi.fn().mockReturnValue(false),
            getCurrentAsteroid: vi.fn().mockReturnValue(null),
        };
        mockHandlers = {
            onScan: vi.fn(),
            onMine: vi.fn(),
            onAbandon: vi.fn(),
        };
        buttons = new ControlButtons(state$, mockController, mockHandlers);
    });

    afterEach(() => {
        buttons.destroy();
        document.body.innerHTML = '';
    });

    describe('mount()', () => {
        it('acquires DOM element references', () => {
            buttons.mount();

            const scanBtn = document.getElementById('btn-scan') as HTMLButtonElement;
            const mineBtn = document.getElementById('btn-mine') as HTMLButtonElement;
            const abandonBtn = document.getElementById('btn-abandon') as HTMLButtonElement;

            expect(scanBtn).not.toBeNull();
            expect(mineBtn).not.toBeNull();
            expect(abandonBtn).not.toBeNull();
        });

        it('renders initial button states', () => {
            buttons.mount();

            const scanBtn = document.getElementById('btn-scan') as HTMLButtonElement;
            expect(scanBtn.disabled).toBe(false); // canScan returns true
        });
    });

    describe('scan button', () => {
        beforeEach(() => {
            buttons.mount();
        });

        it('enabled when canScan returns true', () => {
            mockController.canScan = vi.fn().mockReturnValue(true);
            state$.updateProperty('asteroid', null); // trigger re-render

            const btn = document.getElementById('btn-scan') as HTMLButtonElement;
            expect(btn.disabled).toBe(false);
        });

        it('disabled when canScan returns false', () => {
            mockController.canScan = vi.fn().mockReturnValue(false);
            state$.updateProperty('asteroid', null); // trigger re-render

            const btn = document.getElementById('btn-scan') as HTMLButtonElement;
            expect(btn.disabled).toBe(true);
        });

        it('calls onScan handler when clicked', () => {
            const btn = document.getElementById('btn-scan') as HTMLButtonElement;
            btn.click();

            expect(mockHandlers.onScan).toHaveBeenCalledTimes(1);
        });
    });

    describe('mine button', () => {
        beforeEach(() => {
            buttons.mount();
        });

        it('disabled when no asteroid', () => {
            const btn = document.getElementById('btn-mine') as HTMLButtonElement;
            expect(btn.disabled).toBe(true);
        });

        it('enabled when asteroid present and not mining', () => {
            state$.setState({
                asteroid: createMockAsteroid(),
                is_mining: false,
                power: 100
            });

            const btn = document.getElementById('btn-mine') as HTMLButtonElement;
            expect(btn.disabled).toBe(false);
        });

        it('disabled when already mining', () => {
            state$.setState({
                asteroid: createMockAsteroid(),
                is_mining: true,
                power: 100
            });

            const btn = document.getElementById('btn-mine') as HTMLButtonElement;
            expect(btn.disabled).toBe(true);
        });

        it('disabled when power is low', () => {
            state$.setState({
                asteroid: createMockAsteroid(),
                is_mining: false,
                power: 5 // less than 10
            });

            const btn = document.getElementById('btn-mine') as HTMLButtonElement;
            expect(btn.disabled).toBe(true);
        });

        it('enabled when power is exactly 10', () => {
            state$.setState({
                asteroid: createMockAsteroid(),
                is_mining: false,
                power: 10
            });

            const btn = document.getElementById('btn-mine') as HTMLButtonElement;
            expect(btn.disabled).toBe(false);
        });

        it('calls onMine handler when clicked', () => {
            state$.setState({
                asteroid: createMockAsteroid(),
                is_mining: false,
                power: 100
            });

            const btn = document.getElementById('btn-mine') as HTMLButtonElement;
            btn.click();

            expect(mockHandlers.onMine).toHaveBeenCalledTimes(1);
        });
    });

    describe('abandon button', () => {
        beforeEach(() => {
            buttons.mount();
        });

        it('disabled when canAbandon returns false', () => {
            mockController.canAbandon = vi.fn().mockReturnValue(false);
            state$.updateProperty('asteroid', null); // trigger re-render

            const btn = document.getElementById('btn-abandon') as HTMLButtonElement;
            expect(btn.disabled).toBe(true);
        });

        it('enabled when canAbandon returns true', () => {
            mockController.canAbandon = vi.fn().mockReturnValue(true);
            state$.updateProperty('asteroid', createMockAsteroid()); // trigger re-render

            const btn = document.getElementById('btn-abandon') as HTMLButtonElement;
            expect(btn.disabled).toBe(false);
        });

        it('calls onAbandon handler when clicked', () => {
            mockController.canAbandon = vi.fn().mockReturnValue(true);
            state$.updateProperty('asteroid', createMockAsteroid());

            const btn = document.getElementById('btn-abandon') as HTMLButtonElement;
            btn.click();

            expect(mockHandlers.onAbandon).toHaveBeenCalledTimes(1);
        });
    });

    describe('reactive updates', () => {
        beforeEach(() => {
            buttons.mount();
        });

        it('updates buttons when asteroid state changes', () => {
            const mineBtn = document.getElementById('btn-mine') as HTMLButtonElement;
            expect(mineBtn.disabled).toBe(true);

            state$.updateProperty('asteroid', createMockAsteroid());
            expect(mineBtn.disabled).toBe(false);
        });

        it('updates buttons when is_mining changes', () => {
            state$.updateProperty('asteroid', createMockAsteroid());

            const mineBtn = document.getElementById('btn-mine') as HTMLButtonElement;
            expect(mineBtn.disabled).toBe(false);

            state$.updateProperty('is_mining', true);
            expect(mineBtn.disabled).toBe(true);
        });

        it('updates buttons when power changes', () => {
            state$.setState({
                asteroid: createMockAsteroid(),
                power: 5
            });

            const mineBtn = document.getElementById('btn-mine') as HTMLButtonElement;
            expect(mineBtn.disabled).toBe(true);

            state$.updateProperty('power', 50);
            expect(mineBtn.disabled).toBe(false);
        });
    });

    describe('destroy()', () => {
        it('removes event listeners', () => {
            buttons.mount();
            buttons.destroy();

            const scanBtn = document.getElementById('btn-scan') as HTMLButtonElement;
            scanBtn.click();

            expect(mockHandlers.onScan).not.toHaveBeenCalled();
        });

        it('removes all button listeners', () => {
            buttons.mount();
            buttons.destroy();

            const mineBtn = document.getElementById('btn-mine') as HTMLButtonElement;
            const abandonBtn = document.getElementById('btn-abandon') as HTMLButtonElement;

            mineBtn.click();
            abandonBtn.click();

            expect(mockHandlers.onMine).not.toHaveBeenCalled();
            expect(mockHandlers.onAbandon).not.toHaveBeenCalled();
        });
    });

    describe('handles missing DOM elements gracefully', () => {
        it('does not throw when DOM elements are missing', () => {
            document.body.innerHTML = '';
            const buttonsWithoutDOM = new ControlButtons(state$, mockController, mockHandlers);

            expect(() => {
                buttonsWithoutDOM.mount();
                state$.updateProperty('asteroid', createMockAsteroid());
            }).not.toThrow();

            buttonsWithoutDOM.destroy();
        });
    });
});

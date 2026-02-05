// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PowerButton } from './power-button';
import { StateObserver } from '../../gamestate/observer';
import type { GameState } from '../../gamestate';
import type { IPowerController } from '../../power';

describe('PowerButton', () => {
    let state$: StateObserver<GameState>;
    let mockController: IPowerController;
    let onBuyPower: () => void;
    let button: PowerButton;

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
        power: 50,
        power_capacity: 100,
        ...overrides,
    });

    const setupDOM = () => {
        document.body.innerHTML = `
            <span id="power-current"></span>
            <span id="power-max"></span>
            <button id="btn-buy-power"></button>
        `;
    };

    beforeEach(() => {
        setupDOM();
        state$ = new StateObserver<GameState>(createInitialState());
        mockController = {
            buyPower: vi.fn(),
            canBuyPower: vi.fn().mockReturnValue(true),
            getCurrentPower: vi.fn().mockReturnValue(50),
            getMaxPower: vi.fn().mockReturnValue(100),
        };
        onBuyPower = vi.fn() as () => void;
        button = new PowerButton(state$, mockController, onBuyPower);
    });

    afterEach(() => {
        button.destroy();
        document.body.innerHTML = '';
    });

    describe('mount()', () => {
        it('acquires DOM element references', () => {
            button.mount();

            const currentEl = document.getElementById('power-current');
            const maxEl = document.getElementById('power-max');
            const btnEl = document.getElementById('btn-buy-power');

            expect(currentEl).not.toBeNull();
            expect(maxEl).not.toBeNull();
            expect(btnEl).not.toBeNull();
        });

        it('renders initial power values', () => {
            button.mount();

            const currentEl = document.getElementById('power-current');
            const maxEl = document.getElementById('power-max');

            expect(currentEl?.textContent).toBe('50');
            expect(maxEl?.textContent).toBe('100');
        });
    });

    describe('render()', () => {
        beforeEach(() => {
            button.mount();
        });

        it('displays current power', () => {
            state$.updateProperty('power', 75);

            const currentEl = document.getElementById('power-current');
            expect(currentEl?.textContent).toBe('75');
        });

        it('rounds power value', () => {
            state$.updateProperty('power', 33.7);

            const currentEl = document.getElementById('power-current');
            expect(currentEl?.textContent).toBe('34');
        });

        it('displays power capacity', () => {
            state$.updateProperty('power_capacity', 200);

            const maxEl = document.getElementById('power-max');
            expect(maxEl?.textContent).toBe('200');
        });

        it('enables button when canBuyPower returns true', () => {
            mockController.canBuyPower = vi.fn().mockReturnValue(true);
            state$.updateProperty('power', 50); // trigger re-render

            const btn = document.getElementById('btn-buy-power') as HTMLButtonElement;
            expect(btn.disabled).toBe(false);
        });

        it('disables button when canBuyPower returns false', () => {
            mockController.canBuyPower = vi.fn().mockReturnValue(false);
            state$.updateProperty('power', 50); // trigger re-render

            const btn = document.getElementById('btn-buy-power') as HTMLButtonElement;
            expect(btn.disabled).toBe(true);
        });

        it('adds affordable class when can buy', () => {
            mockController.canBuyPower = vi.fn().mockReturnValue(true);
            state$.updateProperty('power', 50); // trigger re-render

            const btn = document.getElementById('btn-buy-power') as HTMLButtonElement;
            expect(btn.classList.contains('affordable')).toBe(true);
            expect(btn.classList.contains('unaffordable')).toBe(false);
        });

        it('adds unaffordable class when cannot buy', () => {
            mockController.canBuyPower = vi.fn().mockReturnValue(false);
            state$.updateProperty('power', 50); // trigger re-render

            const btn = document.getElementById('btn-buy-power') as HTMLButtonElement;
            expect(btn.classList.contains('unaffordable')).toBe(true);
            expect(btn.classList.contains('affordable')).toBe(false);
        });
    });

    describe('click handler', () => {
        beforeEach(() => {
            button.mount();
        });

        it('calls onBuyPower when clicked', () => {
            const btn = document.getElementById('btn-buy-power') as HTMLButtonElement;
            btn.click();

            expect(onBuyPower).toHaveBeenCalledTimes(1);
        });

        it('calls onBuyPower multiple times on multiple clicks', () => {
            const btn = document.getElementById('btn-buy-power') as HTMLButtonElement;
            btn.click();
            btn.click();
            btn.click();

            expect(onBuyPower).toHaveBeenCalledTimes(3);
        });
    });

    describe('reactive updates', () => {
        beforeEach(() => {
            button.mount();
        });

        it('updates when power changes', () => {
            state$.updateProperty('power', 25);

            const currentEl = document.getElementById('power-current');
            expect(currentEl?.textContent).toBe('25');
        });

        it('updates when power_capacity changes', () => {
            state$.updateProperty('power_capacity', 150);

            const maxEl = document.getElementById('power-max');
            expect(maxEl?.textContent).toBe('150');
        });

        it('updates button state when credits change', () => {
            mockController.canBuyPower = vi.fn().mockReturnValue(true);
            state$.updateProperty('credits', 500);

            const btn = document.getElementById('btn-buy-power') as HTMLButtonElement;
            expect(btn.disabled).toBe(false);

            mockController.canBuyPower = vi.fn().mockReturnValue(false);
            state$.updateProperty('credits', 0);

            expect(btn.disabled).toBe(true);
        });
    });

    describe('destroy()', () => {
        it('removes click event listener', () => {
            button.mount();
            button.destroy();

            const btn = document.getElementById('btn-buy-power') as HTMLButtonElement;
            btn.click();

            expect(onBuyPower).not.toHaveBeenCalled();
        });
    });

    describe('handles missing DOM elements gracefully', () => {
        it('does not throw when DOM elements are missing', () => {
            document.body.innerHTML = '';
            const mockOnBuyPower = vi.fn() as () => void;
            const buttonWithoutDOM = new PowerButton(state$, mockController, mockOnBuyPower);

            expect(() => {
                buttonWithoutDOM.mount();
                state$.updateProperty('power', 75);
            }).not.toThrow();

            buttonWithoutDOM.destroy();
        });
    });
});

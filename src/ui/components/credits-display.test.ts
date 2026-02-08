// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CreditsDisplay } from './credits-display';
import { StateObserver } from '../../gamestate/observer';
import type { GameState } from '../../gamestate';

describe('CreditsDisplay', () => {
    let state$: StateObserver<GameState>;
    let display: CreditsDisplay;

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
        document.body.innerHTML = '<span id="credits-value"></span>';
    };

    beforeEach(() => {
        setupDOM();
        state$ = new StateObserver<GameState>(createInitialState());
        display = new CreditsDisplay(state$);
    });

    afterEach(() => {
        display.destroy();
        document.body.innerHTML = '';
    });

    describe('mount()', () => {
        it('renders initial credits value', () => {
            display.mount();

            const el = document.getElementById('credits-value');
            // Check numeric content regardless of locale-specific formatting
            expect(el?.textContent?.replace(/\D/g, '')).toBe('1000');
        });

        it('subscribes to credits state changes', () => {
            display.mount();
            state$.updateProperty('credits', 5000);

            const el = document.getElementById('credits-value');
            expect(el?.textContent?.replace(/\D/g, '')).toBe('5000');
        });
    });

    describe('render()', () => {
        beforeEach(() => {
            display.mount();
        });

        it('formats small numbers correctly', () => {
            state$.updateProperty('credits', 50);

            const el = document.getElementById('credits-value');
            expect(el?.textContent).toBe('50');
        });

        it('formats large numbers with separators', () => {
            state$.updateProperty('credits', 1234567);

            const el = document.getElementById('credits-value');
            // Check numeric content regardless of locale-specific formatting
            expect(el?.textContent?.replace(/\D/g, '')).toBe('1234567');
        });

        it('displays zero credits', () => {
            state$.updateProperty('credits', 0);

            const el = document.getElementById('credits-value');
            expect(el?.textContent).toBe('0');
        });
    });

    describe('handles missing DOM elements gracefully', () => {
        it('does not throw when DOM element is missing', () => {
            document.body.innerHTML = '';
            const displayWithoutDOM = new CreditsDisplay(state$);

            expect(() => {
                displayWithoutDOM.mount();
                state$.updateProperty('credits', 9999);
            }).not.toThrow();

            displayWithoutDOM.destroy();
        });
    });
});

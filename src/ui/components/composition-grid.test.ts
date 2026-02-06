// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CompositionGrid } from './composition-grid';
import { StateObserver } from '../../gamestate/observer';
import type { GameState } from '../../gamestate';
import type { Asteroid } from '../../asteroids/interfaces';

describe('CompositionGrid', () => {
    let state$: StateObserver<GameState>;
    let grid: CompositionGrid;

    const createMockAsteroid = (overrides: Partial<Asteroid> = {}): Asteroid => ({
        type: 'iron_nickel',
        size: 'medium',
        composition: { Fe: 60, Ni: 30, Co: 10 },
        totalYield: 100,
        miningTime: 5000,
        visualDiameter: 80,
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
        ...overrides,
    });

    const setupDOM = () => {
        document.body.innerHTML = '<div id="composition-grid"></div>';
    };

    beforeEach(() => {
        setupDOM();
        state$ = new StateObserver<GameState>(createInitialState());
        grid = new CompositionGrid(state$);
    });

    afterEach(() => {
        grid.destroy();
        document.body.innerHTML = '';
    });

    describe('mount()', () => {
        it('renders initial placeholder when no asteroid', () => {
            grid.mount();

            const el = document.getElementById('composition-grid');
            expect(el?.innerHTML).toContain('--');
            expect(el?.innerHTML).toContain('--%');
        });

        it('subscribes to asteroid state changes', () => {
            grid.mount();
            state$.updateProperty('asteroid', createMockAsteroid());

            const el = document.getElementById('composition-grid');
            expect(el?.innerHTML).toContain('IRON_NICKEL');
        });
    });

    describe('render() - empty state', () => {
        beforeEach(() => {
            grid.mount();
        });

        it('renders placeholder items with opacity', () => {
            const el = document.getElementById('composition-grid');
            expect(el?.innerHTML).toContain('opacity: 0.3');
        });

        it('renders three placeholder items', () => {
            const el = document.getElementById('composition-grid');
            const placeholders = el?.querySelectorAll('.composition-item');
            expect(placeholders?.length).toBe(3);
        });
    });

    describe('render() - with asteroid', () => {
        beforeEach(() => {
            grid.mount();
        });

        it('renders asteroid type in uppercase', () => {
            state$.updateProperty('asteroid', createMockAsteroid({ type: 'carbonaceous' }));

            const el = document.getElementById('composition-grid');
            expect(el?.innerHTML).toContain('CARBONACEOUS');
        });

        it('renders total yield', () => {
            state$.updateProperty('asteroid', createMockAsteroid({ totalYield: 150 }));

            const el = document.getElementById('composition-grid');
            expect(el?.innerHTML).toContain('150 kg');
        });

        it('renders all composition elements', () => {
            state$.updateProperty('asteroid', createMockAsteroid({
                composition: { Fe: 50, Ni: 30, Si: 20 }
            }));

            const el = document.getElementById('composition-grid');
            expect(el?.innerHTML).toContain('Fe');
            expect(el?.innerHTML).toContain('50%');
            expect(el?.innerHTML).toContain('Ni');
            expect(el?.innerHTML).toContain('30%');
            expect(el?.innerHTML).toContain('Si');
            expect(el?.innerHTML).toContain('20%');
        });

        it('updates when asteroid changes', () => {
            state$.updateProperty('asteroid', createMockAsteroid({ type: 'iron_nickel' }));
            state$.updateProperty('asteroid', createMockAsteroid({ type: 'rare_earth' }));

            const el = document.getElementById('composition-grid');
            expect(el?.innerHTML).toContain('RARE_EARTH');
            expect(el?.innerHTML).not.toContain('IRON_NICKEL');
        });

        it('renders placeholder when asteroid is cleared', () => {
            state$.updateProperty('asteroid', createMockAsteroid());
            state$.updateProperty('asteroid', null);

            const el = document.getElementById('composition-grid');
            expect(el?.innerHTML).toContain('--');
        });
    });

    describe('handles missing DOM elements gracefully', () => {
        it('does not throw when DOM element is missing', () => {
            document.body.innerHTML = '';
            const gridWithoutDOM = new CompositionGrid(state$);

            expect(() => {
                gridWithoutDOM.mount();
                state$.updateProperty('asteroid', createMockAsteroid());
            }).not.toThrow();

            gridWithoutDOM.destroy();
        });
    });
});

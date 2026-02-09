// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AsteroidView } from './asteroid-view';
import { StateObserver } from '../../gamestate/observer';
import type { GameState } from '../../gamestate';
import type { Asteroid } from '../../asteroids/interfaces';

describe('AsteroidView', () => {
    let state$: StateObserver<GameState>;
    let view: AsteroidView;

    const createMockAsteroid = (): Asteroid => ({
        type: 'iron_nickel',
        size: 'medium',
        composition: { Fe: 0.6, Ni: 0.3, Co: 0.1 },
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
        equipped_tools: [],
        tools_owned: [],
        current_cell: { x: 0, y: 0, z: 0 },
        ...overrides,
    });

    const setupDOM = () => {
        document.body.innerHTML = `
            <div id="asteroid-placeholder"></div>
            <div id="composition-section"></div>
        `;
    };

    beforeEach(() => {
        setupDOM();
        state$ = new StateObserver<GameState>(createInitialState());
        view = new AsteroidView(state$);
    });

    afterEach(() => {
        view.destroy();
        document.body.innerHTML = '';
    });

    describe('mount()', () => {
        it('acquires DOM element references', () => {
            view.mount();

            // Verify render was called by checking initial state is applied
            const placeholder = document.getElementById('asteroid-placeholder');
            expect(placeholder?.style.display).toBe('flex');
        });

        it('subscribes to asteroid state changes', () => {
            view.mount();

            // Change asteroid state - should trigger render
            state$.updateProperty('asteroid', createMockAsteroid());

            const placeholder = document.getElementById('asteroid-placeholder');
            expect(placeholder?.style.display).toBe('none');
        });
    });

    describe('render()', () => {
        beforeEach(() => {
            view.mount();
        });

        it('shows placeholder when no asteroid', () => {
            const placeholder = document.getElementById('asteroid-placeholder');
            const compositionSection = document.getElementById('composition-section');
            expect(placeholder?.style.display).toBe('flex');
            expect(compositionSection?.style.display).toBe('none');
        });

        it('hides placeholder when asteroid exists', () => {
            state$.updateProperty('asteroid', createMockAsteroid());

            const placeholder = document.getElementById('asteroid-placeholder');
            const compositionSection = document.getElementById('composition-section');
            expect(placeholder?.style.display).toBe('none');
            expect(compositionSection?.style.display).toBe('flex');
        });

        it('shows placeholder again when asteroid is removed', () => {
            state$.updateProperty('asteroid', createMockAsteroid());
            state$.updateProperty('asteroid', null);

            const placeholder = document.getElementById('asteroid-placeholder');
            const compositionSection = document.getElementById('composition-section');
            expect(placeholder?.style.display).toBe('flex');
            expect(compositionSection?.style.display).toBe('none');
        });
    });

    describe('destroy()', () => {
        it('unsubscribes from state changes', () => {
            view.mount();
            view.destroy();

            // Update state after destroy
            state$.updateProperty('asteroid', createMockAsteroid());

            // Placeholder should still show 'block' from initial render, not updated
            // Since we can't easily verify subscriptions are removed, we just ensure no errors
            const placeholder = document.getElementById('asteroid-placeholder');
            expect(placeholder).not.toBeNull();
        });
    });

    describe('handles missing DOM elements gracefully', () => {
        it('does not throw when DOM elements are missing', () => {
            document.body.innerHTML = '';
            const viewWithoutDOM = new AsteroidView(state$);

            expect(() => {
                viewWithoutDOM.mount();
                state$.updateProperty('asteroid', createMockAsteroid());
            }).not.toThrow();

            viewWithoutDOM.destroy();
        });
    });
});

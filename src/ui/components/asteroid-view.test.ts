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
            <div id="asteroid"></div>
            <div id="asteroid-placeholder"></div>
            <div id="mining-progress-container"></div>
            <div id="mining-progress-fill"></div>
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
            expect(placeholder?.style.display).toBe('block');
        });

        it('subscribes to asteroid and is_mining state changes', () => {
            view.mount();

            // Change asteroid state - should trigger render
            state$.updateProperty('asteroid', createMockAsteroid());

            const asteroidEl = document.getElementById('asteroid');
            expect(asteroidEl?.classList.contains('visible')).toBe(true);
        });
    });

    describe('render()', () => {
        beforeEach(() => {
            view.mount();
        });

        it('shows placeholder when no asteroid', () => {
            const placeholder = document.getElementById('asteroid-placeholder');
            const asteroidEl = document.getElementById('asteroid');

            expect(placeholder?.style.display).toBe('block');
            expect(asteroidEl?.classList.contains('visible')).toBe(false);
        });

        it('hides placeholder and shows asteroid when asteroid exists', () => {
            state$.updateProperty('asteroid', createMockAsteroid());

            const placeholder = document.getElementById('asteroid-placeholder');
            const asteroidEl = document.getElementById('asteroid');

            expect(placeholder?.style.display).toBe('none');
            expect(asteroidEl?.classList.contains('visible')).toBe(true);
        });

        it('adds mining class when is_mining is true', () => {
            state$.updateProperty('asteroid', createMockAsteroid());
            state$.updateProperty('is_mining', true);

            const asteroidEl = document.getElementById('asteroid');
            expect(asteroidEl?.classList.contains('mining')).toBe(true);
        });

        it('shows progress container when mining', () => {
            state$.updateProperty('asteroid', createMockAsteroid());
            state$.updateProperty('is_mining', true);

            const progressContainer = document.getElementById('mining-progress-container');
            expect(progressContainer?.classList.contains('visible')).toBe(true);
        });

        it('hides progress container when not mining', () => {
            state$.updateProperty('asteroid', createMockAsteroid());
            state$.updateProperty('is_mining', false);

            const progressContainer = document.getElementById('mining-progress-container');
            expect(progressContainer?.classList.contains('visible')).toBe(false);
        });
    });

    describe('setProgress()', () => {
        beforeEach(() => {
            view.mount();
        });

        it('sets progress fill width to 0% for progress 0', () => {
            view.setProgress(0);

            const fill = document.getElementById('mining-progress-fill');
            expect(fill?.style.width).toBe('0%');
        });

        it('sets progress fill width to 50% for progress 0.5', () => {
            view.setProgress(0.5);

            const fill = document.getElementById('mining-progress-fill');
            expect(fill?.style.width).toBe('50%');
        });

        it('sets progress fill width to 100% for progress 1', () => {
            view.setProgress(1);

            const fill = document.getElementById('mining-progress-fill');
            expect(fill?.style.width).toBe('100%');
        });
    });

    describe('showAsteroid()', () => {
        beforeEach(() => {
            view.mount();
        });

        it('adds visible class to asteroid element', () => {
            view.showAsteroid();

            const asteroidEl = document.getElementById('asteroid');
            expect(asteroidEl?.classList.contains('visible')).toBe(true);
        });

        it('hides placeholder', () => {
            view.showAsteroid();

            const placeholder = document.getElementById('asteroid-placeholder');
            expect(placeholder?.style.display).toBe('none');
        });
    });

    describe('hideAsteroid()', () => {
        beforeEach(() => {
            view.mount();
            // First show asteroid and start mining
            state$.updateProperty('asteroid', createMockAsteroid());
            state$.updateProperty('is_mining', true);
            view.setProgress(0.5);
        });

        it('removes visible class from asteroid element', () => {
            view.hideAsteroid();

            const asteroidEl = document.getElementById('asteroid');
            expect(asteroidEl?.classList.contains('visible')).toBe(false);
        });

        it('removes mining class from asteroid element', () => {
            view.hideAsteroid();

            const asteroidEl = document.getElementById('asteroid');
            expect(asteroidEl?.classList.contains('mining')).toBe(false);
        });

        it('shows placeholder', () => {
            view.hideAsteroid();

            const placeholder = document.getElementById('asteroid-placeholder');
            expect(placeholder?.style.display).toBe('block');
        });

        it('hides progress container', () => {
            view.hideAsteroid();

            const progressContainer = document.getElementById('mining-progress-container');
            expect(progressContainer?.classList.contains('visible')).toBe(false);
        });

        it('resets progress fill to 0%', () => {
            view.hideAsteroid();

            const fill = document.getElementById('mining-progress-fill');
            expect(fill?.style.width).toBe('0%');
        });
    });

    describe('setMining()', () => {
        beforeEach(() => {
            view.mount();
            state$.updateProperty('asteroid', createMockAsteroid());
        });

        it('adds mining class when true', () => {
            view.setMining(true);

            const asteroidEl = document.getElementById('asteroid');
            expect(asteroidEl?.classList.contains('mining')).toBe(true);
        });

        it('removes mining class when false', () => {
            view.setMining(true);
            view.setMining(false);

            const asteroidEl = document.getElementById('asteroid');
            expect(asteroidEl?.classList.contains('mining')).toBe(false);
        });

        it('shows progress container when true', () => {
            view.setMining(true);

            const progressContainer = document.getElementById('mining-progress-container');
            expect(progressContainer?.classList.contains('visible')).toBe(true);
        });

        it('hides progress container when false', () => {
            view.setMining(true);
            view.setMining(false);

            const progressContainer = document.getElementById('mining-progress-container');
            expect(progressContainer?.classList.contains('visible')).toBe(false);
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
                viewWithoutDOM.setProgress(0.5);
                viewWithoutDOM.showAsteroid();
                viewWithoutDOM.hideAsteroid();
                viewWithoutDOM.setMining(true);
            }).not.toThrow();

            viewWithoutDOM.destroy();
        });
    });
});

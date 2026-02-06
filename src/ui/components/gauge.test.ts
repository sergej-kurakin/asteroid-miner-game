// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GaugeComponent } from './gauge';
import { StateObserver } from '../../gamestate/observer';
import type { GameState } from '../../gamestate';
import type { Asteroid } from '../../asteroids/interfaces';

describe('GaugeComponent', () => {
    let state$: StateObserver<GameState>;

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

    beforeEach(() => {
        state$ = new StateObserver<GameState>(createInitialState());
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('Power Gauge', () => {
        let gauge: GaugeComponent;

        const setupDOM = () => {
            document.body.innerHTML = `
                <span id="power-value"></span>
                <div id="power-fill"></div>
            `;
        };

        beforeEach(() => {
            setupDOM();
            gauge = new GaugeComponent(state$, 'power');
        });

        afterEach(() => {
            gauge.destroy();
        });

        it('renders initial power percentage', () => {
            gauge.mount();

            const valueEl = document.getElementById('power-value');
            const fillEl = document.getElementById('power-fill');

            expect(valueEl?.textContent).toBe('100%');
            expect(fillEl?.style.width).toBe('100%');
        });

        it('updates when power changes', () => {
            gauge.mount();
            state$.updateProperty('power', 50);

            const valueEl = document.getElementById('power-value');
            const fillEl = document.getElementById('power-fill');

            expect(valueEl?.textContent).toBe('50%');
            expect(fillEl?.style.width).toBe('50%');
        });

        it('updates when power capacity changes', () => {
            gauge.mount();
            state$.setState({ power: 50, power_capacity: 200 });

            const valueEl = document.getElementById('power-value');
            expect(valueEl?.textContent).toBe('25%');
        });

        it('rounds percentage value', () => {
            gauge.mount();
            state$.setState({ power: 33, power_capacity: 100 });

            const valueEl = document.getElementById('power-value');
            expect(valueEl?.textContent).toBe('33%');
        });
    });

    describe('Laser Gauge', () => {
        let gauge: GaugeComponent;

        const setupDOM = () => {
            document.body.innerHTML = `
                <span id="laser-value"></span>
                <div id="laser-fill"></div>
            `;
        };

        beforeEach(() => {
            setupDOM();
            gauge = new GaugeComponent(state$, 'laser');
        });

        afterEach(() => {
            gauge.destroy();
        });

        it('shows Standby when no asteroid and not mining', () => {
            gauge.mount();

            const valueEl = document.getElementById('laser-value');
            const fillEl = document.getElementById('laser-fill');

            expect(valueEl?.textContent).toBe('Standby');
            expect(fillEl?.style.width).toBe('0%');
        });

        it('shows Ready when asteroid present but not mining', () => {
            state$.updateProperty('asteroid', createMockAsteroid());
            gauge.mount();

            const valueEl = document.getElementById('laser-value');
            expect(valueEl?.textContent).toBe('Ready');
        });

        it('shows Active when mining', () => {
            state$.setState({
                asteroid: createMockAsteroid(),
                is_mining: true,
                mining_progress: 0.5
            });
            gauge.mount();

            const valueEl = document.getElementById('laser-value');
            const fillEl = document.getElementById('laser-fill');

            expect(valueEl?.textContent).toBe('Active');
            expect(fillEl?.style.width).toBe('50%');
        });

        it('updates fill based on mining progress', () => {
            state$.setState({
                asteroid: createMockAsteroid(),
                is_mining: true,
                mining_progress: 0
            });
            gauge.mount();

            state$.updateProperty('mining_progress', 0.75);

            const fillEl = document.getElementById('laser-fill');
            expect(fillEl?.style.width).toBe('75%');
        });

        it('resets to Standby when asteroid is cleared', () => {
            state$.setState({
                asteroid: createMockAsteroid(),
                is_mining: false
            });
            gauge.mount();

            state$.updateProperty('asteroid', null);

            const valueEl = document.getElementById('laser-value');
            expect(valueEl?.textContent).toBe('Standby');
        });
    });

    describe('Hold Gauge', () => {
        let gauge: GaugeComponent;

        const setupDOM = () => {
            document.body.innerHTML = `
                <span id="hold-value"></span>
                <div id="hold-fill"></div>
            `;
        };

        beforeEach(() => {
            setupDOM();
            gauge = new GaugeComponent(state$, 'hold');
        });

        afterEach(() => {
            gauge.destroy();
        });

        it('renders initial hold capacity', () => {
            gauge.mount();

            const valueEl = document.getElementById('hold-value');
            const fillEl = document.getElementById('hold-fill');

            expect(valueEl?.textContent).toBe('0 / 100');
            expect(fillEl?.style.width).toBe('0%');
        });

        it('updates when hold_used changes', () => {
            gauge.mount();
            state$.updateProperty('hold_used', 50);

            const valueEl = document.getElementById('hold-value');
            const fillEl = document.getElementById('hold-fill');

            expect(valueEl?.textContent).toBe('50 / 100');
            expect(fillEl?.style.width).toBe('50%');
        });

        it('updates when hold_capacity changes', () => {
            gauge.mount();
            state$.setState({ hold_used: 100, hold_capacity: 200 });

            const valueEl = document.getElementById('hold-value');
            const fillEl = document.getElementById('hold-fill');

            expect(valueEl?.textContent).toBe('100 / 200');
            expect(fillEl?.style.width).toBe('50%');
        });

        it('shows full hold', () => {
            gauge.mount();
            state$.setState({ hold_used: 100, hold_capacity: 100 });

            const fillEl = document.getElementById('hold-fill');
            expect(fillEl?.style.width).toBe('100%');
        });
    });

    describe('handles missing DOM elements gracefully', () => {
        it('does not throw when DOM elements are missing', () => {
            document.body.innerHTML = '';

            const powerGauge = new GaugeComponent(state$, 'power');
            const laserGauge = new GaugeComponent(state$, 'laser');
            const holdGauge = new GaugeComponent(state$, 'hold');

            expect(() => {
                powerGauge.mount();
                laserGauge.mount();
                holdGauge.mount();
                state$.updateProperty('power', 50);
            }).not.toThrow();

            powerGauge.destroy();
            laserGauge.destroy();
            holdGauge.destroy();
        });
    });
});

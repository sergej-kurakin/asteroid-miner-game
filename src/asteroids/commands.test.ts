import { describe, it, expect } from 'vitest';
import { ScanCommand, AbandonCommand } from './commands';
import { StateObserver } from '../gamestate';
import type { GameState } from '../gamestate/interfaces';
import type { Asteroid, IAsteroidGenerator } from './interfaces';
import { SCAN_POWER_COST } from './constants';
import { AsteroidGenerator } from './generator';

const createTestState = (overrides?: Partial<GameState>): GameState => ({
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
    ...overrides
});

const createTestAsteroid = (overrides?: Partial<Asteroid>): Asteroid => ({
    type: 'iron_nickel',
    size: 'small',
    composition: { Fe: 90, Ni: 10 },
    totalYield: 100,
    miningTime: 2500,
    visualDiameter: 120,
    ...overrides
});

describe('ScanCommand', () => {
    it('generates asteroid and sets it on state', () => {
        const state$ = new StateObserver(createTestState({ power: 100 }));
        const command = new ScanCommand(state$, new AsteroidGenerator());

        command.execute();

        expect(state$.getState().asteroid).not.toBeNull();
    });

    it('deducts SCAN_POWER_COST from current state power', () => {
        const initialPower = 100;
        const state$ = new StateObserver(createTestState({ power: initialPower }));
        const command = new ScanCommand(state$, new AsteroidGenerator());

        command.execute();

        expect(state$.getState().power).toBe(initialPower - SCAN_POWER_COST);
    });

    it('returns the same asteroid reference stored in state', () => {
        const state$ = new StateObserver(createTestState({ power: 100 }));
        const command = new ScanCommand(state$, new AsteroidGenerator());

        const asteroid = command.execute();

        expect(state$.getState().asteroid).toBe(asteroid);
    });

    it('sets power to 0 when power equals SCAN_POWER_COST', () => {
        const state$ = new StateObserver(createTestState({ power: SCAN_POWER_COST }));
        const command = new ScanCommand(state$, new AsteroidGenerator());

        command.execute();

        expect(state$.getState().power).toBe(0);
    });

    it('uses injected generator when provided', () => {
        const fakeAsteroid = createTestAsteroid({ type: 'olivine', size: 'colossal' });
        const fakeGenerator: IAsteroidGenerator = { generate: () => fakeAsteroid };
        const state$ = new StateObserver(createTestState({ power: 100 }));
        const command = new ScanCommand(state$, fakeGenerator);

        const result = command.execute();

        expect(result).toBe(fakeAsteroid);
        expect(state$.getState().asteroid).toBe(fakeAsteroid);
    });

    it('passes current_ship_level from state to the generator', () => {
        let receivedLevel: number | undefined;
        const fakeGenerator: IAsteroidGenerator = {
            generate: (level: number) => {
                receivedLevel = level;
                return createTestAsteroid();
            }
        };
        const state$ = new StateObserver(createTestState({ power: 100, current_ship_level: 4 }));
        const command = new ScanCommand(state$, fakeGenerator);

        command.execute();

        expect(receivedLevel).toBe(4);
    });

    it('reads power from state at execution time, not construction time', () => {
        const state$ = new StateObserver(createTestState({ power: 100 }));
        const command = new ScanCommand(state$, new AsteroidGenerator());

        // Power changes between construction and execution
        state$.setState({ power: 50 });
        command.execute();

        expect(state$.getState().power).toBe(50 - SCAN_POWER_COST);
    });
});

describe('AbandonCommand', () => {
    it('sets asteroid to null', () => {
        const state$ = new StateObserver(createTestState({ asteroid: createTestAsteroid() }));
        const command = new AbandonCommand(state$);

        command.execute();

        expect(state$.getState().asteroid).toBeNull();
    });

    it('does not modify other state properties', () => {
        const state$ = new StateObserver(createTestState({
            asteroid: createTestAsteroid(),
            credits: 500,
            power: 75
        }));
        const command = new AbandonCommand(state$);

        command.execute();

        const state = state$.getState();
        expect(state.credits).toBe(500);
        expect(state.power).toBe(75);
        expect(state.is_mining).toBe(false);
    });
});

import { describe, it, expect } from 'vitest';
import { BuyToolCommand, EquipToolCommand, UnequipToolCommand } from './commands';
import { StateObserver } from '../gamestate';
import type { GameState } from '../gamestate/interfaces';
import type { ToolData } from './interfaces';

const createTestState = (overrides?: Partial<GameState>): GameState => ({
    credits: 5000,
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
    ...overrides
});

const createTestTool = (overrides?: Partial<ToolData>): ToolData => ({
    id: 'laser_drill',
    name: 'Laser Drill',
    tier: 1,
    cost: 500,
    yieldBonus: 0.10,
    rareBonus: 0.05,
    powerCostBonus: 0.10,
    description: 'A test laser drill',
    ...overrides
});

describe('BuyToolCommand', () => {
    it('deducts tool cost from credits', () => {
        const tool = createTestTool({ cost: 500 });
        const state$ = new StateObserver(createTestState({ credits: 2000 }));
        new BuyToolCommand(state$, tool).execute();

        expect(state$.getState().credits).toBe(1500);
    });

    it('adds tool id to tools_owned', () => {
        const tool = createTestTool({ id: 'plasma_cutter' });
        const state$ = new StateObserver(createTestState({ tools_owned: ['laser_drill'] }));
        new BuyToolCommand(state$, tool).execute();

        expect(state$.getState().tools_owned).toEqual(['laser_drill', 'plasma_cutter']);
    });

    it('reads state at execute time, not construction time', () => {
        const tool = createTestTool({ cost: 500 });
        const state$ = new StateObserver(createTestState({ credits: 2000 }));
        const command = new BuyToolCommand(state$, tool);

        state$.setState({ credits: 3000 });
        command.execute();

        expect(state$.getState().credits).toBe(2500);
    });

    it('does not modify unrelated state properties', () => {
        const tool = createTestTool();
        const state$ = new StateObserver(createTestState({
            power: 80,
            hold_used: 30,
            current_ship_level: 2
        }));
        new BuyToolCommand(state$, tool).execute();

        const state = state$.getState();
        expect(state.power).toBe(80);
        expect(state.hold_used).toBe(30);
        expect(state.current_ship_level).toBe(2);
    });
});

describe('EquipToolCommand', () => {
    it('adds tool to equipped_tools at specified slot', () => {
        const state$ = new StateObserver(createTestState());
        new EquipToolCommand(state$, 'laser_drill', 0).execute();

        expect(state$.getState().equipped_tools).toEqual([
            { toolId: 'laser_drill', slot: 0 }
        ]);
    });

    it('replaces existing tool in the same slot', () => {
        const state$ = new StateObserver(createTestState({
            equipped_tools: [{ toolId: 'standard_drill', slot: 0 }]
        }));
        new EquipToolCommand(state$, 'laser_drill', 0).execute();

        expect(state$.getState().equipped_tools).toEqual([
            { toolId: 'laser_drill', slot: 0 }
        ]);
    });

    it('preserves tools in other slots', () => {
        const state$ = new StateObserver(createTestState({
            equipped_tools: [
                { toolId: 'standard_drill', slot: 0 },
                { toolId: 'plasma_cutter', slot: 1 }
            ]
        }));
        new EquipToolCommand(state$, 'laser_drill', 0).execute();

        const equipped = state$.getState().equipped_tools;
        expect(equipped).toContainEqual({ toolId: 'laser_drill', slot: 0 });
        expect(equipped).toContainEqual({ toolId: 'plasma_cutter', slot: 1 });
        expect(equipped).toHaveLength(2);
    });

    it('reads state at execute time, not construction time', () => {
        const state$ = new StateObserver(createTestState());
        const command = new EquipToolCommand(state$, 'laser_drill', 0);

        state$.setState({ equipped_tools: [{ toolId: 'plasma_cutter', slot: 1 }] });
        command.execute();

        const equipped = state$.getState().equipped_tools;
        expect(equipped).toContainEqual({ toolId: 'laser_drill', slot: 0 });
        expect(equipped).toContainEqual({ toolId: 'plasma_cutter', slot: 1 });
    });

    it('does not modify unrelated state properties', () => {
        const state$ = new StateObserver(createTestState({
            credits: 3000,
            power: 80
        }));
        new EquipToolCommand(state$, 'laser_drill', 0).execute();

        const state = state$.getState();
        expect(state.credits).toBe(3000);
        expect(state.power).toBe(80);
    });
});

describe('UnequipToolCommand', () => {
    it('removes tool from specified slot', () => {
        const state$ = new StateObserver(createTestState({
            equipped_tools: [{ toolId: 'laser_drill', slot: 0 }]
        }));
        new UnequipToolCommand(state$, 0).execute();

        expect(state$.getState().equipped_tools).toEqual([]);
    });

    it('preserves tools in other slots', () => {
        const state$ = new StateObserver(createTestState({
            equipped_tools: [
                { toolId: 'laser_drill', slot: 0 },
                { toolId: 'plasma_cutter', slot: 1 }
            ]
        }));
        new UnequipToolCommand(state$, 0).execute();

        expect(state$.getState().equipped_tools).toEqual([
            { toolId: 'plasma_cutter', slot: 1 }
        ]);
    });

    it('always calls setState even when slot is empty', () => {
        const state$ = new StateObserver(createTestState({ equipped_tools: [] }));
        new UnequipToolCommand(state$, 0).execute();

        // No error thrown, state is still valid
        expect(state$.getState().equipped_tools).toEqual([]);
    });

    it('does not modify unrelated state properties', () => {
        const state$ = new StateObserver(createTestState({
            equipped_tools: [{ toolId: 'laser_drill', slot: 0 }],
            credits: 3000,
            power: 80
        }));
        new UnequipToolCommand(state$, 0).execute();

        const state = state$.getState();
        expect(state.credits).toBe(3000);
        expect(state.power).toBe(80);
    });
});

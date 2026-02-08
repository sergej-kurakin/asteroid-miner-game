import type { Observable, Command, GameState } from '../gamestate';
import type { ToolData } from './interfaces';

/**
 * Purchases a tool by deducting its cost from credits and adding it to tools_owned.
 *
 * @precondition state.credits >= tool.cost
 * @precondition !state.tools_owned.includes(tool.id)
 */
export class BuyToolCommand implements Command<void> {
    constructor(
        private readonly state$: Observable<GameState>,
        private readonly tool: ToolData
    ) {}

    execute(): void {
        const state = this.state$.getState();
        this.state$.setState({
            credits: state.credits - this.tool.cost,
            tools_owned: [...state.tools_owned, this.tool.id]
        });
    }
}

/**
 * Equips a tool to a specific slot, replacing any tool in that slot.
 *
 * @precondition toolId is owned (in state.tools_owned) or is 'standard_drill'
 * @precondition slot is valid (0 <= slot < ship's tool slot count)
 * @precondition toolId is not already equipped in another slot
 */
export class EquipToolCommand implements Command<void> {
    constructor(
        private readonly state$: Observable<GameState>,
        private readonly toolId: string,
        private readonly slot: number
    ) {}

    execute(): void {
        const state = this.state$.getState();
        const newEquipped = state.equipped_tools.filter(t => t.slot !== this.slot);
        newEquipped.push({ toolId: this.toolId, slot: this.slot });

        this.state$.setState({
            equipped_tools: newEquipped
        });
    }
}

/**
 * Unequips the tool in the specified slot (no-op if slot is empty).
 */
export class UnequipToolCommand implements Command<void> {
    constructor(
        private readonly state$: Observable<GameState>,
        private readonly slot: number
    ) {}

    execute(): void {
        const state = this.state$.getState();
        const newEquipped = state.equipped_tools.filter(t => t.slot !== this.slot);

        this.state$.setState({
            equipped_tools: newEquipped
        });
    }
}

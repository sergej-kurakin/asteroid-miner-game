import type { Observable } from '../gamestate';
import type { GameState } from '../gamestate/interfaces';
import type { IShipController } from '../ships/interfaces';
import type {
    ToolData,
    EquippedTool,
    ToolBonuses,
    BuyToolResult,
    EquipToolResult,
    IToolController
} from './interfaces';
import { TOOLS, TOOLS_BY_ID } from './constants';

export class ToolController implements IToolController {
    constructor(
        private readonly state$: Observable<GameState>,
        private readonly shipController: IShipController
    ) {}

    buyTool(toolId: string): BuyToolResult {
        const state = this.state$.getState();

        if (state.tools_owned.includes(toolId)) {
            return { success: false, error: 'already_owned' };
        }

        const tool = TOOLS_BY_ID.get(toolId);
        if (!tool) {
            return { success: false, error: 'insufficient_credits' };
        }

        if (state.credits < tool.cost) {
            return { success: false, error: 'insufficient_credits' };
        }

        this.state$.setState({
            credits: state.credits - tool.cost,
            tools_owned: [...state.tools_owned, toolId]
        });

        return { success: true };
    }

    equipTool(toolId: string, slot: number): EquipToolResult {
        const state = this.state$.getState();

        // Standard drill is always "owned"
        if (toolId !== 'standard_drill' && !state.tools_owned.includes(toolId)) {
            return { success: false, error: 'not_owned' };
        }

        const maxSlots = this.shipController.getToolSlots();
        if (slot < 0 || slot >= maxSlots) {
            return { success: false, error: 'no_slot_available' };
        }

        // Check if tool is already equipped in another slot
        if (state.equipped_tools.some(t => t.toolId === toolId)) {
            return { success: false, error: 'already_equipped' };
        }

        // Replace whatever is in that slot (or add to it)
        const newEquipped = state.equipped_tools.filter(t => t.slot !== slot);
        newEquipped.push({ toolId, slot });

        this.state$.setState({
            equipped_tools: newEquipped
        });

        return { success: true };
    }

    unequipTool(slot: number): void {
        const state = this.state$.getState();
        const newEquipped = state.equipped_tools.filter(t => t.slot !== slot);

        if (newEquipped.length !== state.equipped_tools.length) {
            this.state$.setState({
                equipped_tools: newEquipped
            });
        }
    }

    getEquippedTools(): EquippedTool[] {
        const maxSlots = this.shipController.getToolSlots();
        // Filter out tools in slots that exceed current ship's slot count
        return this.state$.getState().equipped_tools.filter(t => t.slot < maxSlots);
    }

    getOwnedTools(): string[] {
        return this.state$.getState().tools_owned;
    }

    getToolBonuses(): ToolBonuses {
        const equipped = this.getEquippedTools();

        let yieldSum = 0;
        let rareSum = 0;
        let powerCostSum = 0;

        for (const equippedTool of equipped) {
            const tool = TOOLS_BY_ID.get(equippedTool.toolId);
            if (tool) {
                yieldSum += tool.yieldBonus;
                rareSum += tool.rareBonus;
                powerCostSum += tool.powerCostBonus;
            }
        }

        return {
            yieldMultiplier: 1.0 + yieldSum,
            rareMultiplier: 1.0 + rareSum,
            powerCostMultiplier: 1.0 + powerCostSum
        };
    }

    getAvailableSlots(): number {
        const maxSlots = this.shipController.getToolSlots();
        const equippedCount = this.getEquippedTools().length;
        return maxSlots - equippedCount;
    }

    isToolOwned(toolId: string): boolean {
        if (toolId === 'standard_drill') return true;
        return this.state$.getState().tools_owned.includes(toolId);
    }

    isToolEquipped(toolId: string): boolean {
        return this.getEquippedTools().some(t => t.toolId === toolId);
    }

    getToolData(toolId: string): ToolData | undefined {
        return TOOLS_BY_ID.get(toolId);
    }

    getAllTools(): ToolData[] {
        return TOOLS;
    }
}

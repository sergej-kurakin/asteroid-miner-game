export interface ToolData {
    id: string;
    name: string;
    tier: number;           // 0=basic, 1-3=purchasable tiers
    cost: number;
    yieldBonus: number;     // e.g. 0.10 = +10%
    rareBonus: number;      // e.g. 0.05 = +5% rare element yield
    powerCostBonus: number; // e.g. 0.10 = +10% power cost
    description: string;
}

export interface EquippedTool {
    toolId: string;
    slot: number;  // 0-indexed slot
}

export interface ToolBonuses {
    yieldMultiplier: number;   // 1.0 + sum of yieldBonus
    rareMultiplier: number;    // 1.0 + sum of rareBonus
    powerCostMultiplier: number; // 1.0 + sum of powerCostBonus
}

export interface BuyToolResult {
    success: boolean;
    error?: 'insufficient_credits' | 'already_owned';
}

export interface EquipToolResult {
    success: boolean;
    error?: 'not_owned' | 'no_slot_available' | 'already_equipped';
}

export interface IToolController {
    buyTool(toolId: string): BuyToolResult;
    equipTool(toolId: string, slot: number): EquipToolResult;
    unequipTool(slot: number): void;
    getEquippedTools(): EquippedTool[];
    getOwnedTools(): string[];
    getToolBonuses(): ToolBonuses;
    getAvailableSlots(): number;
    isToolOwned(toolId: string): boolean;
    isToolEquipped(toolId: string): boolean;
    getToolData(toolId: string): ToolData | undefined;
    getAllTools(): ToolData[];
}

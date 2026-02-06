import type { ToolData } from './interfaces';

export const TOOLS: ToolData[] = [
    // Tier 0 - Basic (free, all ships)
    {
        id: 'standard_drill',
        name: 'Standard Drill',
        tier: 0,
        cost: 0,
        yieldBonus: 0,
        rareBonus: 0,
        powerCostBonus: 0,
        description: 'Default tool, no bonus'
    },

    // Tier 1 (500-800 credits)
    {
        id: 'precision_cutter',
        name: 'Precision Cutter',
        tier: 1,
        cost: 500,
        yieldBonus: 0.10,
        rareBonus: 0.05,
        powerCostBonus: 0.10,
        description: 'Element farming early game'
    },
    {
        id: 'power_hammer',
        name: 'Power Hammer',
        tier: 1,
        cost: 800,
        yieldBonus: 0.20,
        rareBonus: -0.05,
        powerCostBonus: 0.30,
        description: 'Volume mining, speed focused'
    },
    {
        id: 'resonance_probe',
        name: 'Resonance Probe',
        tier: 1,
        cost: 700,
        yieldBonus: 0.05,
        rareBonus: 0.10,
        powerCostBonus: 0.15,
        description: 'Hunting valuable elements'
    },

    // Tier 2 (2000-3000 credits)
    {
        id: 'diamond_saw',
        name: 'Diamond Saw',
        tier: 2,
        cost: 2500,
        yieldBonus: 0.35,
        rareBonus: 0.08,
        powerCostBonus: 0.40,
        description: 'Mid-game power mining'
    },
    {
        id: 'element_separator',
        name: 'Element Separator',
        tier: 2,
        cost: 3000,
        yieldBonus: 0.15,
        rareBonus: 0,
        powerCostBonus: 0.25,
        description: 'Auto-refines 20% of mined material'
    },
    {
        id: 'deep_scanner',
        name: 'Deep Scanner',
        tier: 2,
        cost: 2000,
        yieldBonus: 0,
        rareBonus: 0,
        powerCostBonus: 0.05,
        description: 'Reveals full asteroid composition'
    },

    // Tier 3 (8000-12000 credits)
    {
        id: 'plasma_cutter',
        name: 'Plasma Cutter',
        tier: 3,
        cost: 8000,
        yieldBonus: 0.50,
        rareBonus: 0.12,
        powerCostBonus: 0.60,
        description: 'Maximum yield farming'
    },
    {
        id: 'molecular_extractor',
        name: 'Molecular Extractor',
        tier: 3,
        cost: 10000,
        yieldBonus: 0.25,
        rareBonus: 0,
        powerCostBonus: 0.35,
        description: 'Auto-refines 50% of mined material'
    },
    {
        id: 'void_resonator',
        name: 'Void Resonator',
        tier: 3,
        cost: 12000,
        yieldBonus: 0.40,
        rareBonus: 0.25,
        powerCostBonus: 0.70,
        description: '5% chance to find exotic elements'
    }
];

export const TOOLS_BY_ID: Map<string, ToolData> = new Map(
    TOOLS.map(tool => [tool.id, tool])
);

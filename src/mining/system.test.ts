import { describe, it, expect } from 'vitest';
import { MiningSystem } from './system';
import type { Asteroid } from '../asteroids/interfaces';
import type { ToolBonuses } from '../tools/interfaces';

describe('MiningSystem', () => {
    const system = new MiningSystem();

    describe('calculateYield', () => {
        it('should calculate yield from asteroid composition', () => {
            const asteroid: Asteroid = {
                type: 'iron_nickel',
                size: 'medium',
                composition: { Fe: 60, Ni: 30, Co: 10 },
                totalYield: 100,
                miningTime: 3000,
                visualDiameter: 80
            };

            const result = system.calculateYield(asteroid);

            expect(result.collected).toEqual({ Fe: 60, Ni: 30, Co: 10 });
            expect(result.totalAmount).toBe(100);
        });

        it('should handle rounding correctly', () => {
            const asteroid: Asteroid = {
                type: 'carbonaceous',
                size: 'small',
                composition: { Fe: 33, O: 33, Si: 34 },
                totalYield: 10,
                miningTime: 2000,
                visualDiameter: 50
            };

            const result = system.calculateYield(asteroid);

            // 33% of 10 = 3.3 -> rounds to 3
            // 34% of 10 = 3.4 -> rounds to 3
            expect(result.collected.Fe).toBe(3);
            expect(result.collected.O).toBe(3);
            expect(result.collected.Si).toBe(3);
        });

        it('should exclude zero amounts', () => {
            const asteroid: Asteroid = {
                type: 'olivine',
                size: 'tiny',
                composition: { Fe: 90, Co: 1 },
                totalYield: 5,
                miningTime: 1000,
                visualDiameter: 30
            };

            const result = system.calculateYield(asteroid);

            // 1% of 5 = 0.05 -> floor to 0, should be excluded
            expect(result.collected.Fe).toBe(4); // 90% of 5 = 4.5 -> floor to 4
            expect(result.collected.Co).toBeUndefined();
        });
    });

    describe('calculateSellValue', () => {
        it('should calculate total value from inventory', () => {
            const inventory = { Fe: 10, Ni: 5 };
            const prices = { Fe: 50, Ni: 150 };

            const result = system.calculateSellValue(inventory, prices);

            expect(result.totalValue).toBe(10 * 50 + 5 * 150); // 500 + 750 = 1250
            expect(result.itemsSold).toEqual({ Fe: 10, Ni: 5 });
        });

        it('should handle zero amounts', () => {
            const inventory = { Fe: 0, Ni: 5 };
            const prices = { Fe: 50, Ni: 150 };

            const result = system.calculateSellValue(inventory, prices);

            expect(result.totalValue).toBe(750);
            expect(result.itemsSold).toEqual({ Ni: 5 });
        });

        it('should handle missing prices as zero', () => {
            const inventory = { Fe: 10, Unknown: 5 };
            const prices = { Fe: 50 };

            const result = system.calculateSellValue(inventory, prices);

            expect(result.totalValue).toBe(500);
            expect(result.itemsSold).toEqual({ Fe: 10, Unknown: 5 });
        });

        it('should return empty result for empty inventory', () => {
            const result = system.calculateSellValue({}, { Fe: 50 });

            expect(result.totalValue).toBe(0);
            expect(result.itemsSold).toEqual({});
        });
    });

    describe('findNewDiscoveries', () => {
        it('should find elements not yet discovered', () => {
            const collected = { Fe: 10, Ni: 5, Co: 2 };
            const discovered = ['Fe'];

            const result = system.findNewDiscoveries(collected, discovered);

            expect(result).toContain('Ni');
            expect(result).toContain('Co');
            expect(result).not.toContain('Fe');
        });

        it('should return empty array when all elements are discovered', () => {
            const collected = { Fe: 10, Ni: 5 };
            const discovered = ['Fe', 'Ni', 'Co'];

            const result = system.findNewDiscoveries(collected, discovered);

            expect(result).toEqual([]);
        });

        it('should return all elements when none are discovered', () => {
            const collected = { Fe: 10, Ni: 5 };
            const discovered: string[] = [];

            const result = system.findNewDiscoveries(collected, discovered);

            expect(result).toContain('Fe');
            expect(result).toContain('Ni');
        });
    });

    describe('mergeIntoInventory', () => {
        it('should add collected amounts to existing inventory', () => {
            const current = { Fe: 10, Ni: 5 };
            const collected = { Fe: 5, Co: 3 };

            const result = system.mergeIntoInventory(current, collected);

            expect(result).toEqual({ Fe: 15, Ni: 5, Co: 3 });
        });

        it('should not mutate original inventory', () => {
            const current = { Fe: 10 };
            const collected = { Fe: 5 };

            system.mergeIntoInventory(current, collected);

            expect(current.Fe).toBe(10);
        });

        it('should handle empty current inventory', () => {
            const current = {};
            const collected = { Fe: 10, Ni: 5 };

            const result = system.mergeIntoInventory(current, collected);

            expect(result).toEqual({ Fe: 10, Ni: 5 });
        });
    });

    describe('calculateNewHoldUsed', () => {
        it('should add collected amount to current used', () => {
            const result = system.calculateNewHoldUsed(50, 30, 100);

            expect(result).toBe(80);
        });

        it('should cap at capacity', () => {
            const result = system.calculateNewHoldUsed(80, 50, 100);

            expect(result).toBe(100);
        });

        it('should handle zero current used', () => {
            const result = system.calculateNewHoldUsed(0, 30, 100);

            expect(result).toBe(30);
        });
    });

    describe('calculateYield with tool bonuses', () => {
        it('should apply yield multiplier to all elements', () => {
            const asteroid: Asteroid = {
                type: 'iron_nickel',
                size: 'medium',
                composition: { Fe: 60, Ni: 30, Co: 10 },
                totalYield: 100,
                miningTime: 3000,
                visualDiameter: 80
            };
            const bonuses: ToolBonuses = {
                yieldMultiplier: 1.20,
                rareMultiplier: 1.0,
                powerCostMultiplier: 1.0
            };

            const result = system.calculateYield(asteroid, bonuses);

            // Fe: floor(60/100 * 100 * 1.2) = floor(72) = 72
            // Ni: floor(30/100 * 100 * 1.2) = floor(36) = 36
            // Co: floor(10/100 * 100 * 1.2) = floor(12) = 12 (rare, but rareMultiplier=1.0)
            expect(result.collected.Fe).toBe(72);
            expect(result.collected.Ni).toBe(36);
            expect(result.collected.Co).toBe(12);
            expect(result.totalAmount).toBe(120);
        });

        it('should apply rare multiplier to rare elements only', () => {
            const asteroid: Asteroid = {
                type: 'iron_nickel',
                size: 'medium',
                composition: { Fe: 60, Co: 20, Cr: 20 },
                totalYield: 100,
                miningTime: 3000,
                visualDiameter: 80
            };
            const bonuses: ToolBonuses = {
                yieldMultiplier: 1.0,
                rareMultiplier: 1.50,
                powerCostMultiplier: 1.0
            };

            const result = system.calculateYield(asteroid, bonuses);

            // Fe: floor(60) = 60 (not rare)
            // Co: floor(20 * 1.5) = floor(30) = 30 (rare)
            // Cr: floor(20 * 1.5) = floor(30) = 30 (rare)
            expect(result.collected.Fe).toBe(60);
            expect(result.collected.Co).toBe(30);
            expect(result.collected.Cr).toBe(30);
        });

        it('should stack yield and rare multipliers', () => {
            const asteroid: Asteroid = {
                type: 'iron_nickel',
                size: 'medium',
                composition: { Fe: 50, Mn: 50 },
                totalYield: 100,
                miningTime: 3000,
                visualDiameter: 80
            };
            const bonuses: ToolBonuses = {
                yieldMultiplier: 1.10,
                rareMultiplier: 1.20,
                powerCostMultiplier: 1.0
            };

            const result = system.calculateYield(asteroid, bonuses);

            // Fe: floor(50 * 1.1) = floor(55) = 55
            // Mn: floor(50 * 1.1 * 1.2) = floor(66) = 66
            expect(result.collected.Fe).toBe(55);
            expect(result.collected.Mn).toBe(66);
        });

        it('should return normal yield when no bonuses provided', () => {
            const asteroid: Asteroid = {
                type: 'iron_nickel',
                size: 'medium',
                composition: { Fe: 60, Ni: 40 },
                totalYield: 100,
                miningTime: 3000,
                visualDiameter: 80
            };

            const result = system.calculateYield(asteroid);

            expect(result.collected.Fe).toBe(60);
            expect(result.collected.Ni).toBe(40);
        });
    });

    describe('capYieldToAvailableSpace', () => {
        it('should return unchanged yield when space is sufficient', () => {
            const yield_ = {
                collected: { Fe: 30, Ni: 20 },
                totalAmount: 50
            };

            const result = system.capYieldToAvailableSpace(yield_, 100);

            expect(result).toEqual(yield_);
        });

        it('should return unchanged yield when space exactly matches', () => {
            const yield_ = {
                collected: { Fe: 30, Ni: 20 },
                totalAmount: 50
            };

            const result = system.capYieldToAvailableSpace(yield_, 50);

            expect(result).toEqual(yield_);
        });

        it('should scale down proportionally when space is limited', () => {
            const yield_ = {
                collected: { Fe: 60, Ni: 30, Co: 10 },
                totalAmount: 100
            };

            const result = system.capYieldToAvailableSpace(yield_, 50);

            // Scale factor = 50/100 = 0.5
            // Fe: floor(60 * 0.5) = 30
            // Ni: floor(30 * 0.5) = 15
            // Co: floor(10 * 0.5) = 5
            expect(result.collected).toEqual({ Fe: 30, Ni: 15, Co: 5 });
            expect(result.totalAmount).toBe(50);
        });

        it('should exclude elements that round to zero when scaled', () => {
            const yield_ = {
                collected: { Fe: 90, Ni: 8, Co: 2 },
                totalAmount: 100
            };

            const result = system.capYieldToAvailableSpace(yield_, 10);

            // Scale factor = 10/100 = 0.1
            // Fe: floor(90 * 0.1) = 9
            // Ni: floor(8 * 0.1) = 0 (excluded)
            // Co: floor(2 * 0.1) = 0 (excluded)
            expect(result.collected).toEqual({ Fe: 9 });
            expect(result.totalAmount).toBe(9);
        });

        it('should return empty yield when available space is zero', () => {
            const yield_ = {
                collected: { Fe: 60, Ni: 30 },
                totalAmount: 100
            };

            const result = system.capYieldToAvailableSpace(yield_, 0);

            expect(result.collected).toEqual({});
            expect(result.totalAmount).toBe(0);
        });

        it('should return empty yield when available space is negative', () => {
            const yield_ = {
                collected: { Fe: 60, Ni: 30 },
                totalAmount: 100
            };

            const result = system.capYieldToAvailableSpace(yield_, -10);

            expect(result.collected).toEqual({});
            expect(result.totalAmount).toBe(0);
        });
    });
});

import { describe, it, expect } from 'vitest';
import { OfficialMarketSystem } from './official-market-system';

describe('OfficialMarketSystem', () => {
    describe('evaluate', () => {
        it('should calculate total value from inventory with standard prices', () => {
            const market = new OfficialMarketSystem();

            const value = market.evaluate({ Fe: 10, Ni: 5 });

            expect(value).toBe(10 * 50 + 5 * 150); // 1250
        });

        it('should handle zero amounts', () => {
            const market = new OfficialMarketSystem();

            const value = market.evaluate({ Fe: 0, Ni: 5 });

            expect(value).toBe(5 * 150); // 750
        });

        it('should handle missing prices as zero', () => {
            const market = new OfficialMarketSystem();

            const value = market.evaluate({ Fe: 10, Unknown: 5 });

            expect(value).toBe(10 * 50); // 500
        });

        it('should return zero for empty inventory', () => {
            const market = new OfficialMarketSystem();

            const value = market.evaluate({});

            expect(value).toBe(0);
        });

        it('should calculate value for all standard elements', () => {
            const market = new OfficialMarketSystem();

            const value = market.evaluate({
                Fe: 1,
                O: 1,
                Si: 1,
                Ni: 1,
                Mg: 1,
                S: 1,
                Co: 1,
                Cr: 1,
                Mn: 1,
            });

            expect(value).toBe(50 + 20 + 40 + 150 + 80 + 60 + 200 + 180 + 120); // 900
        });
    });
});

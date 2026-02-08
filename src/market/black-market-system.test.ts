import { describe, it, expect } from 'vitest';
import { BlackMarketSystem } from './black-market-system';

describe('BlackMarketSystem', () => {
    describe('evaluate', () => {
        it('should calculate total value for rare elements only', () => {
            const market = new BlackMarketSystem();

            const value = market.evaluate({ Co: 5, Cr: 3, Mn: 2 });

            expect(value).toBe(5 * 400 + 3 * 360 + 2 * 240); // 3000
        });

        it('should return zero for common elements', () => {
            const market = new BlackMarketSystem();

            const value = market.evaluate({ Fe: 10, O: 20, Si: 15 });

            expect(value).toBe(0);
        });

        it('should handle mixed inventory with rare and common elements', () => {
            const market = new BlackMarketSystem();

            const value = market.evaluate({ Fe: 10, Co: 2, Ni: 5, Cr: 1 });

            expect(value).toBe(2 * 400 + 1 * 360); // 920
        });

        it('should return zero for empty inventory', () => {
            const market = new BlackMarketSystem();

            const value = market.evaluate({});

            expect(value).toBe(0);
        });

        it('should handle zero amounts', () => {
            const market = new BlackMarketSystem();

            const value = market.evaluate({ Co: 0, Cr: 2 });

            expect(value).toBe(2 * 360); // 720
        });

        it('should apply 2x standard prices for rare elements', () => {
            const market = new BlackMarketSystem();

            const value = market.evaluate({ Co: 1, Cr: 1, Mn: 1 });

            // Standard prices: Co=200, Cr=180, Mn=120
            // Black market: 2x = 400, 360, 240
            expect(value).toBe(400 + 360 + 240); // 1000
        });
    });
});

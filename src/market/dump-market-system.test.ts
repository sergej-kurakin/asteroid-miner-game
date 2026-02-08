import { describe, it, expect } from 'vitest';
import { DumpMarketSystem } from './dump-market-system';

describe('DumpMarketSystem', () => {
    describe('evaluate', () => {
        it('should calculate total value at 1 credit per unit', () => {
            const market = new DumpMarketSystem();

            const value = market.evaluate({ Fe: 10, Ni: 5, O: 3 });

            expect(value).toBe(18); // 10 + 5 + 3
        });

        it('should return zero for empty inventory', () => {
            const market = new DumpMarketSystem();

            const value = market.evaluate({});

            expect(value).toBe(0);
        });

        it('should ignore zero amounts', () => {
            const market = new DumpMarketSystem();

            const value = market.evaluate({ Fe: 0, Ni: 5, O: 3 });

            expect(value).toBe(8); // 5 + 3
        });

        it('should work with single element', () => {
            const market = new DumpMarketSystem();

            const value = market.evaluate({ Co: 42 });

            expect(value).toBe(42);
        });

        it('should sum all positive amounts regardless of type', () => {
            const market = new DumpMarketSystem();

            const value = market.evaluate({
                Fe: 1,
                O: 2,
                Si: 3,
                Ni: 4,
                Mg: 5,
                S: 6,
                Co: 7,
                Cr: 8,
                Mn: 9,
            });

            expect(value).toBe(1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9); // 45
        });
    });
});

import { describe, it, expect } from 'vitest';
import { TradeMediator } from './mediator';

describe('TradeMediator', () => {
    describe('evaluate', () => {
        it('should calculate total value from inventory', () => {
            const mediator = new TradeMediator({ Fe: 50, Ni: 150 });

            const result = mediator.evaluate({ Fe: 10, Ni: 5 });

            expect(result).not.toBeNull();
            expect(result!.creditsDelta).toBe(10 * 50 + 5 * 150); // 1250
            expect(result!.itemsSold).toEqual({ Fe: 10, Ni: 5 });
        });

        it('should handle zero amounts', () => {
            const mediator = new TradeMediator({ Fe: 50, Ni: 150 });

            const result = mediator.evaluate({ Fe: 0, Ni: 5 });

            expect(result).not.toBeNull();
            expect(result!.creditsDelta).toBe(750);
            expect(result!.itemsSold).toEqual({ Ni: 5 });
        });

        it('should handle missing prices as zero', () => {
            const mediator = new TradeMediator({ Fe: 50 });

            const result = mediator.evaluate({ Fe: 10, Unknown: 5 });

            expect(result).not.toBeNull();
            expect(result!.creditsDelta).toBe(500);
            expect(result!.itemsSold).toEqual({ Fe: 10, Unknown: 5 });
        });

        it('should return null for empty inventory', () => {
            const mediator = new TradeMediator({ Fe: 50 });

            const result = mediator.evaluate({});

            expect(result).toBeNull();
        });
    });
});

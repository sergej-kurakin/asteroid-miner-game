// Element prices lookup
export interface ElementPrices {
    [element: string]: number;
}

// Mediator output: pure calculation result
export interface TradeTransaction {
    creditsDelta: number;
    itemsSold: { [element: string]: number };
}

// Discriminated union for sell outcome
export type SellAllResult =
    | { success: true; totalValue: number; itemsSold: { [element: string]: number } }
    | { success: false; error: 'empty_hold' };

// Public market interface
export interface IMarket {
    sellAll(key: string): SellAllResult;
    canSell(): boolean;
}

// Market system strategy interface
export interface IMarketSystem {
    evaluate(inventory: { [element: string]: number }): number;
}

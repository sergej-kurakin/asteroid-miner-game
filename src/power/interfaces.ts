export type BuyPowerResult =
    | { success: true; newPower: number }
    | { success: false; error: 'insufficient_credits' | 'power_full' };

export interface IPowerController {
    buyPower(): BuyPowerResult;
    canBuyPower(): boolean;
    getCurrentPower(): number;
    getMaxPower(): number;
}

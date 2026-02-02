export interface BuyPowerResult {
    success: boolean;
    newPower?: number;
    error?: 'insufficient_credits' | 'power_full';
}

export interface IPowerController {
    buyPower(): BuyPowerResult;
    canBuyPower(): boolean;
    getCurrentPower(): number;
    getMaxPower(): number;
}

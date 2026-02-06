// src/ui/utils.ts
// Utility functions for UI formatting

export function formatNumber(num: number): string {
    return num.toLocaleString();
}

export function formatCredits(value: number): string {
    return `${formatNumber(value)} cr`;
}

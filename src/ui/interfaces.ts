// src/ui/interfaces.ts
// Type definitions for UI components

export interface UIComponent {
    mount(): void;
    render(): void;
    destroy(): void;
}

export type GaugeType = 'power' | 'laser' | 'hold';

export interface GaugeConfig {
    type: GaugeType;
    valueElementId: string;
    fillElementId: string;
}

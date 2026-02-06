// src/ui/components/gauge.ts
// Reusable gauge component for power, laser, and hold displays

import type { Observable, GameState } from '../../gamestate';
import { BaseComponent } from '../base-component';
import type { GaugeConfig, GaugeType } from '../interfaces';

export class GaugeComponent extends BaseComponent {
    private valueEl: HTMLElement | null = null;
    private fillEl: HTMLElement | null = null;
    private readonly config: GaugeConfig;

    constructor(state$: Observable<GameState>, type: GaugeType) {
        super(state$);
        this.config = this.getConfig(type);
    }

    private getConfig(type: GaugeType): GaugeConfig {
        switch (type) {
            case 'power':
                return {
                    type: 'power',
                    valueElementId: 'power-value',
                    fillElementId: 'power-fill'
                };
            case 'laser':
                return {
                    type: 'laser',
                    valueElementId: 'laser-value',
                    fillElementId: 'laser-fill'
                };
            case 'hold':
                return {
                    type: 'hold',
                    valueElementId: 'hold-value',
                    fillElementId: 'hold-fill'
                };
        }
    }

    mount(): void {
        this.valueEl = document.getElementById(this.config.valueElementId);
        this.fillEl = document.getElementById(this.config.fillElementId);

        this.setupSubscriptions();
        this.render();
    }

    private setupSubscriptions(): void {
        switch (this.config.type) {
            case 'power':
                this.subscribeToMultiple(['power', 'power_capacity'], () => this.render());
                break;
            case 'laser':
                this.subscribeToMultiple(['is_mining', 'mining_progress', 'asteroid'], () => this.render());
                break;
            case 'hold':
                this.subscribeToMultiple(['hold_used', 'hold_capacity'], () => this.render());
                break;
        }
    }

    render(): void {
        if (!this.valueEl || !this.fillEl) return;

        const state = this.state$.getState();

        switch (this.config.type) {
            case 'power':
                this.renderPowerGauge(state);
                break;
            case 'laser':
                this.renderLaserGauge(state);
                break;
            case 'hold':
                this.renderHoldGauge(state);
                break;
        }
    }

    private renderPowerGauge(state: Readonly<GameState>): void {
        const percent = (state.power / state.power_capacity) * 100;
        this.valueEl!.textContent = `${Math.round(state.power)} / ${state.power_capacity}`;
        this.fillEl!.style.width = `${percent}%`;
    }

    private renderLaserGauge(state: Readonly<GameState>): void {
        if (state.is_mining) {
            this.valueEl!.textContent = 'Active';
            this.fillEl!.style.width = `${state.mining_progress * 100}%`;
        } else {
            this.valueEl!.textContent = state.asteroid ? 'Ready' : 'Standby';
            this.fillEl!.style.width = '0%';
        }
    }

    private renderHoldGauge(state: Readonly<GameState>): void {
        this.valueEl!.textContent = `${state.hold_used} / ${state.hold_capacity}`;
        this.fillEl!.style.width = `${(state.hold_used / state.hold_capacity) * 100}%`;
    }
}

// src/ui/components/power-button.ts
// Power button component with buy power functionality

import type { Observable, GameState } from '../../gamestate';
import type { IPowerController } from '../../power';
import { BaseComponent } from '../base-component';

export class PowerButton extends BaseComponent {
    private currentEl: HTMLElement | null = null;
    private maxEl: HTMLElement | null = null;
    private btnEl: HTMLButtonElement | null = null;
    private powerController: IPowerController;
    private onBuyPower: () => void;
    private clickHandler: (() => void) | null = null;

    constructor(
        state$: Observable<GameState>,
        powerController: IPowerController,
        onBuyPower: () => void
    ) {
        super(state$);
        this.powerController = powerController;
        this.onBuyPower = onBuyPower;
    }

    mount(): void {
        this.currentEl = document.getElementById('power-current');
        this.maxEl = document.getElementById('power-max');
        this.btnEl = document.getElementById('btn-buy-power') as HTMLButtonElement;

        if (this.btnEl) {
            this.clickHandler = () => this.onBuyPower();
            this.btnEl.addEventListener('click', this.clickHandler);
        }

        this.subscribeToMultiple(['power', 'power_capacity', 'credits'], () => this.render());
        this.render();
    }

    render(): void {
        const state = this.state$.getState();
        const canBuy = this.powerController.canBuyPower();

        if (this.currentEl) {
            this.currentEl.textContent = Math.round(state.power).toString();
        }

        if (this.maxEl) {
            this.maxEl.textContent = state.power_capacity.toString();
        }

        if (this.btnEl) {
            this.btnEl.disabled = !canBuy;
            this.btnEl.className = `btn btn-buy-power ${canBuy ? 'affordable' : 'unaffordable'}`;
        }
    }

    destroy(): void {
        if (this.btnEl && this.clickHandler) {
            this.btnEl.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }
        super.destroy();
    }
}

// src/ui/components/credits-display.ts
// Credits display component

import type { Observable, GameState } from '../../gamestate';
import { BaseComponent } from '../base-component';
import { formatNumber } from '../utils';

export class CreditsDisplay extends BaseComponent {
    private el: HTMLElement | null = null;

    constructor(state$: Observable<GameState>) {
        super(state$);
    }

    mount(): void {
        this.el = document.getElementById('credits-value');
        this.subscribeToProperty('credits', () => this.render());
        this.render();
    }

    render(): void {
        if (this.el) {
            this.el.textContent = formatNumber(this.state$.getState().credits);
        }
    }
}

// src/ui/components/composition-grid.ts
// Composition grid component showing asteroid composition and estimated yield

import type { Observable, GameState } from '../../gamestate';
import { BaseComponent } from '../base-component';

export class CompositionGrid extends BaseComponent {
    private el: HTMLElement | null = null;

    constructor(state$: Observable<GameState>) {
        super(state$);
    }

    mount(): void {
        this.el = document.getElementById('composition-grid');
        this.subscribeToProperty('asteroid', () => this.render());
        this.render();
    }

    render(): void {
        if (!this.el) return;

        const asteroid = this.state$.getState().asteroid;

        if (!asteroid) {
            this.el.innerHTML = this.renderEmptyPlaceholder();
            return;
        }

        this.el.innerHTML = this.renderAsteroidComposition(asteroid);
    }

    private renderEmptyPlaceholder(): string {
        return `
            <div class="composition-item" style="opacity: 0.3;">
                <div class="composition-element">--</div>
                <div class="composition-percent">--%</div>
            </div>
            <div class="composition-item" style="opacity: 0.3;">
                <div class="composition-element">--</div>
                <div class="composition-percent">--%</div>
            </div>
            <div class="composition-item" style="opacity: 0.3;">
                <div class="composition-element">--</div>
                <div class="composition-percent">--%</div>
            </div>
        `;
    }

    private renderAsteroidComposition(asteroid: NonNullable<GameState['asteroid']>): string {
        // Header: Asteroid type and total weight
        let html = `
            <div class="composition-item" style="font-weight: bold; border-bottom: 1px solid currentColor; padding-bottom: 4px; margin-bottom: 4px;">
                <div class="composition-element">${asteroid.type.toUpperCase()}</div>
                <div class="composition-percent">${asteroid.totalYield} kg</div>
            </div>
        `;

        // Composition percentages
        for (const [element, percent] of Object.entries(asteroid.composition)) {
            html += `
                <div class="composition-item">
                    <div class="composition-element">${element}</div>
                    <div class="composition-percent">${percent}%</div>
                </div>
            `;
        }

        // Divider before estimated yield
        html += `
            <div style="grid-column: 1 / -1; border-top: 1px solid rgba(0, 255, 136, 0.2); margin: 8px 0 4px 0;"></div>
            <div class="composition-item" style="font-weight: bold; opacity: 0.7; font-size: 11px;">
                <div class="composition-element" style="grid-column: 1 / -1;">ESTIMATED YIELD</div>
            </div>
        `;

        // Estimated yield amounts
        for (const [element, percent] of Object.entries(asteroid.composition)) {
            const estimatedAmount = Math.floor(asteroid.totalYield * (percent / 100));
            html += `
                <div class="composition-item" style="opacity: 0.8;">
                    <div class="composition-element">${element}</div>
                    <div class="composition-percent">${estimatedAmount} kg</div>
                </div>
            `;
        }

        return html;
    }
}

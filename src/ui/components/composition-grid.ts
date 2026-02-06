// src/ui/components/composition-grid.ts
// Composition grid component showing asteroid composition

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
        let html = `
            <div class="composition-item" style="font-weight: bold; border-bottom: 1px solid currentColor; padding-bottom: 4px; margin-bottom: 4px;">
                <div class="composition-element">${asteroid.type.toUpperCase()}</div>
                <div class="composition-percent">${asteroid.totalYield} kg</div>
            </div>
        `;

        for (const [element, percent] of Object.entries(asteroid.composition)) {
            html += `
                <div class="composition-item">
                    <div class="composition-element">${element}</div>
                    <div class="composition-percent">${percent}%</div>
                </div>
            `;
        }

        return html;
    }
}

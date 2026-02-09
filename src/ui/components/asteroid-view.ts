// src/ui/components/asteroid-view.ts
// Asteroid view component - manages placeholder and composition section visibility

import type { Observable, GameState } from '../../gamestate';
import { BaseComponent } from '../base-component';

export class AsteroidView extends BaseComponent {
    private placeholderEl: HTMLElement | null = null;
    private compositionSection: HTMLElement | null = null;

    constructor(state$: Observable<GameState>) {
        super(state$);
    }

    mount(): void {
        this.placeholderEl = document.getElementById('asteroid-placeholder');
        this.compositionSection = document.getElementById('composition-section');
        this.subscribeToProperty('asteroid', () => this.render());
        this.render();
    }

    render(): void {
        const state = this.state$.getState();
        const hasAsteroid = state.asteroid !== null;

        if (this.placeholderEl) {
            this.placeholderEl.style.display = hasAsteroid ? 'none' : 'flex';
        }

        if (this.compositionSection) {
            this.compositionSection.style.display = hasAsteroid ? 'flex' : 'none';
        }
    }
}

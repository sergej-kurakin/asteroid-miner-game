// src/ui/components/asteroid-view.ts
// Asteroid view component with mining progress

import type { Observable, GameState } from '../../gamestate';
import { BaseComponent } from '../base-component';

export class AsteroidView extends BaseComponent {
    private asteroidEl: HTMLElement | null = null;
    private placeholderEl: HTMLElement | null = null;
    private progressContainerEl: HTMLElement | null = null;
    private progressFillEl: HTMLElement | null = null;

    constructor(state$: Observable<GameState>) {
        super(state$);
    }

    mount(): void {
        this.asteroidEl = document.getElementById('asteroid');
        this.placeholderEl = document.getElementById('asteroid-placeholder');
        this.progressContainerEl = document.getElementById('mining-progress-container');
        this.progressFillEl = document.getElementById('mining-progress-fill');

        this.subscribeToMultiple(['asteroid', 'is_mining'], () => this.render());
        this.render();
    }

    render(): void {
        const state = this.state$.getState();
        const hasAsteroid = state.asteroid !== null;

        if (this.asteroidEl) {
            this.asteroidEl.classList.toggle('visible', hasAsteroid);
            this.asteroidEl.classList.toggle('mining', state.is_mining);
        }

        if (this.placeholderEl) {
            this.placeholderEl.style.display = hasAsteroid ? 'none' : 'block';
        }

        if (this.progressContainerEl) {
            this.progressContainerEl.classList.toggle('visible', state.is_mining);
        }
    }

    setProgress(progress: number): void {
        if (this.progressFillEl) {
            this.progressFillEl.style.width = `${progress * 100}%`;
        }
    }

    showAsteroid(): void {
        if (this.asteroidEl) {
            this.asteroidEl.classList.add('visible');
        }
        if (this.placeholderEl) {
            this.placeholderEl.style.display = 'none';
        }
    }

    hideAsteroid(): void {
        if (this.asteroidEl) {
            this.asteroidEl.classList.remove('visible', 'mining');
        }
        if (this.placeholderEl) {
            this.placeholderEl.style.display = 'block';
        }
        if (this.progressContainerEl) {
            this.progressContainerEl.classList.remove('visible');
        }
        if (this.progressFillEl) {
            this.progressFillEl.style.width = '0%';
        }
    }

    setMining(isMining: boolean): void {
        if (this.asteroidEl) {
            this.asteroidEl.classList.toggle('mining', isMining);
        }
        if (this.progressContainerEl) {
            this.progressContainerEl.classList.toggle('visible', isMining);
        }
    }
}

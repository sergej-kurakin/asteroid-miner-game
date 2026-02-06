// src/ui/components/control-buttons.ts
// Control buttons component for scan/mine/abandon actions

import type { Observable, GameState } from '../../gamestate';
import type { IAsteroidsController } from '../../asteroids';
import { BaseComponent } from '../base-component';

export interface ControlHandlers {
    onScan: () => void;
    onMine: () => void;
    onAbandon: () => void;
}

export class ControlButtons extends BaseComponent {
    private btnScan: HTMLButtonElement | null = null;
    private btnMine: HTMLButtonElement | null = null;
    private btnAbandon: HTMLButtonElement | null = null;
    private asteroidsController: IAsteroidsController;
    private handlers: ControlHandlers;
    private scanHandler: (() => void) | null = null;
    private mineHandler: (() => void) | null = null;
    private abandonHandler: (() => void) | null = null;

    constructor(
        state$: Observable<GameState>,
        asteroidsController: IAsteroidsController,
        handlers: ControlHandlers
    ) {
        super(state$);
        this.asteroidsController = asteroidsController;
        this.handlers = handlers;
    }

    mount(): void {
        this.btnScan = document.getElementById('btn-scan') as HTMLButtonElement;
        this.btnMine = document.getElementById('btn-mine') as HTMLButtonElement;
        this.btnAbandon = document.getElementById('btn-abandon') as HTMLButtonElement;

        this.attachEventListeners();
        this.subscribeToMultiple(['asteroid', 'is_mining', 'power'], () => this.render());
        this.render();
    }

    private attachEventListeners(): void {
        if (this.btnScan) {
            this.scanHandler = () => this.handlers.onScan();
            this.btnScan.addEventListener('click', this.scanHandler);
        }

        if (this.btnMine) {
            this.mineHandler = () => this.handlers.onMine();
            this.btnMine.addEventListener('click', this.mineHandler);
        }

        if (this.btnAbandon) {
            this.abandonHandler = () => this.handlers.onAbandon();
            this.btnAbandon.addEventListener('click', this.abandonHandler);
        }
    }

    render(): void {
        const state = this.state$.getState();

        if (this.btnScan) {
            this.btnScan.disabled = !this.asteroidsController.canScan();
        }

        if (this.btnMine) {
            this.btnMine.disabled = state.is_mining || state.asteroid === null || state.power < 10;
        }

        if (this.btnAbandon) {
            this.btnAbandon.disabled = !this.asteroidsController.canAbandon();
        }
    }

    destroy(): void {
        if (this.btnScan && this.scanHandler) {
            this.btnScan.removeEventListener('click', this.scanHandler);
            this.scanHandler = null;
        }

        if (this.btnMine && this.mineHandler) {
            this.btnMine.removeEventListener('click', this.mineHandler);
            this.mineHandler = null;
        }

        if (this.btnAbandon && this.abandonHandler) {
            this.btnAbandon.removeEventListener('click', this.abandonHandler);
            this.abandonHandler = null;
        }

        super.destroy();
    }
}

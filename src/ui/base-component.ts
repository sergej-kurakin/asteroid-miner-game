// src/ui/base-component.ts
// Abstract base class for UI components with subscription management

import type { GameState, Observable } from '../gamestate';
import type { UIComponent } from './interfaces';

export abstract class BaseComponent implements UIComponent {
    protected subscriptions: Array<() => void> = [];

    constructor(protected state$: Observable<GameState>) {}

    abstract mount(): void;
    abstract render(): void;

    protected subscribeToProperty<K extends keyof GameState>(
        property: K,
        callback: () => void
    ): void {
        const unsub = this.state$.subscribeToProperty(property, callback);
        this.subscriptions.push(unsub);
    }

    protected subscribeToMultiple(
        properties: (keyof GameState)[],
        callback: () => void
    ): void {
        for (const prop of properties) {
            this.subscribeToProperty(prop, callback);
        }
    }

    destroy(): void {
        this.subscriptions.forEach(unsub => unsub());
        this.subscriptions = [];
    }
}

// src/ui/components/status-display.ts
// Status display component (imperative API)

import type { UIComponent } from '../interfaces';

export class StatusDisplay implements UIComponent {
    private el: HTMLElement | null = null;

    mount(): void {
        this.el = document.getElementById('status-text');
    }

    render(): void {
        // Status is updated imperatively via setMessage
    }

    setMessage(text: string): void {
        if (this.el) {
            this.el.textContent = text;
        }
    }

    destroy(): void {
        this.el = null;
    }
}

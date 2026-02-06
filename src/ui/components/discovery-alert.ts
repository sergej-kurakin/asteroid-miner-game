// src/ui/components/discovery-alert.ts
// Discovery alert component (imperative API with timer management)

import type { UIComponent } from '../interfaces';
import { CONFIG } from '../../config/config';

interface ElementConfig {
    name: string;
    price: number;
}

export class DiscoveryAlert implements UIComponent {
    private alertEl: HTMLElement | null = null;
    private elementEl: HTMLElement | null = null;
    private timeoutId: number | null = null;
    private elements: { [symbol: string]: ElementConfig };

    constructor(elements: { [symbol: string]: ElementConfig }) {
        this.elements = elements;
    }

    mount(): void {
        this.alertEl = document.getElementById('discovery-alert');
        this.elementEl = document.getElementById('discovery-element');
    }

    render(): void {
        // Discovery is updated imperatively via show()
    }

    show(element: string): void {
        if (!this.alertEl || !this.elementEl) return;

        if (this.timeoutId !== null) {
            clearTimeout(this.timeoutId);
        }

        const elementData = this.elements[element];
        const name = elementData?.name ?? element;
        this.elementEl.textContent = `${element} - ${name}`;
        this.alertEl.classList.add('visible');

        this.timeoutId = window.setTimeout(() => {
            this.alertEl!.classList.remove('visible');
            this.timeoutId = null;
        }, CONFIG.alertDuration);
    }

    destroy(): void {
        if (this.timeoutId !== null) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        this.alertEl = null;
        this.elementEl = null;
    }
}

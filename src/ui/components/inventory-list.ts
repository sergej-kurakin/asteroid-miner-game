// src/ui/components/inventory-list.ts
// Inventory list component with sell button state management

import type { Observable, GameState } from '../../gamestate';
import { BaseComponent } from '../base-component';
import { formatNumber } from '../utils';

interface ElementConfig {
    name: string;
    price: number;
}

export class InventoryList extends BaseComponent {
    private listEl: HTMLElement | null = null;
    private sellBtn: HTMLButtonElement | null = null;
    private elements: { [symbol: string]: ElementConfig };

    constructor(state$: Observable<GameState>, elements: { [symbol: string]: ElementConfig }) {
        super(state$);
        this.elements = elements;
    }

    mount(): void {
        this.listEl = document.getElementById('inventory-list');
        this.sellBtn = document.getElementById('btn-sell') as HTMLButtonElement;
        this.subscribeToMultiple(['inventory', 'hold_used'], () => this.render());
        this.render();
    }

    render(): void {
        if (!this.listEl) return;

        const inventory = this.state$.getState().inventory;
        const items = Object.keys(inventory).filter(el => inventory[el] > 0);

        if (items.length === 0) {
            this.listEl.innerHTML = '<div class="inventory-empty">Hold is empty</div>';
            if (this.sellBtn) this.sellBtn.disabled = true;
            return;
        }

        if (this.sellBtn) this.sellBtn.disabled = false;

        let html = '';
        for (const el of items) {
            const amount = inventory[el];
            const price = this.elements[el]?.price ?? 0;
            const value = amount * price;
            html += `
                <div class="inventory-item">
                    <div class="inventory-element">${el}</div>
                    <div class="inventory-details">
                        <div class="inventory-amount">${amount} kg</div>
                        <div class="inventory-value">${formatNumber(value)} cr</div>
                    </div>
                </div>
            `;
        }

        this.listEl.innerHTML = html;
    }
}

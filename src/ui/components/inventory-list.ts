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
    private sellBtnOfficial: HTMLButtonElement | null = null;
    private sellBtnBlack: HTMLButtonElement | null = null;
    private sellBtnDump: HTMLButtonElement | null = null;
    private elements: { [symbol: string]: ElementConfig };

    constructor(state$: Observable<GameState>, elements: { [symbol: string]: ElementConfig }) {
        super(state$);
        this.elements = elements;
    }

    mount(): void {
        this.listEl = document.getElementById('inventory-list');
        this.sellBtnOfficial = document.getElementById('btn-sell-official') as HTMLButtonElement;
        this.sellBtnBlack = document.getElementById('btn-sell-black') as HTMLButtonElement;
        this.sellBtnDump = document.getElementById('btn-sell-dump') as HTMLButtonElement;
        this.subscribeToMultiple(['inventory', 'hold_used'], () => this.render());
        this.render();
    }

    render(): void {
        if (!this.listEl) return;

        const inventory = this.state$.getState().inventory;
        const items = Object.keys(inventory).filter(el => inventory[el] > 0);

        if (items.length === 0) {
            this.listEl.innerHTML = '<div class="inventory-empty">Hold is empty</div>';
            this.disableAllButtons();
            return;
        }

        this.enableAllButtons();

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

    private disableAllButtons(): void {
        if (this.sellBtnOfficial) this.sellBtnOfficial.disabled = true;
        if (this.sellBtnBlack) this.sellBtnBlack.disabled = true;
        if (this.sellBtnDump) this.sellBtnDump.disabled = true;
    }

    private enableAllButtons(): void {
        if (this.sellBtnOfficial) this.sellBtnOfficial.disabled = false;
        if (this.sellBtnBlack) this.sellBtnBlack.disabled = false;
        if (this.sellBtnDump) this.sellBtnDump.disabled = false;
    }
}

// src/ui/components/inventory-list.ts
// Inventory list component with sell button state management

import type { Observable, GameState } from '../../gamestate';
import type { IWorldService } from '../../world';
import { CellType } from '../../world';
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

    constructor(
        state$: Observable<GameState>,
        elements: { [symbol: string]: ElementConfig },
        private readonly worldService: IWorldService
    ) {
        super(state$);
        this.elements = elements;
    }

    mount(): void {
        this.listEl = document.getElementById('inventory-list');
        this.sellBtnOfficial = document.getElementById('btn-sell-official') as HTMLButtonElement;
        this.sellBtnBlack = document.getElementById('btn-sell-black') as HTMLButtonElement;
        this.sellBtnDump = document.getElementById('btn-sell-dump') as HTMLButtonElement;
        this.subscribeToMultiple(['inventory', 'hold_used', 'current_cell'], () => this.render());
        this.render();
    }

    private isAtMarket(): boolean {
        const state = this.state$.getState();
        const cell = this.worldService.getCellAt(state.current_cell);
        return cell?.type === CellType.Market;
    }

    private hasInventoryItems(): boolean {
        const inventory = this.state$.getState().inventory;
        return Object.values(inventory).some(amount => amount > 0);
    }

    private updateButtonStates(): void {
        const hasItems = this.hasInventoryItems();
        const atMarket = this.isAtMarket();
        const canSell = hasItems && atMarket;

        if (this.sellBtnOfficial) {
            this.sellBtnOfficial.disabled = !canSell;
            this.updateButtonClass(this.sellBtnOfficial, hasItems, atMarket);
        }
        if (this.sellBtnBlack) {
            this.sellBtnBlack.disabled = !canSell;
            this.updateButtonClass(this.sellBtnBlack, hasItems, atMarket);
        }
        if (this.sellBtnDump) {
            this.sellBtnDump.disabled = !canSell;
            this.updateButtonClass(this.sellBtnDump, hasItems, atMarket);
        }
    }

    private updateButtonClass(button: HTMLButtonElement, hasItems: boolean, atMarket: boolean): void {
        button.classList.remove('btn-sell--empty', 'btn-sell--not-at-market');
        if (!hasItems) {
            button.classList.add('btn-sell--empty');
        } else if (!atMarket) {
            button.classList.add('btn-sell--not-at-market');
        }
    }

    render(): void {
        if (!this.listEl) return;

        const inventory = this.state$.getState().inventory;
        const items = Object.keys(inventory).filter(el => inventory[el] > 0);

        if (items.length === 0) {
            this.listEl.innerHTML = '<div class="inventory-empty">Hold is empty</div>';
        } else {
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

        this.updateButtonStates();
    }
}

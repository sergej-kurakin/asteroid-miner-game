import type { Observable, GameState } from '../../gamestate';
import type { IToolController } from '../../tools/interfaces';
import { BaseComponent } from '../base-component';
import { formatNumber } from '../utils';

export interface ToolPanelHandlers {
    onBuy: (toolId: string) => void;
    onEquip: (toolId: string, slot: number) => void;
    onUnequip: (slot: number) => void;
}

export class ToolPanel extends BaseComponent {
    private el: HTMLElement | null = null;
    private handlers: ToolPanelHandlers;
    private toolController: IToolController;
    private clickHandler: ((e: Event) => void) | null = null;

    constructor(
        state$: Observable<GameState>,
        toolController: IToolController,
        handlers: ToolPanelHandlers
    ) {
        super(state$);
        this.toolController = toolController;
        this.handlers = handlers;
    }

    mount(): void {
        this.el = document.getElementById('tool-panel');
        this.subscribeToMultiple(
            ['credits', 'equipped_tools', 'tools_owned', 'current_ship_level'],
            () => this.render()
        );
        this.render();
    }

    render(): void {
        if (!this.el) return;

        this.cleanupClickHandler();

        const maxSlots = this.toolController.getAvailableSlots() +
            this.toolController.getEquippedTools().length;
        const equipped = this.toolController.getEquippedTools();
        const allTools = this.toolController.getAllTools();
        const credits = this.state$.getState().credits;

        // Build equipped slots section
        let slotsHtml = '<div class="tool-slots">';
        slotsHtml += '<div class="tool-section-title">Equipped Tools</div>';
        for (let i = 0; i < maxSlots; i++) {
            const equippedInSlot = equipped.find(t => t.slot === i);
            if (equippedInSlot) {
                const toolData = this.toolController.getToolData(equippedInSlot.toolId);
                slotsHtml += `
                    <div class="tool-slot tool-slot-filled">
                        <span class="tool-slot-name">${toolData?.name ?? equippedInSlot.toolId}</span>
                        <button class="btn-tool-action btn-unequip" data-action="unequip" data-slot="${i}">X</button>
                    </div>
                `;
            } else {
                slotsHtml += `
                    <div class="tool-slot tool-slot-empty">
                        <span class="tool-slot-name">Slot ${i + 1} - Empty</span>
                    </div>
                `;
            }
        }
        slotsHtml += '</div>';

        // Build tool shop section grouped by tier
        let shopHtml = '<div class="tool-shop">';
        shopHtml += '<div class="tool-section-title">Tool Shop</div>';

        const tiers = [
            { tier: 1, name: 'Tier 1' },
            { tier: 2, name: 'Tier 2' },
            { tier: 3, name: 'Tier 3' }
        ];

        for (const { tier, name } of tiers) {
            const tierTools = allTools.filter(t => t.tier === tier);
            shopHtml += `<div class="tool-tier-label">${name}</div>`;

            for (const tool of tierTools) {
                const owned = this.toolController.isToolOwned(tool.id);
                const isEquipped = this.toolController.isToolEquipped(tool.id);
                const canAfford = credits >= tool.cost;
                const hasSlot = this.toolController.getAvailableSlots() > 0;

                // Find first empty slot for equipping
                const firstEmptySlot = this.findFirstEmptySlot(maxSlots, equipped);

                let actionHtml = '';
                if (isEquipped) {
                    actionHtml = '<span class="tool-status">Equipped</span>';
                } else if (owned) {
                    actionHtml = `<button class="btn-tool-action btn-equip ${hasSlot ? '' : 'disabled'}"
                        data-action="equip" data-tool-id="${tool.id}" data-slot="${firstEmptySlot}"
                        ${!hasSlot ? 'disabled' : ''}>Equip</button>`;
                } else {
                    actionHtml = `<button class="btn-tool-action btn-buy ${canAfford ? '' : 'disabled'}"
                        data-action="buy" data-tool-id="${tool.id}"
                        ${!canAfford ? 'disabled' : ''}>Buy ${formatNumber(tool.cost)} cr</button>`;
                }

                const yieldStr = tool.yieldBonus > 0 ? `+${Math.round(tool.yieldBonus * 100)}%` :
                    tool.yieldBonus < 0 ? `${Math.round(tool.yieldBonus * 100)}%` : '0%';
                const rareStr = tool.rareBonus > 0 ? `+${Math.round(tool.rareBonus * 100)}%` :
                    tool.rareBonus < 0 ? `${Math.round(tool.rareBonus * 100)}%` : '0%';
                const powerStr = tool.powerCostBonus > 0 ? `+${Math.round(tool.powerCostBonus * 100)}%` : '0%';

                shopHtml += `
                    <div class="tool-item ${owned ? 'tool-owned' : ''} ${isEquipped ? 'tool-equipped' : ''}">
                        <div class="tool-info">
                            <div class="tool-name">${tool.name}</div>
                            <div class="tool-stats">
                                <span class="tool-stat">Yield: ${yieldStr}</span>
                                <span class="tool-stat">Rare: ${rareStr}</span>
                                <span class="tool-stat">Power: ${powerStr}</span>
                            </div>
                        </div>
                        <div class="tool-action">${actionHtml}</div>
                    </div>
                `;
            }
        }
        shopHtml += '</div>';

        this.el.innerHTML = slotsHtml + shopHtml;
        this.attachClickHandler();
    }

    private findFirstEmptySlot(maxSlots: number, equipped: { slot: number }[]): number {
        for (let i = 0; i < maxSlots; i++) {
            if (!equipped.some(t => t.slot === i)) {
                return i;
            }
        }
        return 0;
    }

    private attachClickHandler(): void {
        if (!this.el) return;

        this.clickHandler = (e: Event) => {
            const target = e.target as HTMLElement;
            const btn = target.closest('[data-action]') as HTMLElement | null;
            if (!btn) return;

            const action = btn.dataset.action;
            if (action === 'buy') {
                const toolId = btn.dataset.toolId;
                if (toolId) this.handlers.onBuy(toolId);
            } else if (action === 'equip') {
                const toolId = btn.dataset.toolId;
                const slot = parseInt(btn.dataset.slot ?? '0', 10);
                if (toolId) this.handlers.onEquip(toolId, slot);
            } else if (action === 'unequip') {
                const slot = parseInt(btn.dataset.slot ?? '0', 10);
                this.handlers.onUnequip(slot);
            }
        };

        this.el.addEventListener('click', this.clickHandler);
    }

    private cleanupClickHandler(): void {
        if (this.clickHandler && this.el) {
            this.el.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }
    }

    destroy(): void {
        this.cleanupClickHandler();
        super.destroy();
    }
}

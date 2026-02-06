// src/ui/components/ship-info.ts
// Ship info component with dynamic upgrade button

import type { Observable, GameState } from '../../gamestate';
import type { IShipController } from '../../ships';
import { BaseComponent } from '../base-component';
import { formatNumber } from '../utils';

export class ShipInfo extends BaseComponent {
    private el: HTMLElement | null = null;
    private shipController: IShipController;
    private onUpgrade: () => void;
    private upgradeHandler: (() => void) | null = null;

    constructor(
        state$: Observable<GameState>,
        shipController: IShipController,
        onUpgrade: () => void
    ) {
        super(state$);
        this.shipController = shipController;
        this.onUpgrade = onUpgrade;
    }

    mount(): void {
        this.el = document.getElementById('ship-info');
        this.subscribeToMultiple(['credits', 'current_ship_level'], () => this.render());
        this.render();
    }

    render(): void {
        if (!this.el) return;

        this.cleanupUpgradeButton();

        const currentShip = this.shipController.getCurrentShip();
        const nextShip = this.shipController.getNextShip();
        const credits = this.state$.getState().credits;

        let html = `
            <div class="ship-current">
                <div class="ship-level">Level ${currentShip.id}</div>
                <div class="ship-name">${currentShip.name}</div>
                <div class="ship-stats">
                    <div class="ship-stat">
                        <span class="stat-label">Hold:</span>
                        <span class="stat-value">${currentShip.holdCapacity} units</span>
                    </div>
                    <div class="ship-stat">
                        <span class="stat-label">Speed:</span>
                        <span class="stat-value">${(currentShip.miningTime / 1000).toFixed(1)}s</span>
                    </div>
                    <div class="ship-stat">
                        <span class="stat-label">Slots:</span>
                        <span class="stat-value">${currentShip.toolSlots}</span>
                    </div>
                </div>
            </div>
        `;

        if (nextShip) {
            const canAfford = credits >= nextShip.cost;
            html += `
                <div class="ship-upgrade">
                    <div class="upgrade-arrow">▼</div>
                    <div class="ship-next">
                        <div class="ship-name">${nextShip.name}</div>
                        <div class="ship-stats">
                            <div class="ship-stat">
                                <span class="stat-label">Hold:</span>
                                <span class="stat-value">${nextShip.holdCapacity}</span>
                            </div>
                            <div class="ship-stat">
                                <span class="stat-label">Speed:</span>
                                <span class="stat-value">${(nextShip.miningTime / 1000).toFixed(1)}s</span>
                            </div>
                            <div class="ship-stat">
                                <span class="stat-label">Slots:</span>
                                <span class="stat-value">${nextShip.toolSlots}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        class="btn btn-upgrade-ship ${canAfford ? 'affordable' : 'unaffordable'}"
                        id="btn-upgrade-ship"
                        ${!canAfford ? 'disabled' : ''}
                    >
                        Upgrade - ${formatNumber(nextShip.cost)} cr
                    </button>
                </div>
            `;
        } else {
            html += `<div class="ship-max-level"><div class="max-level-text">Maximum Ship Level Reached</div></div>`;
        }

        this.el.innerHTML = html;
        this.attachUpgradeButton();
    }

    private attachUpgradeButton(): void {
        const btnUpgrade = document.getElementById('btn-upgrade-ship') as HTMLButtonElement;
        if (btnUpgrade) {
            this.upgradeHandler = () => this.onUpgrade();
            btnUpgrade.addEventListener('click', this.upgradeHandler);
        }
    }

    private cleanupUpgradeButton(): void {
        if (this.upgradeHandler) {
            const btnUpgrade = document.getElementById('btn-upgrade-ship') as HTMLButtonElement;
            if (btnUpgrade) {
                btnUpgrade.removeEventListener('click', this.upgradeHandler);
            }
            this.upgradeHandler = null;
        }
    }

    destroy(): void {
        this.cleanupUpgradeButton();
        super.destroy();
    }
}

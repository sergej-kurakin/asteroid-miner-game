// src/ui/components/navigation-panel.ts
// Navigation panel for traveling between world cells

import type { Observable, GameState } from '../../gamestate';
import type { CellPosition, World, Cell } from '../../world';
import { getCellAt, isInBounds, findMarkets, findPowerStations, euclideanDistance } from '../../world';
import { CellType, MiningConstraint } from '../../world';
import { BaseComponent } from '../base-component';

export class NavigationPanel extends BaseComponent {
    private nearestMarketEl: HTMLElement | null = null;
    private nearestPowerEl: HTMLElement | null = null;
    private localAsteroidsEl: HTMLElement | null = null;
    private movementCostEl: HTMLElement | null = null;
    private controlsGridEl: HTMLElement | null = null;

    constructor(
        state$: Observable<GameState>,
        private readonly world: World,
        private readonly onTravel: (dest: CellPosition) => void
    ) {
        super(state$);
    }

    mount(): void {
        this.nearestMarketEl = document.getElementById('nav-nearest-market');
        this.nearestPowerEl = document.getElementById('nav-nearest-power');
        this.localAsteroidsEl = document.getElementById('nav-local-asteroids');
        this.movementCostEl = document.getElementById('nav-movement-cost');
        this.controlsGridEl = document.getElementById('nav-controls-grid');

        this.subscribeToMultiple(['current_cell', 'power', 'hold_used', 'is_mining'], () => this.render());
        this.render();
    }

    private findNearestMarket(currentPos: CellPosition): { cell: Cell; distance: number } | null {
        const markets = findMarkets(this.world);
        if (markets.length === 0) return null;

        let nearest = markets[0];
        let minDistance = euclideanDistance(currentPos, nearest.position);

        for (const market of markets) {
            const dist = euclideanDistance(currentPos, market.position);
            if (dist < minDistance) {
                minDistance = dist;
                nearest = market;
            }
        }

        return { cell: nearest, distance: Math.floor(minDistance * 10) / 10 };
    }

    private findNearestPowerStation(currentPos: CellPosition): { cell: Cell; distance: number } | null {
        const stations = findPowerStations(this.world);
        if (stations.length === 0) return null;

        let nearest = stations[0];
        let minDistance = euclideanDistance(currentPos, nearest.position);

        for (const station of stations) {
            const dist = euclideanDistance(currentPos, station.position);
            if (dist < minDistance) {
                minDistance = dist;
                nearest = station;
            }
        }

        return { cell: nearest, distance: Math.floor(minDistance * 10) / 10 };
    }

    private getLocalAsteroidInfo(currentPos: CellPosition): string {
        const cell = getCellAt(this.world, currentPos);
        if (!cell) return 'Unknown location';

        if (cell.type === CellType.Market || cell.type === CellType.PowerStation) {
            return 'No mining zone';
        }

        if (cell.type === CellType.Empty) {
            return 'No asteroids here';
        }

        // Mining cell - show constraint
        const constraint = cell.miningConstraint;
        if (constraint === MiningConstraint.None) {
            return 'BLOCKED (near market)';
        } else if (constraint === MiningConstraint.SmallOnly) {
            return 'Small asteroids only';
        } else {
            return 'All asteroid sizes';
        }
    }

    private renderNavigationGrid(state: GameState, cost: number): string {
        const pos = state.current_cell;
        const axes: Array<{ axis: string; key: keyof CellPosition }> = [
            { axis: 'X', key: 'x' },
            { axis: 'Y', key: 'y' },
            { axis: 'Z', key: 'z' },
        ];

        let html = '';

        for (const { axis, key } of axes) {
            const minusDest = { ...pos, [key]: pos[key] - 1 };
            const plusDest = { ...pos, [key]: pos[key] + 1 };

            const minusDisabled = this.isButtonDisabled(state, minusDest, cost);
            const plusDisabled = this.isButtonDisabled(state, plusDest, cost);

            html += `
                <button class="btn btn-nav btn-nav--minus"
                        data-axis="${axis}"
                        data-delta="-1"
                        ${minusDisabled ? 'disabled' : ''}>
                    ${axis}−
                </button>
                <div class="nav-coord-display">
                    <span class="nav-coord-label">${axis}:</span>
                    <span class="nav-coord-value">${pos[key]}</span>
                </div>
                <button class="btn btn-nav btn-nav--plus"
                        data-axis="${axis}"
                        data-delta="+1"
                        ${plusDisabled ? 'disabled' : ''}>
                    ${axis}+
                </button>
            `;
        }

        return html;
    }

    private isButtonDisabled(state: GameState, dest: CellPosition, cost: number): boolean {
        return state.is_mining || state.power < cost || !isInBounds(dest);
    }

    render(): void {
        const state = this.state$.getState();
        const currentPos = state.current_cell;

        const steps = Math.floor(state.hold_used / 50);
        const cost = Math.ceil(20 * (1 + steps * 0.1));

        // Render Surrounding World section
        if (this.nearestMarketEl) {
            const nearestMarket = this.findNearestMarket(currentPos);
            if (nearestMarket) {
                const { x, y, z } = nearestMarket.cell.position;
                const distanceDisplay = nearestMarket.distance === 0
                    ? '<span class="at-location">AT THIS LOCATION</span>'
                    : `${nearestMarket.distance} units`;
                this.nearestMarketEl.innerHTML =
                    `<span>Market:</span><span>(${x}, ${y}, ${z}) - ${distanceDisplay}</span>`;
            } else {
                this.nearestMarketEl.innerHTML = '<span>Market:</span><span>None found</span>';
            }
        }

        if (this.nearestPowerEl) {
            const nearestPower = this.findNearestPowerStation(currentPos);
            if (nearestPower) {
                const { x, y, z } = nearestPower.cell.position;
                const distanceDisplay = nearestPower.distance === 0
                    ? '<span class="at-location">AT THIS LOCATION</span>'
                    : `${nearestPower.distance} units`;
                this.nearestPowerEl.innerHTML =
                    `<span>Power:</span><span>(${x}, ${y}, ${z}) - ${distanceDisplay}</span>`;
            } else {
                this.nearestPowerEl.innerHTML = '<span>Power:</span><span>None found</span>';
            }
        }

        if (this.localAsteroidsEl) {
            const asteroidInfo = this.getLocalAsteroidInfo(currentPos);
            this.localAsteroidsEl.innerHTML = `<span>Local:</span><span>${asteroidInfo}</span>`;
        }

        // Render Navigation Controls section
        if (this.movementCostEl) {
            this.movementCostEl.textContent = `Move cost: ${cost} pwr`;
        }

        if (this.controlsGridEl) {
            this.controlsGridEl.innerHTML = this.renderNavigationGrid(state, cost);

            // Attach event delegation for buttons
            this.controlsGridEl.querySelectorAll('.btn-nav').forEach(btn => {
                if (!btn.hasAttribute('disabled')) {
                    const axis = btn.getAttribute('data-axis');
                    const delta = parseInt(btn.getAttribute('data-delta') || '0');

                    if (axis && delta !== 0) {
                        btn.addEventListener('click', () => {
                            const dest = { ...currentPos };
                            const key = axis.toLowerCase() as keyof CellPosition;
                            dest[key] = currentPos[key] + delta;
                            this.onTravel(dest);
                        });
                    }
                }
            });
        }
    }
}

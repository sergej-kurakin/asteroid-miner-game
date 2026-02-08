// src/ui/components/navigation-panel.ts
// Navigation panel for traveling between world cells

import type { Observable, GameState } from '../../gamestate';
import type { CellPosition, World } from '../../world';
import { getCellAt, getMiningConstraint, isInBounds } from '../../world';
import { CellType, MiningConstraint } from '../../world';
import { BaseComponent } from '../base-component';

const DIRECTIONS: Array<{ label: string; delta: CellPosition }> = [
    { label: 'X−', delta: { x: -1, y: 0, z: 0 } },
    { label: 'X+', delta: { x: 1, y: 0, z: 0 } },
    { label: 'Y−', delta: { x: 0, y: -1, z: 0 } },
    { label: 'Y+', delta: { x: 0, y: 1, z: 0 } },
    { label: 'Z−', delta: { x: 0, y: 0, z: -1 } },
    { label: 'Z+', delta: { x: 0, y: 0, z: 1 } },
];

export class NavigationPanel extends BaseComponent {
    private positionEl: HTMLElement | null = null;
    private costEl: HTMLElement | null = null;
    private scanInfoEl: HTMLElement | null = null;
    private controlsEl: HTMLElement | null = null;

    constructor(
        state$: Observable<GameState>,
        private readonly world: World,
        private readonly onTravel: (dest: CellPosition) => void
    ) {
        super(state$);
    }

    mount(): void {
        this.positionEl = document.getElementById('nav-position');
        this.costEl = document.getElementById('nav-cost');
        this.scanInfoEl = document.getElementById('nav-scan-info');
        this.controlsEl = document.getElementById('nav-controls');

        this.subscribeToMultiple(['current_cell', 'power', 'hold_used', 'is_mining'], () => this.render());
        this.render();
    }

    render(): void {
        const state = this.state$.getState();
        const { x, y, z } = state.current_cell;

        const cell = getCellAt(this.world, state.current_cell);
        const cellType = cell?.type ?? 'empty';

        const steps = Math.floor(state.hold_used / 50);
        const cost = Math.ceil(20 * (1 + steps * 0.1));

        if (this.positionEl) {
            this.positionEl.innerHTML =
                `Pos: (${x}, ${y}, ${z}) <span class="nav-cell-type">[${cellType}]</span>`;
        }

        if (this.costEl) {
            this.costEl.textContent = `Move cost: ${cost} pwr`;
        }

        if (this.scanInfoEl) {
            const constraint = (cell?.type === CellType.Mining)
                ? getMiningConstraint(this.world, state.current_cell)
                : null;

            let scanInfo: string;
            if (!cell || cell.type === CellType.Empty) scanInfo = 'No asteroids';
            else if (cell.type === CellType.PowerStation || cell.type === CellType.Market) scanInfo = 'No mining zone';
            else if (constraint === MiningConstraint.None) scanInfo = 'Scanning: BLOCKED (near market)';
            else if (constraint === MiningConstraint.SmallOnly) scanInfo = 'Sizes: Tiny, Small only';
            else scanInfo = 'Sizes: All (by ship level)';

            this.scanInfoEl.textContent = scanInfo;
        }

        if (this.controlsEl) {
            this.controlsEl.innerHTML = '';
            for (const dir of DIRECTIONS) {
                const dest: CellPosition = {
                    x: x + dir.delta.x,
                    y: y + dir.delta.y,
                    z: z + dir.delta.z,
                };
                const disabled = state.is_mining || state.power < cost || !isInBounds(dest);
                const btn = document.createElement('button');
                btn.className = 'btn btn-nav';
                btn.textContent = dir.label;
                btn.disabled = disabled;
                if (!disabled) {
                    btn.addEventListener('click', () => this.onTravel(dest));
                }
                this.controlsEl.appendChild(btn);
            }
        }
    }
}

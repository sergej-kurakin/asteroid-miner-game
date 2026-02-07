import type { Observable, GameState } from '../gamestate';
import type { IToolController, ToolBonuses } from '../tools/interfaces';
import { StartMiningCommand, CancelMiningCommand, CompleteMiningCommand } from './commands';
import { MINE_POWER_COST } from './constants';
import type {
    IMiningController,
    IMiningSystem,
    MiningEvent,
    MiningEventListener
} from './interfaces';
import { MiningSystem } from './system';

const DEFAULT_BONUSES: ToolBonuses = {
    yieldMultiplier: 1.0,
    rareMultiplier: 1.0,
    powerCostMultiplier: 1.0
};

export class MiningController implements IMiningController {
    private readonly system: IMiningSystem;
    private listeners: Set<MiningEventListener> = new Set();
    private miningStartTime: number | null = null;
    private updateIntervalId: ReturnType<typeof setInterval> | null = null;
    private readonly UPDATE_INTERVAL = 16; // ~60fps

    constructor(
        private readonly state$: Observable<GameState>,
        private readonly toolController?: IToolController,
        system?: IMiningSystem
    ) {
        this.system = system ?? new MiningSystem();
    }

    private getToolBonuses(): ToolBonuses {
        return this.toolController?.getToolBonuses() ?? DEFAULT_BONUSES;
    }

    startMining(): boolean {
        const state = this.state$.getState();
        if (state.is_mining || !state.asteroid) {
            return false;
        }

        // Calculate effective power cost with tool bonuses
        const bonuses = this.getToolBonuses();
        const effectivePowerCost = Math.ceil(MINE_POWER_COST * bonuses.powerCostMultiplier);

        // Check power
        if (state.power < effectivePowerCost) {
            this.emit({ type: 'mining_failed', reason: 'insufficient_power' });
            return false;
        }

        // Deduct power and start mining
        new StartMiningCommand(this.state$, effectivePowerCost).execute();
        this.miningStartTime = Date.now();

        this.emit({ type: 'mining_started', asteroid: state.asteroid });

        // Start update loop
        this.updateIntervalId = setInterval(() => this.updateProgress(), this.UPDATE_INTERVAL);

        return true;
    }

    cancelMining(): void {
        const state = this.state$.getState();
        if (!state.is_mining) return;

        if (this.updateIntervalId !== null) {
            clearInterval(this.updateIntervalId);
            this.updateIntervalId = null;
        }

        new CancelMiningCommand(this.state$).execute();
        this.miningStartTime = null;
    }

    isMining(): boolean {
        return this.state$.getState().is_mining;
    }

    getProgress(): number {
        return this.state$.getState().mining_progress;
    }

    subscribe(listener: MiningEventListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private updateProgress(): void {
        const state = this.state$.getState();
        if (!state.is_mining || !state.asteroid) return;

        const elapsed = Date.now() - this.miningStartTime!;
        const miningTime = state.asteroid.miningTime;
        const progress = Math.min(elapsed / miningTime, 1);

        this.state$.updateProperty('mining_progress', progress);
        this.emit({ type: 'mining_progress', progress });

        if (progress >= 1) {
            this.completeMining();
        }
    }

    private completeMining(): void {
        if (!this.state$.getState().asteroid) return;

        // Clear the update interval
        if (this.updateIntervalId !== null) {
            clearInterval(this.updateIntervalId);
            this.updateIntervalId = null;
        }

        const { cappedYield, newDiscoveries } = new CompleteMiningCommand(
            this.state$,
            this.system,
            this.getToolBonuses()
        ).execute();

        this.miningStartTime = null;

        // Emit discovery events
        for (const element of newDiscoveries) {
            this.emit({ type: 'discovery', element });
        }

        this.emit({ type: 'mining_completed', yield: cappedYield });
    }

    private emit(event: MiningEvent): void {
        this.listeners.forEach(listener => listener(event));
    }
}

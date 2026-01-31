import type { Observable } from '../gamestate';
import type { GameState } from '../gamestate/interfaces';
import type {
    IMiningController,
    IMiningSystem,
    MiningEvent,
    MiningEventListener,
    SellResult,
    ElementPrices
} from './interfaces';
import { MiningSystem } from './system';

export class MiningController implements IMiningController {
    private readonly system: IMiningSystem;
    private listeners: Set<MiningEventListener> = new Set();
    private miningStartTime: number | null = null;
    private updateIntervalId: ReturnType<typeof setInterval> | null = null;
    private readonly UPDATE_INTERVAL = 16; // ~60fps

    constructor(
        private readonly state$: Observable<GameState>,
        private readonly prices: ElementPrices,
        system?: IMiningSystem
    ) {
        this.system = system ?? new MiningSystem();
    }

    startMining(): boolean {
        const state = this.state$.getState();
        if (state.is_mining || !state.asteroid) {
            return false;
        }

        this.state$.setState({
            is_mining: true,
            mining_progress: 0
        });
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

        this.state$.setState({
            is_mining: false,
            mining_progress: 0
        });
        this.miningStartTime = null;
    }

    isMining(): boolean {
        return this.state$.getState().is_mining;
    }

    getProgress(): number {
        return this.state$.getState().mining_progress;
    }

    sellResources(): SellResult | null {
        const state = this.state$.getState();
        const result = this.system.calculateSellValue(state.inventory, this.prices);

        if (result.totalValue <= 0) {
            return null;
        }

        this.state$.setState({
            credits: state.credits + result.totalValue,
            inventory: {},
            hold_used: 0
        });

        return result;
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
        const state = this.state$.getState();
        if (!state.asteroid) return;

        // Clear the update interval
        if (this.updateIntervalId !== null) {
            clearInterval(this.updateIntervalId);
            this.updateIntervalId = null;
        }

        // Calculate full yield from asteroid
        const fullYield = this.system.calculateYield(state.asteroid);

        // Cap yield to available hold space
        const availableSpace = state.hold_capacity - state.hold_used;
        const cappedYield = this.system.capYieldToAvailableSpace(fullYield, availableSpace);

        // Check for discoveries before updating state (use capped yield)
        const newDiscoveries = this.system.findNewDiscoveries(
            cappedYield.collected,
            state.discovered_elements
        );

        // Emit discovery events
        for (const element of newDiscoveries) {
            this.emit({ type: 'discovery', element });
        }

        // Calculate new inventory and hold (use capped yield)
        const newInventory = this.system.mergeIntoInventory(
            state.inventory,
            cappedYield.collected
        );
        const newHoldUsed = this.system.calculateNewHoldUsed(
            state.hold_used,
            cappedYield.totalAmount,
            state.hold_capacity
        );

        // Update state with all new discovered elements
        const allDiscovered = newDiscoveries.length > 0
            ? [...state.discovered_elements, ...newDiscoveries]
            : state.discovered_elements;

        this.state$.setState({
            inventory: newInventory,
            hold_used: newHoldUsed,
            is_mining: false,
            mining_progress: 0,
            asteroid: null,
            discovered_elements: allDiscovered
        });

        this.miningStartTime = null;

        this.emit({ type: 'mining_completed', yield: cappedYield });
    }

    private emit(event: MiningEvent): void {
        this.listeners.forEach(listener => listener(event));
    }
}

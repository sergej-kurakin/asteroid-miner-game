import type { Observable, Command, GameState } from '../gamestate';
import type { ToolBonuses } from '../tools/interfaces';
import type { IMiningSystem, CompleteMiningResult, SellResult } from './interfaces';

/**
 * Deducts power and sets mining state to active.
 *
 * @precondition !state.is_mining
 * @precondition state.asteroid !== null
 * @precondition state.power >= effectivePowerCost
 */
export class StartMiningCommand implements Command<void> {
    constructor(
        private readonly state$: Observable<GameState>,
        private readonly effectivePowerCost: number
    ) {}

    execute(): void {
        const state = this.state$.getState();

        this.state$.setState({
            is_mining: true,
            mining_progress: 0,
            power: state.power - this.effectivePowerCost
        });
    }
}

/**
 * Resets mining state to inactive.
 *
 * @precondition state.is_mining
 */
export class CancelMiningCommand implements Command<void> {
    constructor(
        private readonly state$: Observable<GameState>
    ) {}

    execute(): void {
        this.state$.setState({
            is_mining: false,
            mining_progress: 0
        });
    }
}

/**
 * Calculates yield, caps to hold space, finds discoveries, merges inventory,
 * and clears the asteroid.
 *
 * @precondition state.is_mining
 * @precondition state.asteroid !== null
 */
export class CompleteMiningCommand implements Command<CompleteMiningResult> {
    constructor(
        private readonly state$: Observable<GameState>,
        private readonly system: IMiningSystem,
        private readonly toolBonuses: ToolBonuses
    ) {}

    execute(): CompleteMiningResult {
        const state = this.state$.getState();
        const asteroid = state.asteroid;
        if (!asteroid) {
            throw new Error('CompleteMiningCommand: precondition violated - no asteroid');
        }

        const fullYield = this.system.calculateYield(asteroid, this.toolBonuses);

        const availableSpace = state.hold_capacity - state.hold_used;
        const cappedYield = this.system.capYieldToAvailableSpace(fullYield, availableSpace);

        const newDiscoveries = this.system.findNewDiscoveries(
            cappedYield.collected,
            state.discovered_elements
        );

        const newInventory = this.system.mergeIntoInventory(
            state.inventory,
            cappedYield.collected
        );
        const newHoldUsed = this.system.calculateNewHoldUsed(
            state.hold_used,
            cappedYield.totalAmount,
            state.hold_capacity
        );

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

        return { cappedYield, newDiscoveries };
    }
}

/**
 * Adds sell value to credits and clears inventory.
 *
 * @precondition sellResult.totalValue > 0
 */
export class SellResourcesCommand implements Command<SellResult> {
    constructor(
        private readonly state$: Observable<GameState>,
        private readonly sellResult: SellResult
    ) {}

    execute(): SellResult {
        const state = this.state$.getState();

        this.state$.setState({
            credits: state.credits + this.sellResult.totalValue,
            inventory: {},
            hold_used: 0
        });

        return this.sellResult;
    }
}

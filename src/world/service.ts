import type { Cell, CellPosition, World, MiningConstraint, IWorldService } from './interfaces';
import {
    getCellAt,
    isInBounds,
    findPowerStations,
    findMarkets,
    nearestPowerStationDistance,
    getCellsInRadius,
    getAdjacentCells,
    getMiningConstraint,
    manhattanDistance
} from './utils';

/**
 * WorldService provides a facade for querying the game world.
 *
 * Encapsulates the World Map and provides convenient methods for:
 * - Cell lookups and validation
 * - Distance calculations
 * - Structure queries (power stations, markets)
 * - Spatial queries (radius, adjacency)
 *
 * Benefits:
 * - Single import for world queries
 * - Caches expensive lookups (power stations, markets)
 * - Hides implementation details (Map structure, key format)
 * - Easier to mock in tests
 */
export class WorldService implements IWorldService {
    private readonly world: World;

    // Cached lookups for performance (world is static after generation)
    private _powerStations?: Cell[];
    private _markets?: Cell[];

    constructor(world: World) {
        this.world = world;
    }

    /**
     * Retrieves the cell at the given position.
     * @returns The cell if it exists, undefined otherwise
     */
    getCellAt(position: CellPosition): Cell | undefined {
        return getCellAt(this.world, position);
    }

    /**
     * Checks if a position is within the world grid bounds.
     */
    isInBounds(position: CellPosition): boolean {
        return isInBounds(position);
    }

    /**
     * Calculates Manhattan distance to the nearest power station.
     * @returns Distance in grid cells, or Infinity if no power stations exist
     */
    nearestPowerStationDistance(position: CellPosition): number {
        return nearestPowerStationDistance(this.world, position);
    }

    /**
     * Calculates Manhattan distance to the nearest market.
     * @returns Distance in grid cells, or Infinity if no markets exist
     */
    nearestMarketDistance(position: CellPosition): number {
        const markets = this.getMarkets();
        if (markets.length === 0) return Infinity;

        let minDistance = Infinity;
        for (const market of markets) {
            const dist = manhattanDistance(position, market.position);
            if (dist < minDistance) {
                minDistance = dist;
            }
        }
        return minDistance;
    }

    /**
     * Returns all power station cells in the world.
     * Results are cached after first call.
     */
    getPowerStations(): Cell[] {
        if (!this._powerStations) {
            this._powerStations = findPowerStations(this.world);
        }
        return this._powerStations;
    }

    /**
     * Returns all market cells in the world.
     * Results are cached after first call.
     */
    getMarkets(): Cell[] {
        if (!this._markets) {
            this._markets = findMarkets(this.world);
        }
        return this._markets;
    }

    /**
     * Returns all cells within a given radius of a center position.
     * Uses Euclidean distance for sphere-like regions.
     */
    getCellsInRadius(center: CellPosition, radius: number): Cell[] {
        return getCellsInRadius(this.world, center, radius);
    }

    /**
     * Returns the 6 orthogonally adjacent cells (±1 on each axis).
     */
    getAdjacentCells(position: CellPosition): Cell[] {
        return getAdjacentCells(this.world, position);
    }

    /**
     * Determines the mining constraint for a position based on proximity
     * to power stations and markets.
     */
    getMiningConstraint(position: CellPosition): MiningConstraint {
        return getMiningConstraint(this.world, position);
    }
}

import type { CellPosition, IWorldGenerator, World } from './interfaces';
import { CellType, MiningConstraint } from './interfaces';
import {
    GRID_SIZE,
    MARKET_PROXIMITY_RADIUS,
    MINING_DENSITY,
    MIN_STRUCTURE_DISTANCE,
    NUM_MARKETS,
    NUM_POWER_STATIONS,
    ORIGIN,
    POWER_STATION_PROXIMITY_RADIUS,
    WORLD_SEED,
} from './constants';
import { euclideanDistance } from './utils';

function createSeededRandom(seed: number): () => number {
    let state = seed >>> 0;
    return (): number => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 0x100000000;
    };
}

function positionToKey(pos: CellPosition): string {
    return `${pos.x},${pos.y},${pos.z}`;
}

function manhattanDistance(a: CellPosition, b: CellPosition): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);
}

export class WorldGenerator implements IWorldGenerator {
    generate(): World {
        const world: World = new Map();
        const rng = createSeededRandom(WORLD_SEED);

        // Initialize all cells as Empty
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let z = 0; z < GRID_SIZE; z++) {
                    const pos: CellPosition = { x, y, z };
                    world.set(positionToKey(pos), { position: pos, type: CellType.Empty, miningConstraint: MiningConstraint.Any });
                }
            }
        }

        // Origin is always a Mining cell
        world.set(positionToKey(ORIGIN), { position: { ...ORIGIN }, type: CellType.Mining, miningConstraint: MiningConstraint.Any });

        const specialPositions: CellPosition[] = [{ ...ORIGIN }];

        // Place Power Stations
        this.placeStructures(world, rng, CellType.PowerStation, NUM_POWER_STATIONS, specialPositions);

        // Place Markets
        this.placeStructures(world, rng, CellType.Market, NUM_MARKETS, specialPositions);

        // Fill remaining Empty cells with Mining based on density
        for (const [key, cell] of world) {
            if (cell.type === CellType.Empty && rng() < MINING_DENSITY) {
                world.set(key, { position: cell.position, type: CellType.Mining, miningConstraint: MiningConstraint.Any });
            }
        }

        // Final pass: compute real miningConstraint for every cell
        const markets = Array.from(world.values()).filter(c => c.type === CellType.Market);
        const stations = Array.from(world.values()).filter(c => c.type === CellType.PowerStation);

        for (const [key, cell] of world) {
            let constraint = MiningConstraint.Any;

            // Near Market: no mining
            for (const market of markets) {
                if (euclideanDistance(cell.position, market.position) <= MARKET_PROXIMITY_RADIUS) {
                    constraint = MiningConstraint.None;
                    break;
                }
            }

            if (constraint === MiningConstraint.Any) {
                // Origin always SmallOnly
                if (cell.position.x === ORIGIN.x && cell.position.y === ORIGIN.y && cell.position.z === ORIGIN.z) {
                    constraint = MiningConstraint.SmallOnly;
                } else {
                    // Near Power Station: small only
                    for (const station of stations) {
                        if (euclideanDistance(cell.position, station.position) <= POWER_STATION_PROXIMITY_RADIUS) {
                            constraint = MiningConstraint.SmallOnly;
                            break;
                        }
                    }
                }
            }

            world.set(key, { ...cell, miningConstraint: constraint });
        }

        return world;
    }

    private placeStructures(
        world: World,
        rng: () => number,
        type: CellType,
        count: number,
        existing: CellPosition[],
    ): void {
        let placed = 0;
        let attempts = 0;
        const maxAttempts = GRID_SIZE ** 3 * 10;

        while (placed < count && attempts < maxAttempts) {
            attempts++;
            const x = Math.floor(rng() * GRID_SIZE);
            const y = Math.floor(rng() * GRID_SIZE);
            const z = Math.floor(rng() * GRID_SIZE);
            const pos: CellPosition = { x, y, z };

            if (this.isValidPlacement(pos, existing)) {
                world.set(positionToKey(pos), { position: pos, type, miningConstraint: MiningConstraint.Any });
                existing.push(pos);
                placed++;
                console.log(`Placed ${type} at (${x}, ${y}, ${z})`);
            }
        }
    }

    private isValidPlacement(pos: CellPosition, existing: CellPosition[]): boolean {
        for (const other of existing) {
            if (manhattanDistance(pos, other) < MIN_STRUCTURE_DISTANCE) {
                return false;
            }
        }
        return true;
    }
}

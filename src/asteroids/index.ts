// Type exports
export type {
    Asteroid,
    AsteroidComposition,
    AsteroidSize,
    AsteroidType,
    AsteroidSizeConfig,
    AsteroidTypeConfig,
    WeightedItem,
    ShipSpawnConfig,
    ElementRange,
    IAsteroidsController,
    ScanResult,
    AbandonResult,
    RandomProvider,
    IAsteroidGenerator
} from './interfaces';

export type { Command } from '../gamestate';

// Generator exports
export { AsteroidGenerator } from './generator';

// Random provider export
export { DefaultRandomProvider } from './random-provider';

// Constant exports
export {
    ASTEROID_SIZES,
    ASTEROID_TYPES,
    SHIP_SPAWN_CONFIG,
    RARE_ELEMENTS,
    SCAN_POWER_COST
} from './constants';

// Command exports
export { ScanCommand, AbandonCommand } from './commands';

// Controller export
export { AsteroidsController } from './controller';

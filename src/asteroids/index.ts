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

// Generator exports
export { AsteroidGenerator, generateAsteroid } from './generator';

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

// Controller export
export { AsteroidsController } from './controller';

// Utility exports
export {
    probabilityMapToWeightedItems
} from './utils';

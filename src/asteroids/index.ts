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
    AbandonResult
} from './interfaces';

// Generator function exports
export {
    generateAsteroid,
    getAsteroidTypeName,
    canShipMineSize,
    selectSize,
    selectType,
    generateComposition,
    calculateYield
} from './generator';

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
    randomInRange,
    randomFloatInRange,
    weightedRandomSelect,
    probabilityMapToWeightedItems,
    normalizeComposition
} from './utils';

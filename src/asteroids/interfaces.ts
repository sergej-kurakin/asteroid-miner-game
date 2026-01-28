// Asteroid size types
export type AsteroidSize = 'tiny' | 'small' | 'medium' | 'large' | 'massive' | 'colossal';

// Asteroid type classifications
export type AsteroidType = 'iron_nickel' | 'carbonaceous' | 'rare_earth' | 'olivine';

// Composition: element symbol to percentage
export interface AsteroidComposition {
    [element: string]: number;
}

// Configuration for asteroid sizes
export interface AsteroidSizeConfig {
    yieldMin: number;
    yieldMax: number;
    miningTime: number;  // milliseconds
    minShipLevel: number;
    visualDiameter: number;  // pixels
}

// Element range for composition generation
export interface ElementRange {
    min: number;
    max: number;
}

// Configuration for asteroid types
export interface AsteroidTypeConfig {
    name: string;
    composition: { [element: string]: ElementRange };
    yieldBonus: number;  // multiplier (1.0 = no bonus)
    rareElementBonus: number;  // multiplier for rare elements
}

// Weighted item for random selection
export interface WeightedItem<T> {
    value: T;
    weight: number;
}

// Per-ship spawn configuration
export interface ShipSpawnConfig {
    sizes: { [size in AsteroidSize]?: number };  // probability weights
    types: { [type in AsteroidType]?: number };  // probability weights
}

// Main asteroid interface
export interface Asteroid {
    type: AsteroidType;
    size: AsteroidSize;
    composition: AsteroidComposition;
    totalYield: number;
    miningTime: number;  // milliseconds
    visualDiameter: number;  // pixels
}

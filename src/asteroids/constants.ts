import type { AsteroidSize, AsteroidType, AsteroidSizeConfig, AsteroidTypeConfig, ShipSpawnConfig } from './interfaces';

// Asteroid size configurations
export const ASTEROID_SIZES: Record<AsteroidSize, AsteroidSizeConfig> = {
    tiny: {
        yieldMin: 40,
        yieldMax: 60,
        miningTime: 1500,
        minShipLevel: 1,
        visualDiameter: 80
    },
    small: {
        yieldMin: 80,
        yieldMax: 120,
        miningTime: 2500,
        minShipLevel: 1,
        visualDiameter: 120
    },
    medium: {
        yieldMin: 150,
        yieldMax: 220,
        miningTime: 3500,
        minShipLevel: 2,
        visualDiameter: 160
    },
    large: {
        yieldMin: 280,
        yieldMax: 400,
        miningTime: 5000,
        minShipLevel: 3,
        visualDiameter: 200
    },
    massive: {
        yieldMin: 500,
        yieldMax: 700,
        miningTime: 7000,
        minShipLevel: 4,
        visualDiameter: 250
    },
    colossal: {
        yieldMin: 1000,
        yieldMax: 1400,
        miningTime: 10000,
        minShipLevel: 5,
        visualDiameter: 300
    }
};

// Asteroid type configurations
export const ASTEROID_TYPES: Record<AsteroidType, AsteroidTypeConfig> = {
    iron_nickel: {
        name: 'Iron-Nickel',
        composition: {
            Fe: { min: 88, max: 92 },
            Ni: { min: 5, max: 8 },
            Co: { min: 1, max: 2 }
        },
        yieldBonus: 1.0,
        rareElementBonus: 1.0
    },
    carbonaceous: {
        name: 'Carbonaceous',
        composition: {
            O: { min: 35, max: 40 },
            Si: { min: 18, max: 22 },
            Mg: { min: 12, max: 15 },
            Fe: { min: 8, max: 12 },
            S: { min: 3, max: 5 },
            Ni: { min: 1, max: 2 }
        },
        yieldBonus: 1.0,
        rareElementBonus: 1.05  // +5% rare element yield
    },
    rare_earth: {
        name: 'Rare-Earth',
        composition: {
            Fe: { min: 25, max: 30 },
            Ni: { min: 8, max: 12 },
            O: { min: 20, max: 25 },
            Si: { min: 10, max: 12 },
            Co: { min: 3, max: 5 },
            Cr: { min: 2, max: 4 },
            Mn: { min: 1, max: 3 }
        },
        yieldBonus: 1.0,
        rareElementBonus: 1.2  // +20% rare element yield
    },
    olivine: {
        name: 'Olivine-Rich',
        composition: {
            O: { min: 45, max: 50 },
            Si: { min: 25, max: 30 },
            Mg: { min: 15, max: 20 },
            Fe: { min: 3, max: 5 },
            Ni: { min: 1, max: 2 }
        },
        yieldBonus: 1.3,  // +30% volume yield
        rareElementBonus: 1.0
    }
};

// Ship level spawn configurations
export const SHIP_SPAWN_CONFIG: Record<number, ShipSpawnConfig> = {
    // Scout (Level 1)
    1: {
        sizes: {
            tiny: 30,
            small: 70
        },
        types: {
            iron_nickel: 60,
            carbonaceous: 40
        }
    },
    // Prospector (Level 2)
    2: {
        sizes: {
            tiny: 10,
            small: 60,
            medium: 30
        },
        types: {
            iron_nickel: 45,
            carbonaceous: 40,
            rare_earth: 15
        }
    },
    // Harvester (Level 3)
    3: {
        sizes: {
            tiny: 5,
            small: 40,
            medium: 40,
            large: 15
        },
        types: {
            iron_nickel: 35,
            carbonaceous: 35,
            rare_earth: 20,
            olivine: 10
        }
    },
    // Industrial (Level 4)
    4: {
        sizes: {
            small: 10,
            medium: 35,
            large: 40,
            massive: 15
        },
        types: {
            iron_nickel: 30,
            carbonaceous: 30,
            rare_earth: 25,
            olivine: 15
        }
    },
    // Titan (Level 5)
    5: {
        sizes: {
            medium: 5,
            large: 30,
            massive: 55,
            colossal: 10
        },
        types: {
            iron_nickel: 20,
            carbonaceous: 25,
            rare_earth: 35,
            olivine: 20
        }
    }
};

// Rare element symbols for bonus calculations
export const RARE_ELEMENTS: string[] = ['Co', 'Cr', 'Mn'];

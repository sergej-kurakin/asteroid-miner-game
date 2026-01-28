import type { Config } from './interfaces';

export const CONFIG: Config = {
    // Element data with prices
    elements: {
        Fe: { name: 'Iron', price: 50 },
        Ni: { name: 'Nickel', price: 150 },
        Co: { name: 'Cobalt', price: 200 },
        O: { name: 'Oxygen', price: 20 },
        Si: { name: 'Silicon', price: 40 },
        Mg: { name: 'Magnesium', price: 80 },
        S: { name: 'Sulfur', price: 60 },
        Cr: { name: 'Chromium', price: 180 },
        Mn: { name: 'Manganese', price: 120 }
    },

    // Mining settings (fallbacks)
    miningTime: 2500, // ms
    yieldMin: 80,
    yieldMax: 120,
    holdCapacity: 100,

    // UI settings
    alertDuration: 3000, // ms
    autoSaveInterval: 30000 // ms
};
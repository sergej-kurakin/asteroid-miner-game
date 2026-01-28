import type { ShipData } from './interfaces';

export const SHIPS: ShipData[] = [
    {
        id: 1,
        name: 'Scout Class',
        holdCapacity: 100,
        powerCell: 100,
        miningTime: 3000,
        toolSlots: 1,
        cost: 0,
        special: 'Can mine small asteroids only'
    },
    {
        id: 2,
        name: 'Prospector Class',
        holdCapacity: 150,
        powerCell: 120,
        miningTime: 2500,
        toolSlots: 2,
        cost: 2000,
        special: 'Improved mining efficiency'
    },
    {
        id: 3,
        name: 'Harvester Class',
        holdCapacity: 250,
        powerCell: 150,
        miningTime: 2000,
        toolSlots: 3,
        cost: 8000,
        special: 'Enhanced cargo capacity'
    },
    {
        id: 4,
        name: 'Industrial Class',
        holdCapacity: 400,
        powerCell: 180,
        miningTime: 1500,
        toolSlots: 3,
        cost: 25000,
        special: 'Heavy-duty operations'
    },
    {
        id: 5,
        name: 'Titan Class',
        holdCapacity: 600,
        powerCell: 200,
        miningTime: 1000,
        toolSlots: 4,
        cost: 75000,
        special: 'Ultimate mining vessel'
    }
];

export const INITIAL_SHIP_LEVEL = 1;
export const MAX_SHIP_LEVEL = 5;

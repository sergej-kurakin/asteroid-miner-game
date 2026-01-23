export interface AsteroidComposition {
    [element: string]: number;
}

export interface Asteroid {
    type: string;
    size: string;
    composition: AsteroidComposition;
    totalYield: number;
}

export interface ElementData {
    name: string;
    price: number;
}

export interface Config {
    elements: { [symbol: string]: ElementData };
    miningTime: number;
    yieldMin: number;
    yieldMax: number;
    holdCapacity: number;
    alertDuration: number;
    autoSaveInterval: number;
}

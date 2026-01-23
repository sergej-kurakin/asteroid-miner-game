export interface ElementData {
    name: string;
    price: number;
}

export interface CompositionRange {
    min: number;
    max: number;
}

export interface Config {
    elements: { [symbol: string]: ElementData };
    ironNickelComposition: {
        Fe: CompositionRange;
        Ni: CompositionRange;
        Co: CompositionRange;
    };
    miningTime: number;
    yieldMin: number;
    yieldMax: number;
    holdCapacity: number;
    alertDuration: number;
    autoSaveInterval: number;
}

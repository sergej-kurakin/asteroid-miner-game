// src/gamestate/observer.ts
// Generic Observer pattern implementation for state management

export type Listener<T> = (newValue: T, oldValue: T) => void;
export type PropertyListener<T, K extends keyof T> = (
    newValue: T[K],
    oldValue: T[K],
    state: T
) => void;
export type Unsubscribe = () => void;

export interface Observable<T> {
    subscribe(listener: Listener<T>): Unsubscribe;
    subscribeToProperty<K extends keyof T>(
        property: K,
        listener: PropertyListener<T, K>
    ): Unsubscribe;
    getState(): Readonly<T>;
    setState(partial: Partial<T>): void;
    updateProperty<K extends keyof T>(property: K, value: T[K]): void;
}

export class StateObserver<T extends object> implements Observable<T> {
    private state: T;
    private listeners: Set<Listener<T>> = new Set();
    private propertyListeners: Map<keyof T, Set<PropertyListener<T, keyof T>>> = new Map();

    constructor(initialState: T) {
        this.state = { ...initialState };
    }

    getState(): Readonly<T> {
        return this.state;
    }

    subscribe(listener: Listener<T>): Unsubscribe {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    subscribeToProperty<K extends keyof T>(
        property: K,
        listener: PropertyListener<T, K>
    ): Unsubscribe {
        if (!this.propertyListeners.has(property)) {
            this.propertyListeners.set(property, new Set());
        }
        this.propertyListeners.get(property)!.add(listener as PropertyListener<T, keyof T>);
        return () => this.propertyListeners.get(property)?.delete(listener as PropertyListener<T, keyof T>);
    }

    updateProperty<K extends keyof T>(property: K, value: T[K]): void {
        const oldValue = this.state[property];
        const oldState = { ...this.state };
        this.state[property] = value;
        this.notifyPropertyListeners(property, value, oldValue);
        this.notifyGlobalListeners(oldState);
    }

    setState(partial: Partial<T>): void {
        const oldState = { ...this.state };
        const changedKeys = Object.keys(partial) as (keyof T)[];

        for (const key of changedKeys) {
            this.state[key] = partial[key] as T[keyof T];
        }

        for (const key of changedKeys) {
            this.notifyPropertyListeners(key, this.state[key], oldState[key]);
        }
        this.notifyGlobalListeners(oldState);
    }

    private notifyPropertyListeners<K extends keyof T>(
        property: K,
        newValue: T[K],
        oldValue: T[K]
    ): void {
        this.propertyListeners.get(property)?.forEach(listener => {
            listener(newValue, oldValue, this.state);
        });
    }

    private notifyGlobalListeners(oldState: T): void {
        this.listeners.forEach(listener => listener(this.state, oldState));
    }
}

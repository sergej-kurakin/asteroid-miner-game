import { describe, it, expect, vi } from 'vitest';
import { StateObserver } from './observer';

interface TestState {
    count: number;
    name: string;
    active: boolean;
}

describe('StateObserver', () => {
    const createTestState = (): TestState => ({
        count: 0,
        name: 'test',
        active: false,
    });

    describe('constructor & getState()', () => {
        it('initializes with provided state', () => {
            const initialState = createTestState();
            const observer = new StateObserver(initialState);

            expect(observer.getState()).toEqual(initialState);
        });

        it('returns state as readonly copy', () => {
            const observer = new StateObserver(createTestState());

            observer.updateProperty('count', 10);
            const stateCopy = observer.getState();
            observer.updateProperty('count', 20);

            expect(stateCopy.count).toBe(20);
        });
    });

    describe('subscribe()', () => {
        it('listener called on state changes', () => {
            const observer = new StateObserver(createTestState());
            const listener = vi.fn();

            observer.subscribe(listener);
            observer.updateProperty('count', 5);

            expect(listener).toHaveBeenCalledTimes(1);
        });

        it('receives correct new and old values', () => {
            const observer = new StateObserver(createTestState());
            const listener = vi.fn();

            observer.subscribe(listener);
            observer.updateProperty('count', 5);

            const [newState, oldState] = listener.mock.calls[0];
            expect(newState.count).toBe(5);
            expect(oldState.count).toBe(0);
        });

        it('unsubscribe removes listener', () => {
            const observer = new StateObserver(createTestState());
            const listener = vi.fn();

            const unsubscribe = observer.subscribe(listener);
            unsubscribe();
            observer.updateProperty('count', 5);

            expect(listener).not.toHaveBeenCalled();
        });

        it('multiple listeners all receive updates', () => {
            const observer = new StateObserver(createTestState());
            const listener1 = vi.fn();
            const listener2 = vi.fn();

            observer.subscribe(listener1);
            observer.subscribe(listener2);
            observer.updateProperty('count', 5);

            expect(listener1).toHaveBeenCalledTimes(1);
            expect(listener2).toHaveBeenCalledTimes(1);
        });
    });

    describe('subscribeToProperty()', () => {
        it('property listener called when specific property changes', () => {
            const observer = new StateObserver(createTestState());
            const listener = vi.fn();

            observer.subscribeToProperty('count', listener);
            observer.updateProperty('count', 10);

            expect(listener).toHaveBeenCalledTimes(1);
        });

        it('not called when other properties change', () => {
            const observer = new StateObserver(createTestState());
            const countListener = vi.fn();

            observer.subscribeToProperty('count', countListener);
            observer.updateProperty('name', 'changed');

            expect(countListener).not.toHaveBeenCalled();
        });

        it('receives property value, old value, and full state', () => {
            const observer = new StateObserver(createTestState());
            const listener = vi.fn();

            observer.subscribeToProperty('count', listener);
            observer.updateProperty('count', 42);

            expect(listener).toHaveBeenCalledWith(42, 0, expect.objectContaining({ count: 42 }));
        });

        it('unsubscribe removes property listener', () => {
            const observer = new StateObserver(createTestState());
            const listener = vi.fn();

            const unsubscribe = observer.subscribeToProperty('count', listener);
            unsubscribe();
            observer.updateProperty('count', 100);

            expect(listener).not.toHaveBeenCalled();
        });

        it('multiple property listeners all receive updates', () => {
            const observer = new StateObserver(createTestState());
            const listener1 = vi.fn();
            const listener2 = vi.fn();

            observer.subscribeToProperty('count', listener1);
            observer.subscribeToProperty('count', listener2);
            observer.updateProperty('count', 5);

            expect(listener1).toHaveBeenCalledTimes(1);
            expect(listener2).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateProperty()', () => {
        it('updates single property correctly', () => {
            const observer = new StateObserver(createTestState());

            observer.updateProperty('count', 25);

            expect(observer.getState().count).toBe(25);
            expect(observer.getState().name).toBe('test');
        });

        it('notifies property listeners', () => {
            const observer = new StateObserver(createTestState());
            const listener = vi.fn();

            observer.subscribeToProperty('name', listener);
            observer.updateProperty('name', 'updated');

            expect(listener).toHaveBeenCalledWith('updated', 'test', expect.any(Object));
        });

        it('notifies global listeners', () => {
            const observer = new StateObserver(createTestState());
            const listener = vi.fn();

            observer.subscribe(listener);
            observer.updateProperty('active', true);

            expect(listener).toHaveBeenCalledTimes(1);
            const [newState] = listener.mock.calls[0];
            expect(newState.active).toBe(true);
        });
    });

    describe('setState()', () => {
        it('updates multiple properties at once', () => {
            const observer = new StateObserver(createTestState());

            observer.setState({ count: 50, name: 'multi' });

            const state = observer.getState();
            expect(state.count).toBe(50);
            expect(state.name).toBe('multi');
            expect(state.active).toBe(false); // unchanged
        });

        it('notifies property listeners for each changed property', () => {
            const observer = new StateObserver(createTestState());
            const countListener = vi.fn();
            const nameListener = vi.fn();
            const activeListener = vi.fn();

            observer.subscribeToProperty('count', countListener);
            observer.subscribeToProperty('name', nameListener);
            observer.subscribeToProperty('active', activeListener);

            observer.setState({ count: 10, name: 'batch' });

            expect(countListener).toHaveBeenCalledTimes(1);
            expect(nameListener).toHaveBeenCalledTimes(1);
            expect(activeListener).not.toHaveBeenCalled();
        });

        it('notifies global listeners once per call', () => {
            const observer = new StateObserver(createTestState());
            const listener = vi.fn();

            observer.subscribe(listener);
            observer.setState({ count: 1, name: 'a', active: true });

            expect(listener).toHaveBeenCalledTimes(1);
        });

        it('passes correct old values to property listeners', () => {
            const observer = new StateObserver(createTestState());
            const countListener = vi.fn();

            observer.subscribeToProperty('count', countListener);
            observer.setState({ count: 100 });

            expect(countListener).toHaveBeenCalledWith(100, 0, expect.any(Object));
        });
    });
});

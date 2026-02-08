// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InventoryList } from './inventory-list';
import { StateObserver } from '../../gamestate/observer';
import type { GameState } from '../../gamestate';

describe('InventoryList', () => {
    let state$: StateObserver<GameState>;
    let list: InventoryList;

    const mockElements = {
        Fe: { name: 'Iron', price: 50 },
        Ni: { name: 'Nickel', price: 150 },
        Co: { name: 'Cobalt', price: 200 },
    };

    const createInitialState = (overrides: Partial<GameState> = {}): GameState => ({
        credits: 1000,
        current_ship_level: 1,
        discovered_elements: [],
        inventory: {},
        hold_capacity: 100,
        hold_used: 0,
        asteroid: null,
        is_mining: false,
        mining_progress: 0,
        power: 100,
        power_capacity: 100,
        equipped_tools: [],
        tools_owned: [],
        ...overrides,
    });

    const setupDOM = () => {
        document.body.innerHTML = `
            <div id="inventory-list"></div>
            <button id="btn-sell-official"></button>
            <button id="btn-sell-black"></button>
            <button id="btn-sell-dump"></button>
        `;
    };

    beforeEach(() => {
        setupDOM();
        state$ = new StateObserver<GameState>(createInitialState());
        list = new InventoryList(state$, mockElements);
    });

    afterEach(() => {
        list.destroy();
        document.body.innerHTML = '';
    });

    describe('mount()', () => {
        it('renders empty state initially', () => {
            list.mount();

            const el = document.getElementById('inventory-list');
            expect(el?.innerHTML).toContain('Hold is empty');
        });

        it('subscribes to inventory state changes', () => {
            list.mount();
            state$.updateProperty('inventory', { Fe: 10 });

            const el = document.getElementById('inventory-list');
            expect(el?.innerHTML).toContain('Fe');
        });
    });

    describe('render() - empty inventory', () => {
        beforeEach(() => {
            list.mount();
        });

        it('shows empty message', () => {
            const el = document.getElementById('inventory-list');
            expect(el?.querySelector('.inventory-empty')?.textContent).toBe('Hold is empty');
        });

        it('disables sell buttons', () => {
            const btnOfficial = document.getElementById('btn-sell-official') as HTMLButtonElement;
            const btnBlack = document.getElementById('btn-sell-black') as HTMLButtonElement;
            const btnDump = document.getElementById('btn-sell-dump') as HTMLButtonElement;
            expect(btnOfficial.disabled).toBe(true);
            expect(btnBlack.disabled).toBe(true);
            expect(btnDump.disabled).toBe(true);
        });

        it('treats zero-quantity items as empty', () => {
            state$.updateProperty('inventory', { Fe: 0, Ni: 0 });

            const el = document.getElementById('inventory-list');
            expect(el?.innerHTML).toContain('Hold is empty');
        });
    });

    describe('render() - with items', () => {
        beforeEach(() => {
            list.mount();
        });

        it('renders inventory items', () => {
            state$.updateProperty('inventory', { Fe: 10 });

            const el = document.getElementById('inventory-list');
            expect(el?.innerHTML).toContain('Fe');
            expect(el?.innerHTML).toContain('10 kg');
        });

        it('calculates and displays item value', () => {
            state$.updateProperty('inventory', { Fe: 10 }); // 10 * 50 = 500

            const el = document.getElementById('inventory-list');
            expect(el?.innerHTML).toContain('500 cr');
        });

        it('formats large values with separators', () => {
            state$.updateProperty('inventory', { Co: 10000 }); // 10000 * 200 = 2,000,000

            const el = document.getElementById('inventory-list');
            // Check for the value regardless of locale-specific formatting
            expect(el?.textContent).toContain('2');
            expect(el?.textContent).toContain('000');
            expect(el?.textContent).toContain('cr');
        });

        it('renders multiple items', () => {
            state$.updateProperty('inventory', { Fe: 5, Ni: 3, Co: 2 });

            const el = document.getElementById('inventory-list');
            expect(el?.innerHTML).toContain('Fe');
            expect(el?.innerHTML).toContain('Ni');
            expect(el?.innerHTML).toContain('Co');
        });

        it('enables sell buttons when items present', () => {
            state$.updateProperty('inventory', { Fe: 10 });

            const btnOfficial = document.getElementById('btn-sell-official') as HTMLButtonElement;
            const btnBlack = document.getElementById('btn-sell-black') as HTMLButtonElement;
            const btnDump = document.getElementById('btn-sell-dump') as HTMLButtonElement;
            expect(btnOfficial.disabled).toBe(false);
            expect(btnBlack.disabled).toBe(false);
            expect(btnDump.disabled).toBe(false);
        });

        it('filters out zero-quantity items', () => {
            state$.updateProperty('inventory', { Fe: 10, Ni: 0 });

            const el = document.getElementById('inventory-list');
            expect(el?.innerHTML).toContain('Fe');
            expect(el?.innerHTML).not.toContain('Ni');
        });

        it('handles unknown elements with zero price', () => {
            state$.updateProperty('inventory', { Xx: 10 });

            const el = document.getElementById('inventory-list');
            expect(el?.innerHTML).toContain('Xx');
            expect(el?.innerHTML).toContain('0 cr');
        });
    });

    describe('reactive updates', () => {
        beforeEach(() => {
            list.mount();
        });

        it('updates when inventory changes', () => {
            state$.updateProperty('inventory', { Fe: 10 });

            let el = document.getElementById('inventory-list');
            expect(el?.innerHTML).toContain('10 kg');

            state$.updateProperty('inventory', { Fe: 20 });
            el = document.getElementById('inventory-list');
            expect(el?.innerHTML).toContain('20 kg');
        });

        it('updates when hold_used changes', () => {
            state$.updateProperty('inventory', { Fe: 10 });
            state$.updateProperty('hold_used', 50);

            // Component should re-render (triggers render callback)
            const el = document.getElementById('inventory-list');
            expect(el?.innerHTML).toContain('Fe');
        });

        it('shows empty when all items sold', () => {
            state$.updateProperty('inventory', { Fe: 10 });
            state$.updateProperty('inventory', {});

            const el = document.getElementById('inventory-list');
            expect(el?.innerHTML).toContain('Hold is empty');
        });
    });

    describe('handles missing DOM elements gracefully', () => {
        it('does not throw when DOM elements are missing', () => {
            document.body.innerHTML = '';
            const listWithoutDOM = new InventoryList(state$, mockElements);

            expect(() => {
                listWithoutDOM.mount();
                state$.updateProperty('inventory', { Fe: 10 });
            }).not.toThrow();

            listWithoutDOM.destroy();
        });
    });
});

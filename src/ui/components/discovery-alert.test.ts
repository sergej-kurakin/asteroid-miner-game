// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DiscoveryAlert } from './discovery-alert';

describe('DiscoveryAlert', () => {
    let alert: DiscoveryAlert;
    const mockElements = {
        Fe: { name: 'Iron', price: 50 },
        Ni: { name: 'Nickel', price: 150 },
        Co: { name: 'Cobalt', price: 200 },
    };

    const setupDOM = () => {
        document.body.innerHTML = `
            <div id="discovery-alert"></div>
            <div id="discovery-element"></div>
        `;
    };

    beforeEach(() => {
        vi.useFakeTimers();
        setupDOM();
        alert = new DiscoveryAlert(mockElements);
    });

    afterEach(() => {
        alert.destroy();
        vi.useRealTimers();
        document.body.innerHTML = '';
    });

    describe('mount()', () => {
        it('acquires DOM element references', () => {
            alert.mount();
            alert.show('Fe');

            const alertEl = document.getElementById('discovery-alert');
            expect(alertEl?.classList.contains('visible')).toBe(true);
        });
    });

    describe('show()', () => {
        beforeEach(() => {
            alert.mount();
        });

        it('adds visible class to alert element', () => {
            alert.show('Fe');

            const alertEl = document.getElementById('discovery-alert');
            expect(alertEl?.classList.contains('visible')).toBe(true);
        });

        it('displays element symbol and name', () => {
            alert.show('Fe');

            const elementEl = document.getElementById('discovery-element');
            expect(elementEl?.textContent).toBe('Fe - Iron');
        });

        it('displays different elements correctly', () => {
            alert.show('Ni');

            const elementEl = document.getElementById('discovery-element');
            expect(elementEl?.textContent).toBe('Ni - Nickel');
        });

        it('falls back to symbol for unknown elements', () => {
            alert.show('Xx');

            const elementEl = document.getElementById('discovery-element');
            expect(elementEl?.textContent).toBe('Xx - Xx');
        });

        it('removes visible class after timeout', () => {
            alert.show('Fe');

            vi.advanceTimersByTime(3000);

            const alertEl = document.getElementById('discovery-alert');
            expect(alertEl?.classList.contains('visible')).toBe(false);
        });

        it('clears previous timeout when showing new element', () => {
            alert.show('Fe');
            vi.advanceTimersByTime(1500);

            // Show another element before first timeout completes
            alert.show('Ni');
            vi.advanceTimersByTime(1500);

            // Should still be visible (new timeout hasn't expired)
            const alertEl = document.getElementById('discovery-alert');
            expect(alertEl?.classList.contains('visible')).toBe(true);

            // Complete the second timeout
            vi.advanceTimersByTime(1500);
            expect(alertEl?.classList.contains('visible')).toBe(false);
        });
    });

    describe('destroy()', () => {
        it('clears pending timeout', () => {
            alert.mount();
            alert.show('Fe');

            alert.destroy();

            // Advance time - should not cause errors
            vi.advanceTimersByTime(5000);
        });

        it('clears element references', () => {
            alert.mount();
            alert.destroy();

            // Calling show after destroy should not throw
            expect(() => alert.show('Fe')).not.toThrow();
        });
    });

    describe('handles missing DOM elements gracefully', () => {
        it('does not throw when DOM elements are missing', () => {
            document.body.innerHTML = '';
            const alertWithoutDOM = new DiscoveryAlert(mockElements);

            expect(() => {
                alertWithoutDOM.mount();
                alertWithoutDOM.show('Fe');
            }).not.toThrow();

            alertWithoutDOM.destroy();
        });
    });
});

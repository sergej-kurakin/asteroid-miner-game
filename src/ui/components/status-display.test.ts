// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StatusDisplay } from './status-display';

describe('StatusDisplay', () => {
    let display: StatusDisplay;

    const setupDOM = () => {
        document.body.innerHTML = '<div id="status-text"></div>';
    };

    beforeEach(() => {
        setupDOM();
        display = new StatusDisplay();
    });

    afterEach(() => {
        display.destroy();
        document.body.innerHTML = '';
    });

    describe('mount()', () => {
        it('acquires DOM element reference', () => {
            display.mount();
            display.setMessage('Test');

            const el = document.getElementById('status-text');
            expect(el?.textContent).toBe('Test');
        });
    });

    describe('setMessage()', () => {
        beforeEach(() => {
            display.mount();
        });

        it('sets text content of status element', () => {
            display.setMessage('Scanning asteroid...');

            const el = document.getElementById('status-text');
            expect(el?.textContent).toBe('Scanning asteroid...');
        });

        it('updates text content on subsequent calls', () => {
            display.setMessage('First message');
            display.setMessage('Second message');

            const el = document.getElementById('status-text');
            expect(el?.textContent).toBe('Second message');
        });

        it('handles empty string', () => {
            display.setMessage('');

            const el = document.getElementById('status-text');
            expect(el?.textContent).toBe('');
        });
    });

    describe('destroy()', () => {
        it('clears element reference', () => {
            display.mount();
            display.destroy();

            // After destroy, setMessage should not throw but won't update anything
            expect(() => display.setMessage('Test')).not.toThrow();
        });
    });

    describe('handles missing DOM elements gracefully', () => {
        it('does not throw when DOM element is missing', () => {
            document.body.innerHTML = '';
            const displayWithoutDOM = new StatusDisplay();

            expect(() => {
                displayWithoutDOM.mount();
                displayWithoutDOM.setMessage('Test');
            }).not.toThrow();

            displayWithoutDOM.destroy();
        });
    });
});

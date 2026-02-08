// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageAdapter } from './storage';
import type { SaveData } from './interfaces';

describe('LocalStorageAdapter', () => {
    let adapter: LocalStorageAdapter;
    let mockStorage: Record<string, string>;

    const sampleSaveData: SaveData = {
        credits: 1000,
        current_ship_level: 2,
        discovered_elements: ['Fe'],
        inventory: { Fe: 30 },
        hold_used: 30,
        hold_capacity: 150,
        power: 80,
        power_capacity: 120,
        equipped_tools: [],
        tools_owned: []
    };

    beforeEach(() => {
        mockStorage = {};
        vi.stubGlobal('localStorage', {
            getItem: vi.fn((key: string) => mockStorage[key] ?? null),
            setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
            removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
            clear: vi.fn(() => { mockStorage = {}; }),
            get length() { return Object.keys(mockStorage).length; },
            key: vi.fn((index: number) => Object.keys(mockStorage)[index] ?? null)
        });
        adapter = new LocalStorageAdapter();
    });

    describe('save', () => {
        it('stores data in localStorage', () => {
            adapter.save(sampleSaveData);

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'asteroidMiner',
                JSON.stringify(sampleSaveData)
            );
        });

        it('uses custom key when provided', () => {
            const custom = new LocalStorageAdapter('customKey');
            custom.save(sampleSaveData);

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'customKey',
                JSON.stringify(sampleSaveData)
            );
        });

        it('does not throw on storage error', () => {
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
            (localStorage.setItem as ReturnType<typeof vi.fn>).mockImplementation(() => {
                throw new Error('QuotaExceeded');
            });

            expect(() => adapter.save(sampleSaveData)).not.toThrow();
            expect(spy).toHaveBeenCalled();

            spy.mockRestore();
        });
    });

    describe('load', () => {
        it('returns parsed data when present', () => {
            mockStorage['asteroidMiner'] = JSON.stringify(sampleSaveData);

            const result = adapter.load();
            expect(result).toEqual(sampleSaveData);
        });

        it('returns null when no data exists', () => {
            const result = adapter.load();
            expect(result).toBeNull();
        });

        it('returns null on invalid JSON', () => {
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
            mockStorage['asteroidMiner'] = 'not-json';

            const result = adapter.load();
            expect(result).toBeNull();
            expect(spy).toHaveBeenCalled();

            spy.mockRestore();
        });

        it('uses custom key when provided', () => {
            mockStorage['customKey'] = JSON.stringify(sampleSaveData);
            const custom = new LocalStorageAdapter('customKey');

            expect(custom.load()).toEqual(sampleSaveData);
        });
    });
});

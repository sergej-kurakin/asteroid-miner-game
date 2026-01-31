// ========================================
// TYPE DEFINITIONS
// ========================================

import { generateAsteroid } from './asteroids';
import type { ShipData } from './ships';
import { type GameState, StateObserver, type Observable } from './gamestate';
import { getShipByLevel, getNextShip, canAffordShip } from './ships';
import { CONFIG } from './config/config';
import { saveGameState, loadGameState } from './persistence';

interface DOMElements {
    powerValue: HTMLElement;
    powerFill: HTMLElement;
    laserValue: HTMLElement;
    laserFill: HTMLElement;
    holdValue: HTMLElement;
    holdFill: HTMLElement;
    statusText: HTMLElement;
    btnScan: HTMLButtonElement;
    btnMine: HTMLButtonElement;
    btnAbandon: HTMLButtonElement;
    asteroid: HTMLElement;
    asteroidPlaceholder: HTMLElement;
    miningProgressContainer: HTMLElement;
    miningProgressFill: HTMLElement;
    compositionGrid: HTMLElement;
    creditsValue: HTMLElement;
    discoveryAlert: HTMLElement;
    discoveryElement: HTMLElement;
    inventoryList: HTMLElement;
    btnSell: HTMLButtonElement;
    shipInfo: HTMLElement;
}

// ========================================
// GAME STATE
// ========================================

let gameState$: Observable<GameState>;

function setupStateSubscriptions(): void {
    gameState$.subscribeToProperty('credits', () => {
        renderCredits();
        canAffordShipUpgrade();
    });
    gameState$.subscribeToProperty('hold_used', () => {
        renderGauges();
        renderInventory();
    });
    gameState$.subscribeToProperty('hold_capacity', renderGauges);
    gameState$.subscribeToProperty('asteroid', renderComposition);
    gameState$.subscribeToProperty('current_ship_level', renderShipInfo);
    gameState$.subscribeToProperty('inventory', renderInventory);
    gameState$.subscribeToProperty('is_mining', updateButtonStates);
}

// ========================================
// DOM CACHE
// ========================================
const DOM: Partial<DOMElements> = {};

function cacheDOMElements(): void {
    DOM.powerValue = document.getElementById('power-value')!;
    DOM.powerFill = document.getElementById('power-fill')!;
    DOM.laserValue = document.getElementById('laser-value')!;
    DOM.laserFill = document.getElementById('laser-fill')!;
    DOM.holdValue = document.getElementById('hold-value')!;
    DOM.holdFill = document.getElementById('hold-fill')!;
    DOM.statusText = document.getElementById('status-text')!;
    DOM.btnScan = document.getElementById('btn-scan') as HTMLButtonElement;
    DOM.btnMine = document.getElementById('btn-mine') as HTMLButtonElement;
    DOM.btnAbandon = document.getElementById('btn-abandon') as HTMLButtonElement;
    DOM.asteroid = document.getElementById('asteroid')!;
    DOM.asteroidPlaceholder = document.getElementById('asteroid-placeholder')!;
    DOM.miningProgressContainer = document.getElementById('mining-progress-container')!;
    DOM.miningProgressFill = document.getElementById('mining-progress-fill')!;
    DOM.compositionGrid = document.getElementById('composition-grid')!;
    DOM.creditsValue = document.getElementById('credits-value')!;
    DOM.discoveryAlert = document.getElementById('discovery-alert')!;
    DOM.discoveryElement = document.getElementById('discovery-element')!;
    DOM.inventoryList = document.getElementById('inventory-list')!;
    DOM.btnSell = document.getElementById('btn-sell') as HTMLButtonElement;
    DOM.shipInfo = document.getElementById('ship-info')!;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function formatNumber(num: number): string {
    return num.toLocaleString();
}

// ========================================
// SHIP HELPER FUNCTIONS
// ========================================
function getCurrentShip(): ShipData {
    return getShipByLevel(gameState$.getState().current_ship_level);
}

function getNextShipForUpgrade(): ShipData | undefined {
    return getNextShip(gameState$.getState().current_ship_level);
}

function canAffordShipUpgrade(): boolean {
    const nextShip = getNextShipForUpgrade();
    return nextShip !== undefined && canAffordShip(gameState$.getState().credits, nextShip);
}

function upgradeShip(): void {
    const state = gameState$.getState();
    const nextShip = getNextShipForUpgrade();
    if (!nextShip || state.credits < nextShip.cost) return;

    // Update hold capacity proportionally
    const currentPercent = state.hold_used / state.hold_capacity;
    const newHoldUsed = Math.min(
        Math.floor(currentPercent * nextShip.holdCapacity),
        nextShip.holdCapacity
    );

    gameState$.setState({
        credits: state.credits - nextShip.cost,
        current_ship_level: nextShip.id,
        hold_capacity: nextShip.holdCapacity,
        hold_used: newHoldUsed
    });

    updateStatus(`Upgraded to ${nextShip.name}!`);
    renderCredits();
    renderShipInfo();
    renderGauges();
    saveGameState(gameState$.getState());
}

// ========================================
// RENDERING FUNCTIONS
// ========================================
function renderGauges(): void {
    const state = gameState$.getState();

    // Power gauge
    DOM.powerValue!.textContent = `${Math.round(state.power)}%`;
    (DOM.powerFill as HTMLElement).style.width = `${state.power}%`;

    // Laser gauge (shows mining progress when active)
    if (state.is_mining) {
        DOM.laserValue!.textContent = 'Active';
        (DOM.laserFill as HTMLElement).style.width = `${state.mining_progress * 100}%`;
    } else {
        DOM.laserValue!.textContent = state.asteroid ? 'Ready' : 'Standby';
        (DOM.laserFill as HTMLElement).style.width = '0%';
    }

    // Hold gauge
    DOM.holdValue!.textContent = `${state.hold_used} / ${state.hold_capacity}`;
    (DOM.holdFill as HTMLElement).style.width = `${(state.hold_used / state.hold_capacity) * 100}%`;
}

function renderCredits(): void {
    DOM.creditsValue!.textContent = formatNumber(gameState$.getState().credits);
}

function renderInventory(): void {
    const inventory = gameState$.getState().inventory;
    const elements = Object.keys(inventory).filter(el => inventory[el] > 0);

    if (elements.length === 0) {
        DOM.inventoryList!.innerHTML = '<div class="inventory-empty">Hold is empty</div>';
        DOM.btnSell!.disabled = true;
        return;
    }

    DOM.btnSell!.disabled = false;

    let html = '';
    for (const el of elements) {
        const amount = inventory[el];
        const price = CONFIG.elements[el].price;
        const value = amount * price;
        html += `
            <div class="inventory-item">
                <div class="inventory-element">${el}</div>
                <div class="inventory-details">
                    <div class="inventory-amount">${amount} kg</div>
                    <div class="inventory-value">${formatNumber(value)} cr</div>
                </div>
            </div>
        `;
    }

    DOM.inventoryList!.innerHTML = html;
}

function renderComposition(): void {
    const asteroid = gameState$.getState().asteroid;
    if (!asteroid) {
        DOM.compositionGrid!.innerHTML = `
            <div class="composition-item" style="opacity: 0.3;">
                <div class="composition-element">--</div>
                <div class="composition-percent">--%</div>
            </div>
            <div class="composition-item" style="opacity: 0.3;">
                <div class="composition-element">--</div>
                <div class="composition-percent">--%</div>
            </div>
            <div class="composition-item" style="opacity: 0.3;">
                <div class="composition-element">--</div>
                <div class="composition-percent">--%</div>
            </div>
        `;
        return;
    }

    let html = '';
    for (const [element, percent] of Object.entries(asteroid.composition)) {
        html += `
            <div class="composition-item">
                <div class="composition-element">${element}</div>
                <div class="composition-percent">${percent}%</div>
            </div>
        `;
    }

    DOM.compositionGrid!.innerHTML = html;
}

function updateStatus(message: string): void {
    DOM.statusText!.textContent = message;
}

function updateButtonStates(): void {
    const state = gameState$.getState();
    DOM.btnScan!.disabled = state.is_mining || state.asteroid !== null;
    DOM.btnMine!.disabled = state.is_mining || state.asteroid === null;
    DOM.btnAbandon!.disabled = state.is_mining || state.asteroid === null;
}

function renderShipInfo(): void {
    const currentShip = getCurrentShip();
    const nextShip = getNextShipForUpgrade();
    const credits = gameState$.getState().credits;

    let html = `
        <div class="ship-current">
            <div class="ship-level">Level ${currentShip.id}</div>
            <div class="ship-name">${currentShip.name}</div>
            <div class="ship-stats">
                <div class="ship-stat">
                    <span class="stat-label">Hold:</span>
                    <span class="stat-value">${currentShip.holdCapacity} units</span>
                </div>
                <div class="ship-stat">
                    <span class="stat-label">Speed:</span>
                    <span class="stat-value">${(currentShip.miningTime / 1000).toFixed(1)}s</span>
                </div>
                <div class="ship-stat">
                    <span class="stat-label">Slots:</span>
                    <span class="stat-value">${currentShip.toolSlots}</span>
                </div>
            </div>
        </div>
    `;

    if (nextShip) {
        const canAfford = credits >= nextShip.cost;
        html += `
            <div class="ship-upgrade">
                <div class="upgrade-arrow">▼</div>
                <div class="ship-next">
                    <div class="ship-name">${nextShip.name}</div>
                    <div class="ship-stats">
                        <div class="ship-stat">
                            <span class="stat-label">Hold:</span>
                            <span class="stat-value">${nextShip.holdCapacity}</span>
                        </div>
                        <div class="ship-stat">
                            <span class="stat-label">Speed:</span>
                            <span class="stat-value">${(nextShip.miningTime / 1000).toFixed(1)}s</span>
                        </div>
                        <div class="ship-stat">
                            <span class="stat-label">Slots:</span>
                            <span class="stat-value">${nextShip.toolSlots}</span>
                        </div>
                    </div>
                </div>
                <button
                    class="btn btn-upgrade-ship ${canAfford ? 'affordable' : 'unaffordable'}"
                    id="btn-upgrade-ship"
                    ${!canAfford ? 'disabled' : ''}
                >
                    Upgrade - ${formatNumber(nextShip.cost)} cr
                </button>
            </div>
        `;
    } else {
        html += `<div class="ship-max-level"><div class="max-level-text">Maximum Ship Level Reached</div></div>`;
    }

    DOM.shipInfo!.innerHTML = html;

    const btnUpgrade = document.getElementById('btn-upgrade-ship') as HTMLButtonElement;
    if (btnUpgrade) {
        btnUpgrade.addEventListener('click', upgradeShip);
    }
}

// ========================================
// DISCOVERY SYSTEM
// ========================================
let discoveryTimeout: number | null = null;

function showDiscoveryAlert(element: string): void {
    if (discoveryTimeout) {
        clearTimeout(discoveryTimeout);
    }

    DOM.discoveryElement!.textContent = `${element} - ${CONFIG.elements[element].name}`;
    DOM.discoveryAlert!.classList.add('visible');

    discoveryTimeout = window.setTimeout(() => {
        DOM.discoveryAlert!.classList.remove('visible');
        discoveryTimeout = null;
    }, CONFIG.alertDuration);
}

function checkDiscovery(element: string): boolean {
    const discovered = gameState$.getState().discovered_elements;
    if (!discovered.includes(element)) {
        gameState$.updateProperty('discovered_elements', [...discovered, element]);
        showDiscoveryAlert(element);
        return true;
    }
    return false;
}

// ========================================
// GAME LOGIC
// ========================================
function abandonAsteroid(): void {
    const state = gameState$.getState();
    if (state.is_mining || state.asteroid === null) return;

    // Clear asteroid
    gameState$.updateProperty('asteroid', null);

    // Update UI
    DOM.asteroid!.classList.remove('visible');
    (DOM.asteroidPlaceholder as HTMLElement).style.display = 'block';

    updateStatus('Asteroid Abandoned');
    renderComposition();
    updateButtonStates();
}

function scanAsteroid(): void {
    const state = gameState$.getState();
    if (state.is_mining || state.asteroid !== null) return;

    // Generate asteroid based on current ship level
    const newAsteroid = generateAsteroid(state.current_ship_level);
    gameState$.updateProperty('asteroid', newAsteroid);

    // Update UI
    DOM.asteroid!.classList.add('visible');
    (DOM.asteroidPlaceholder as HTMLElement).style.display = 'none';

    updateStatus('Asteroid Locked');
    renderComposition();
    updateButtonStates();
    saveGameState(gameState$.getState());
}

let miningStartTime: number | null = null;

function startMining(): void {
    const state = gameState$.getState();
    if (state.is_mining || !state.asteroid) return;

    gameState$.setState({
        is_mining: true,
        mining_progress: 0
    });
    miningStartTime = performance.now();

    DOM.asteroid!.classList.add('mining');
    DOM.miningProgressContainer!.classList.add('visible');

    updateStatus('Mining in Progress...');
    updateButtonStates();
    renderGauges();

    // Start animation loop
    requestAnimationFrame(updateMiningProgress);
}

function updateMiningProgress(currentTime: number): void {
    const state = gameState$.getState();
    if (!state.is_mining) return;

    const elapsed = currentTime - miningStartTime!;
    const miningTime = state.asteroid?.miningTime ?? getCurrentShip().miningTime;
    const progress = Math.min(elapsed / miningTime, 1);
    gameState$.updateProperty('mining_progress', progress);

    (DOM.miningProgressFill as HTMLElement).style.width = `${progress * 100}%`;
    renderGauges();

    if (progress >= 1) {
        completeMining();
    } else {
        requestAnimationFrame(updateMiningProgress);
    }
}

function completeMining(): void {
    const state = gameState$.getState();
    if (!state.asteroid) return;

    const asteroid = state.asteroid;

    // Calculate resources collected
    let totalCollected = 0;
    const collected: { [element: string]: number } = {};
    const newInventory = { ...state.inventory };

    for (const [element, percent] of Object.entries(asteroid.composition)) {
        const amount = Math.round((percent / 100) * asteroid.totalYield);
        if (amount > 0) {
            collected[element] = amount;
            totalCollected += amount;

            // Add to inventory
            newInventory[element] = (newInventory[element] || 0) + amount;

            // Check for discovery
            checkDiscovery(element);
        }
    }

    // Update hold and reset mining state
    gameState$.setState({
        inventory: newInventory,
        hold_used: Math.min(state.hold_used + totalCollected, state.hold_capacity),
        is_mining: false,
        mining_progress: 0,
        asteroid: null
    });

    // Update UI
    DOM.asteroid!.classList.remove('visible', 'mining');
    (DOM.asteroidPlaceholder as HTMLElement).style.display = 'block';
    DOM.miningProgressContainer!.classList.remove('visible');
    (DOM.miningProgressFill as HTMLElement).style.width = '0%';

    updateStatus('Mining Complete');
    renderGauges();
    renderInventory();
    renderComposition();
    updateButtonStates();
    saveGameState(gameState$.getState());
}

function sellResources(): void {
    const state = gameState$.getState();
    const inventory = state.inventory;
    let totalValue = 0;

    for (const [element, amount] of Object.entries(inventory)) {
        if (amount > 0) {
            const price = CONFIG.elements[element].price;
            totalValue += amount * price;
        }
    }

    if (totalValue > 0) {
        gameState$.setState({
            credits: state.credits + totalValue,
            inventory: {},
            hold_used: 0
        });

        updateStatus(`Sold for ${formatNumber(totalValue)} credits`);
        renderCredits();
        renderInventory();
        renderGauges();
        saveGameState(gameState$.getState());
    }
}

// ========================================
// INITIALIZATION
// ========================================
function init(): void {
    cacheDOMElements();

    // Load saved game and create observable state
    const initialState = loadGameState();
    gameState$ = new StateObserver(initialState);

    // Set up state subscriptions for automatic UI updates
    setupStateSubscriptions();

    // Attach event listeners
    DOM.btnScan!.addEventListener('click', scanAsteroid);
    DOM.btnMine!.addEventListener('click', startMining);
    DOM.btnAbandon!.addEventListener('click', abandonAsteroid);
    DOM.btnSell!.addEventListener('click', sellResources);

    // Initial render
    renderGauges();
    renderCredits();
    renderInventory();
    renderComposition();
    renderShipInfo();
    updateButtonStates();

    // Auto-save interval
    setInterval(() => saveGameState(gameState$.getState()), CONFIG.autoSaveInterval);

    console.log('Asteroid Miner initialized');
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// ========================================
// TYPE DEFINITIONS
// ========================================

import { generateAsteroid } from './asteroids';
import type { IShipController } from './ships';
import { type GameState, StateObserver, type Observable } from './gamestate';
import { ShipController } from './ships';
import { CONFIG } from './config/config';
import { saveGameState, loadGameState } from './persistence';
import { MiningController, type IMiningController, type MiningEvent, type ElementPrices } from './mining';
import { PowerController, type IPowerController } from './power';

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
    powerCurrent: HTMLElement;
    powerMax: HTMLElement;
    btnBuyPower: HTMLButtonElement;
}

// ========================================
// GAME STATE
// ========================================

let gameState$: Observable<GameState>;
let shipController: IShipController;
let miningController: IMiningController;
let powerController: IPowerController;

function setupStateSubscriptions(): void {
    gameState$.subscribeToProperty('credits', () => {
        renderCredits();
        renderShipInfo();
        renderPowerButton();
    });
    gameState$.subscribeToProperty('hold_used', () => {
        renderGauges();
        renderInventory();
    });
    gameState$.subscribeToProperty('hold_capacity', renderGauges);
    gameState$.subscribeToProperty('power', () => {
        renderGauges();
        renderPowerButton();
        updateButtonStates();
    });
    gameState$.subscribeToProperty('power_capacity', () => {
        renderGauges();
        renderPowerButton();
    });
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
    DOM.powerCurrent = document.getElementById('power-current')!;
    DOM.powerMax = document.getElementById('power-max')!;
    DOM.btnBuyPower = document.getElementById('btn-buy-power') as HTMLButtonElement;
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
function handleShipUpgrade(): void {
    const result = shipController.upgrade();
    if (result.success && result.newShip) {
        updateStatus(`Upgraded to ${result.newShip.name}!`);
        saveGameState(gameState$.getState());
    }
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

    let html = `
        <div class="composition-item" style="font-weight: bold; border-bottom: 1px solid currentColor; padding-bottom: 4px; margin-bottom: 4px;">
            <div class="composition-element">${asteroid.type.toUpperCase()}</div>
            <div class="composition-percent">${asteroid.totalYield} kg</div>
        </div>
    `;

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
    DOM.btnScan!.disabled = state.is_mining || state.asteroid !== null || state.power < 5;
    DOM.btnMine!.disabled = state.is_mining || state.asteroid === null || state.power < 10;
    DOM.btnAbandon!.disabled = state.is_mining || state.asteroid === null;
}

function renderShipInfo(): void {
    const currentShip = shipController.getCurrentShip();
    const nextShip = shipController.getNextShip();
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
        btnUpgrade.addEventListener('click', handleShipUpgrade);
    }
}

function renderPowerButton(): void {
    const state = gameState$.getState();
    const canBuy = powerController.canBuyPower();

    // Update power stats display
    if (DOM.powerCurrent) {
        DOM.powerCurrent.textContent = Math.round(state.power).toString();
    }
    if (DOM.powerMax) {
        DOM.powerMax.textContent = state.power_capacity.toString();
    }

    // Update button state
    if (DOM.btnBuyPower) {
        DOM.btnBuyPower.disabled = !canBuy;
        DOM.btnBuyPower.className = `btn btn-buy-power ${canBuy ? 'affordable' : 'unaffordable'}`;
    }
}

function handleBuyPower(): void {
    const result = powerController.buyPower();

    if (result.success) {
        updateStatus('Power Recharged (+50)');
        saveGameState(gameState$.getState());
    } else if (result.error === 'insufficient_credits') {
        updateStatus('Insufficient Credits');
    } else if (result.error === 'power_full') {
        updateStatus('Power Cell Full');
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

    // Check power
    const SCAN_POWER_COST = 5;
    if (state.power < SCAN_POWER_COST) {
        updateStatus('Insufficient Power');
        return;
    }

    // Deduct power
    gameState$.updateProperty('power', state.power - SCAN_POWER_COST);

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

function handleMiningEvent(event: MiningEvent): void {
    switch (event.type) {
        case 'mining_started':
            DOM.asteroid!.classList.add('mining');
            DOM.miningProgressContainer!.classList.add('visible');
            updateStatus('Mining in Progress...');
            updateButtonStates();
            break;

        case 'mining_progress':
            (DOM.miningProgressFill as HTMLElement).style.width = `${event.progress * 100}%`;
            break;

        case 'discovery':
            showDiscoveryAlert(event.element);
            break;

        case 'mining_completed':
            DOM.asteroid!.classList.remove('visible', 'mining');
            (DOM.asteroidPlaceholder as HTMLElement).style.display = 'block';
            DOM.miningProgressContainer!.classList.remove('visible');
            (DOM.miningProgressFill as HTMLElement).style.width = '0%';
            updateStatus('Mining Complete');
            renderComposition();
            updateButtonStates();
            saveGameState(gameState$.getState());
            break;

        case 'mining_failed':
            if (event.reason === 'insufficient_power') {
                updateStatus('Insufficient Power');
            }
            break;
    }
}

function handleStartMining(): void {
    miningController.startMining();
}

function handleSellResources(): void {
    const result = miningController.sellResources();
    if (result) {
        updateStatus(`Sold for ${formatNumber(result.totalValue)} credits`);
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

    // Build element prices map from config
    const elementPrices: ElementPrices = {};
    for (const [symbol, data] of Object.entries(CONFIG.elements)) {
        elementPrices[symbol] = data.price;
    }

    // Initialize controllers
    shipController = new ShipController(gameState$);
    powerController = new PowerController(gameState$);
    miningController = new MiningController(gameState$, elementPrices);

    // Subscribe to mining events
    miningController.subscribe(handleMiningEvent);

    // Set up state subscriptions for automatic UI updates
    setupStateSubscriptions();

    // Attach event listeners
    DOM.btnScan!.addEventListener('click', scanAsteroid);
    DOM.btnMine!.addEventListener('click', handleStartMining);
    DOM.btnAbandon!.addEventListener('click', abandonAsteroid);
    DOM.btnSell!.addEventListener('click', handleSellResources);
    DOM.btnBuyPower!.addEventListener('click', handleBuyPower);

    // Initial render
    renderGauges();
    renderCredits();
    renderInventory();
    renderComposition();
    renderShipInfo();
    renderPowerButton();
    updateButtonStates();

    // Auto-save interval
    setInterval(() => saveGameState(gameState$.getState()), CONFIG.autoSaveInterval);

    console.log('Asteroid Miner initialized');
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', init);

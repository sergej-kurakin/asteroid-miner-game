// ========================================
// TYPE DEFINITIONS
// ========================================

import { generateAsteroid } from './asteroids';
import type { ShipData } from './ships';
import type { GameState } from './gamestate/interfaces';
import { getShipByLevel, getNextShip, canAffordShip, getInitialShip } from './ships';
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

function updateUIOnChange(prop: string) {
    switch (prop) {
        case 'credits':
            renderCredits();
            canAffordShipUpgrade();
            break;
        case 'hold_used':
        case 'hold_capacity':
            renderGauges();
            renderInventory();
            break;
        case 'asteroid':
            renderComposition();
            break;
        case 'current_ship_level':
            renderShipInfo();
            break;
    }
}

let gameState = new Proxy<GameState>({
    credits: 0,
    current_ship_level: 1,
    discovered_elements: [],
    inventory: {},
    hold_capacity: getInitialShip().holdCapacity,
    hold_used: 0,
    asteroid: null,
    is_mining: false,
    mining_progress: 0,
    power: 100
}, {
    set(target, prop, value) {
        (target as any)[prop] = value;
        updateUIOnChange(prop as string);
        return true;
    }
});

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
    return getShipByLevel(gameState.current_ship_level);
}

function getNextShipForUpgrade(): ShipData | undefined {
    return getNextShip(gameState.current_ship_level);
}

function canAffordShipUpgrade(): boolean {
    const nextShip = getNextShipForUpgrade();
    return nextShip !== undefined && canAffordShip(gameState.credits, nextShip);
}

function upgradeShip(): void {
    const nextShip = getNextShipForUpgrade();
    if (!nextShip || gameState.credits < nextShip.cost) return;

    gameState.credits -= nextShip.cost;
    gameState.current_ship_level = nextShip.id;

    // Update hold capacity proportionally
    const currentPercent = gameState.hold_used / gameState.hold_capacity;
    gameState.hold_capacity = nextShip.holdCapacity;
    gameState.hold_used = Math.min(
        Math.floor(currentPercent * gameState.hold_capacity),
        gameState.hold_capacity
    );

    updateStatus(`Upgraded to ${nextShip.name}!`);
    renderCredits();
    renderShipInfo();
    renderGauges();
    saveGameState(gameState);
}

// ========================================
// RENDERING FUNCTIONS
// ========================================
function renderGauges(): void {
    // Power gauge
    DOM.powerValue!.textContent = `${Math.round(gameState.power)}%`;
    (DOM.powerFill as HTMLElement).style.width = `${gameState.power}%`;

    // Laser gauge (shows mining progress when active)
    if (gameState.is_mining) {
        DOM.laserValue!.textContent = 'Active';
        (DOM.laserFill as HTMLElement).style.width = `${gameState.mining_progress * 100}%`;
    } else {
        DOM.laserValue!.textContent = gameState.asteroid ? 'Ready' : 'Standby';
        (DOM.laserFill as HTMLElement).style.width = '0%';
    }

    // Hold gauge
    DOM.holdValue!.textContent = `${gameState.hold_used} / ${gameState.hold_capacity}`;
    (DOM.holdFill as HTMLElement).style.width = `${(gameState.hold_used / gameState.hold_capacity) * 100}%`;
}

function renderCredits(): void {
    DOM.creditsValue!.textContent = formatNumber(gameState.credits);
}

function renderInventory(): void {
    const elements = Object.keys(gameState.inventory).filter(el => gameState.inventory[el] > 0);

    if (elements.length === 0) {
        DOM.inventoryList!.innerHTML = '<div class="inventory-empty">Hold is empty</div>';
        DOM.btnSell!.disabled = true;
        return;
    }

    DOM.btnSell!.disabled = false;

    let html = '';
    for (const el of elements) {
        const amount = gameState.inventory[el];
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
    if (!gameState.asteroid) {
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
    for (const [element, percent] of Object.entries(gameState.asteroid.composition)) {
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
    DOM.btnScan!.disabled = gameState.is_mining || gameState.asteroid !== null;
    DOM.btnMine!.disabled = gameState.is_mining || gameState.asteroid === null;
    DOM.btnAbandon!.disabled = gameState.is_mining || gameState.asteroid === null;
}

function renderShipInfo(): void {
    const currentShip = getCurrentShip();
    const nextShip = getNextShipForUpgrade();

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
        const canAfford = gameState.credits >= nextShip.cost;
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
    if (!gameState.discovered_elements.includes(element)) {
        gameState.discovered_elements.push(element);
        showDiscoveryAlert(element);
        return true;
    }
    return false;
}

// ========================================
// GAME LOGIC
// ========================================
function abandonAsteroid(): void {
    if (gameState.is_mining || gameState.asteroid === null) return;

    // Clear asteroid
    gameState.asteroid = null;

    // Update UI
    DOM.asteroid!.classList.remove('visible');
    (DOM.asteroidPlaceholder as HTMLElement).style.display = 'block';

    updateStatus('Asteroid Abandoned');
    renderComposition();
    updateButtonStates();
}

function scanAsteroid(): void {
    if (gameState.is_mining || gameState.asteroid !== null) return;

    // Generate asteroid based on current ship level
    gameState.asteroid = generateAsteroid(gameState.current_ship_level);

    // Update UI
    DOM.asteroid!.classList.add('visible');
    (DOM.asteroidPlaceholder as HTMLElement).style.display = 'none';

    updateStatus('Asteroid Locked');
    renderComposition();
    updateButtonStates();
    saveGameState(gameState);
}

let miningStartTime: number | null = null;

function startMining(): void {
    if (gameState.is_mining || !gameState.asteroid) return;

    gameState.is_mining = true;
    gameState.mining_progress = 0;
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
    if (!gameState.is_mining) return;

    const elapsed = currentTime - miningStartTime!;
    const miningTime = gameState.asteroid?.miningTime ?? getCurrentShip().miningTime;
    gameState.mining_progress = Math.min(elapsed / miningTime, 1);

    (DOM.miningProgressFill as HTMLElement).style.width = `${gameState.mining_progress * 100}%`;
    renderGauges();

    if (gameState.mining_progress >= 1) {
        completeMining();
    } else {
        requestAnimationFrame(updateMiningProgress);
    }
}

function completeMining(): void {
    if (!gameState.asteroid) return;

    const asteroid = gameState.asteroid;

    // Calculate resources collected
    let totalCollected = 0;
    const collected: { [element: string]: number } = {};

    for (const [element, percent] of Object.entries(asteroid.composition)) {
        const amount = Math.round((percent / 100) * asteroid.totalYield);
        if (amount > 0) {
            collected[element] = amount;
            totalCollected += amount;

            // Add to inventory
            gameState.inventory[element] = (gameState.inventory[element] || 0) + amount;

            // Check for discovery
            checkDiscovery(element);
        }
    }

    // Update hold
    gameState.hold_used = Math.min(
        gameState.hold_used + totalCollected,
        gameState.hold_capacity
    );

    // Reset mining state
    gameState.is_mining = false;
    gameState.mining_progress = 0;
    gameState.asteroid = null;

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
    saveGameState(gameState);
}

function sellResources(): void {
    const inventory = gameState.inventory;
    let totalValue = 0;

    for (const [element, amount] of Object.entries(inventory)) {
        if (amount > 0) {
            const price = CONFIG.elements[element].price;
            totalValue += amount * price;
        }
    }

    if (totalValue > 0) {
        gameState.credits += totalValue;
        gameState.inventory = {};
        gameState.hold_used = 0;

        updateStatus(`Sold for ${formatNumber(totalValue)} credits`);
        renderCredits();
        renderInventory();
        renderGauges();
        saveGameState(gameState);
    }
}

// ========================================
// INITIALIZATION
// ========================================
function init(): void {
    cacheDOMElements();

    // Load saved game
    gameState = loadGameState();

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
    setInterval(() => saveGameState(gameState), CONFIG.autoSaveInterval);

    console.log('Asteroid Miner initialized');
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', init);

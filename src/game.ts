// ========================================
// TYPE DEFINITIONS
// ========================================

import { AsteroidsController, type IAsteroidsController } from './asteroids';
import type { IShipController } from './ships';
import { type GameState, StateObserver, type Observable } from './gamestate';
import { ShipController } from './ships';
import { CONFIG } from './config/config';
import { saveGameState, loadGameState } from './persistence';
import { MiningController, type IMiningController, type MiningEvent, type ElementPrices } from './mining';
import { PowerController, type IPowerController } from './power';
import {
    type UIComponent,
    formatNumber,
    GaugeComponent,
    CreditsDisplay,
    InventoryList,
    CompositionGrid,
    ShipInfo,
    PowerButton,
    StatusDisplay,
    DiscoveryAlert,
    ControlButtons,
    AsteroidView
} from './ui';

// ========================================
// GAME STATE
// ========================================

let gameState$: Observable<GameState>;
let shipController: IShipController;
let miningController: IMiningController;
let powerController: IPowerController;
let asteroidsController: IAsteroidsController;

// ========================================
// UI COMPONENTS
// ========================================

const components: UIComponent[] = [];
let statusDisplay: StatusDisplay;
let discoveryAlert: DiscoveryAlert;
let asteroidView: AsteroidView;

// ========================================
// SHIP HELPER FUNCTIONS
// ========================================
function handleShipUpgrade(): void {
    const result = shipController.upgrade();
    if (result.success && result.newShip) {
        statusDisplay.setMessage(`Upgraded to ${result.newShip.name}!`);
        saveGameState(gameState$.getState());
    }
}

// ========================================
// POWER HELPER FUNCTIONS
// ========================================
function handleBuyPower(): void {
    const result = powerController.buyPower();

    if (result.success) {
        statusDisplay.setMessage('Power Recharged (+50)');
        saveGameState(gameState$.getState());
    } else if (result.error === 'insufficient_credits') {
        statusDisplay.setMessage('Insufficient Credits');
    } else if (result.error === 'power_full') {
        statusDisplay.setMessage('Power Cell Full');
    }
}

// ========================================
// ASTEROID ACTIONS
// ========================================
function abandonAsteroid(): void {
    const result = asteroidsController.abandon();

    if (result.success) {
        asteroidView.hideAsteroid();
        statusDisplay.setMessage('Asteroid Abandoned');
    }
}

function scanAsteroid(): void {
    const result = asteroidsController.scan();

    if (result.success) {
        asteroidView.showAsteroid();
        statusDisplay.setMessage('Asteroid Locked');
        saveGameState(gameState$.getState());
    } else if (result.error === 'insufficient_power') {
        statusDisplay.setMessage('Insufficient Power');
    }
}

// ========================================
// MINING EVENT HANDLER
// ========================================
function handleMiningEvent(event: MiningEvent): void {
    switch (event.type) {
        case 'mining_started':
            asteroidView.setMining(true);
            statusDisplay.setMessage('Mining in Progress...');
            break;

        case 'mining_progress':
            asteroidView.setProgress(event.progress);
            break;

        case 'discovery':
            discoveryAlert.show(event.element);
            break;

        case 'mining_completed':
            asteroidView.hideAsteroid();
            statusDisplay.setMessage('Mining Complete');
            saveGameState(gameState$.getState());
            break;

        case 'mining_failed':
            if (event.reason === 'insufficient_power') {
                statusDisplay.setMessage('Insufficient Power');
            }
            break;
    }
}

function handleStartMining(): void {
    miningController.startMining();
}

// ========================================
// SELL RESOURCES
// ========================================
function handleSellResources(): void {
    const result = miningController.sellResources();
    if (result) {
        statusDisplay.setMessage(`Sold for ${formatNumber(result.totalValue)} credits`);
        saveGameState(gameState$.getState());
    }
}

// ========================================
// COMPONENT INITIALIZATION
// ========================================
function initComponents(): void {
    // Create imperative components first (needed by other code)
    statusDisplay = new StatusDisplay();
    discoveryAlert = new DiscoveryAlert(CONFIG.elements);
    asteroidView = new AsteroidView(gameState$);

    // Create all components
    const allComponents: UIComponent[] = [
        // Gauges
        new GaugeComponent(gameState$, 'power'),
        new GaugeComponent(gameState$, 'laser'),
        new GaugeComponent(gameState$, 'hold'),

        // Simple displays
        new CreditsDisplay(gameState$),
        statusDisplay,
        new CompositionGrid(gameState$),
        discoveryAlert,
        asteroidView,

        // Complex components
        new InventoryList(gameState$, CONFIG.elements),
        new ShipInfo(gameState$, shipController, handleShipUpgrade),
        new PowerButton(gameState$, powerController, handleBuyPower),

        // Control buttons
        new ControlButtons(gameState$, asteroidsController, {
            onScan: scanAsteroid,
            onMine: handleStartMining,
            onAbandon: abandonAsteroid
        })
    ];

    // Mount all components
    for (const component of allComponents) {
        component.mount();
        components.push(component);
    }

    // Attach sell button listener (not part of component system)
    const btnSell = document.getElementById('btn-sell') as HTMLButtonElement;
    if (btnSell) {
        btnSell.addEventListener('click', handleSellResources);
    }
}

// ========================================
// INITIALIZATION
// ========================================
function init(): void {
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
    asteroidsController = new AsteroidsController(gameState$);

    // Subscribe to mining events
    miningController.subscribe(handleMiningEvent);

    // Initialize UI components
    initComponents();

    // Auto-save interval
    setInterval(() => saveGameState(gameState$.getState()), CONFIG.autoSaveInterval);

    console.log('Asteroid Miner initialized');
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', init);

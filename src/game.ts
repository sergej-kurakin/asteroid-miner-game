// ========================================
// TYPE DEFINITIONS
// ========================================

import { AsteroidsController, type IAsteroidsController } from './asteroids';
import type { IShipController } from './ships';
import { type GameState, StateObserver, type Observable } from './gamestate';
import { ShipController } from './ships';
import { CONFIG } from './config/config';
import { createPersistenceController, type IPersistenceController } from './persistence';
import { MiningController, type IMiningController, type MiningEvent } from './mining';
import { Market, type IMarket, OfficialMarketSystem, BlackMarketSystem, DumpMarketSystem } from './market';
import { PowerController, type IPowerController } from './power';
import { ToolController, type IToolController } from './tools';
import { WorldGenerator } from './world';
import type { World } from './world';
import type { CellPosition } from './world';
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
    AsteroidView,
    ToolPanel,
    NavigationPanel
} from './ui';

// ========================================
// GAME STATE
// ========================================

let gameState$: Observable<GameState>;
let persistence: IPersistenceController;
let shipController: IShipController;
let miningController: IMiningController;
let powerController: IPowerController;
let asteroidsController: IAsteroidsController;
let toolController: IToolController;
let market: IMarket;
let world: World;

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
    if (result.success) {
        statusDisplay.setMessage(`Upgraded to ${result.newShip.name}!`);
        persistence.save(gameState$.getState());
    }
}

// ========================================
// TRAVEL HELPER FUNCTIONS
// ========================================
function handleTravel(dest: CellPosition): void {
    const result = shipController.travel(dest);
    if (result.success) {
        statusDisplay.setMessage(`Traveled to (${dest.x}, ${dest.y}, ${dest.z})`);
        persistence.save(gameState$.getState());
    } else if (result.error === 'insufficient_power') {
        statusDisplay.setMessage('Insufficient Power');
    } else if (result.error === 'is_mining') {
        statusDisplay.setMessage('Cannot travel while mining');
    }
}

// ========================================
// POWER HELPER FUNCTIONS
// ========================================
function handleBuyPower(): void {
    const result = powerController.buyPower();

    if (result.success) {
        statusDisplay.setMessage('Power Recharged (+50)');
        persistence.save(gameState$.getState());
    } else if (result.error === 'insufficient_credits') {
        statusDisplay.setMessage('Insufficient Credits');
    } else if (result.error === 'power_full') {
        statusDisplay.setMessage('Power Cell Full');
    }
}

// ========================================
// TOOL HELPER FUNCTIONS
// ========================================
function handleBuyTool(toolId: string): void {
    const result = toolController.buyTool(toolId);
    if (result.success) {
        const tool = toolController.getToolData(toolId);
        statusDisplay.setMessage(`Purchased ${tool?.name ?? toolId}`);
        persistence.save(gameState$.getState());
    } else if (result.error === 'insufficient_credits') {
        statusDisplay.setMessage('Insufficient Credits');
    }
}

function handleEquipTool(toolId: string, slot: number): void {
    const result = toolController.equipTool(toolId, slot);
    if (result.success) {
        const tool = toolController.getToolData(toolId);
        statusDisplay.setMessage(`Equipped ${tool?.name ?? toolId}`);
        persistence.save(gameState$.getState());
    }
}

function handleUnequipTool(slot: number): void {
    toolController.unequipTool(slot);
    statusDisplay.setMessage('Tool Unequipped');
    persistence.save(gameState$.getState());
}

// ========================================
// ASTEROID ACTIONS
// ========================================
function abandonAsteroid(): void {
    const result = asteroidsController.abandon();

    if (result.success) {
        statusDisplay.setMessage('Asteroid Abandoned');
    }
}

function scanAsteroid(): void {
    const result = asteroidsController.scan();

    if (result.success) {
        statusDisplay.setMessage('Asteroid Locked');
        persistence.save(gameState$.getState());
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
            statusDisplay.setMessage('Mining in Progress...');
            break;

        case 'mining_progress':
            // Progress tracking removed - mining happens automatically
            break;

        case 'discovery':
            discoveryAlert.show(event.element);
            break;

        case 'mining_completed':
            statusDisplay.setMessage('Mining Complete');
            persistence.save(gameState$.getState());
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
function handleSellResources(marketKey: string): void {
    const result = market.sellAll(marketKey);
    if (result.success) {
        statusDisplay.setMessage(`Sold for ${formatNumber(result.totalValue)} credits`);
        persistence.save(gameState$.getState());
    }
}

function handleSellOfficial(): void {
    handleSellResources('official');
}

function handleSellBlack(): void {
    handleSellResources('black');
}

function handleSellDump(): void {
    handleSellResources('dump');
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
        new ToolPanel(gameState$, toolController, {
            onBuy: handleBuyTool,
            onEquip: handleEquipTool,
            onUnequip: handleUnequipTool
        }),

        // Control buttons
        new ControlButtons(gameState$, asteroidsController, {
            onScan: scanAsteroid,
            onMine: handleStartMining,
            onAbandon: abandonAsteroid
        }),

        // Navigation
        new NavigationPanel(gameState$, world, handleTravel)
    ];

    // Mount all components
    for (const component of allComponents) {
        component.mount();
        components.push(component);
    }

    // Attach sell button listeners (not part of component system)
    const btnSellOfficial = document.getElementById('btn-sell-official') as HTMLButtonElement;
    if (btnSellOfficial) {
        btnSellOfficial.addEventListener('click', handleSellOfficial);
    }

    const btnSellBlack = document.getElementById('btn-sell-black') as HTMLButtonElement;
    if (btnSellBlack) {
        btnSellBlack.addEventListener('click', handleSellBlack);
    }

    const btnSellDump = document.getElementById('btn-sell-dump') as HTMLButtonElement;
    if (btnSellDump) {
        btnSellDump.addEventListener('click', handleSellDump);
    }
}

// ========================================
// INITIALIZATION
// ========================================
function init(): void {
    // Generate static world (deterministic, used for navigation)
    world = new WorldGenerator().generate();

    // Load saved game and create observable state
    persistence = createPersistenceController();
    const initialState = persistence.load();
    gameState$ = new StateObserver(initialState);

    // Initialize controllers
    shipController = new ShipController(gameState$);
    powerController = new PowerController(gameState$, world);
    toolController = new ToolController(gameState$, shipController);
    miningController = new MiningController(gameState$, toolController);
    market = new Market(gameState$, {
        official: new OfficialMarketSystem(),
        black: new BlackMarketSystem(),
        dump: new DumpMarketSystem()
    });
    asteroidsController = new AsteroidsController(gameState$, undefined, world);

    // Subscribe to mining events
    miningController.subscribe(handleMiningEvent);

    // Initialize UI components
    initComponents();

    // Auto-save interval
    setInterval(() => persistence.save(gameState$.getState()), CONFIG.autoSaveInterval);

    console.log('Asteroid Miner initialized');
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', init);

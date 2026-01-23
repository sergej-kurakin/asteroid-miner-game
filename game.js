// ========================================
// CONFIGURATION
// ========================================
const CONFIG = {
    // Element data with prices
    elements: {
        Fe: { name: 'Iron', price: 50 },
        Ni: { name: 'Nickel', price: 150 },
        Co: { name: 'Cobalt', price: 200 },
        O: { name: 'Oxygen', price: 20 },
        Si: { name: 'Silicon', price: 40 },
        Mg: { name: 'Magnesium', price: 80 },
        S: { name: 'Sulfur', price: 60 },
        Cr: { name: 'Chromium', price: 180 },
        Mn: { name: 'Manganese', price: 120 }
    },

    // Iron-Nickel asteroid composition (percentages)
    ironNickelComposition: {
        Fe: { min: 88, max: 92 },
        Ni: { min: 5, max: 8 },
        Co: { min: 1, max: 2 }
    },

    // Mining settings
    miningTime: 2500, // ms
    yieldMin: 80,
    yieldMax: 120,
    holdCapacity: 100,

    // UI settings
    alertDuration: 3000, // ms
    autoSaveInterval: 30000 // ms
};

// ========================================
// GAME STATE
// ========================================
let gameState = {
    credits: 0,
    discovered_elements: [],
    inventory: {},
    hold_capacity: CONFIG.holdCapacity,
    hold_used: 0,
    asteroid: null,
    is_mining: false,
    mining_progress: 0,
    power: 100
};

// ========================================
// DOM CACHE
// ========================================
const DOM = {};

function cacheDOMElements() {
    DOM.powerValue = document.getElementById('power-value');
    DOM.powerFill = document.getElementById('power-fill');
    DOM.laserValue = document.getElementById('laser-value');
    DOM.laserFill = document.getElementById('laser-fill');
    DOM.holdValue = document.getElementById('hold-value');
    DOM.holdFill = document.getElementById('hold-fill');
    DOM.statusText = document.getElementById('status-text');
    DOM.btnScan = document.getElementById('btn-scan');
    DOM.btnMine = document.getElementById('btn-mine');
    DOM.asteroid = document.getElementById('asteroid');
    DOM.asteroidPlaceholder = document.getElementById('asteroid-placeholder');
    DOM.miningProgressContainer = document.getElementById('mining-progress-container');
    DOM.miningProgressFill = document.getElementById('mining-progress-fill');
    DOM.compositionGrid = document.getElementById('composition-grid');
    DOM.creditsValue = document.getElementById('credits-value');
    DOM.discoveryAlert = document.getElementById('discovery-alert');
    DOM.discoveryElement = document.getElementById('discovery-element');
    DOM.inventoryList = document.getElementById('inventory-list');
    DOM.btnSell = document.getElementById('btn-sell');
    DOM.btnAbandon = document.getElementById('btn-abandon');
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatNumber(num) {
    return num.toLocaleString();
}

// ========================================
// RENDERING FUNCTIONS
// ========================================
function renderGauges() {
    // Power gauge
    DOM.powerValue.textContent = `${Math.round(gameState.power)}%`;
    DOM.powerFill.style.width = `${gameState.power}%`;

    // Laser gauge (shows mining progress when active)
    if (gameState.is_mining) {
        DOM.laserValue.textContent = 'Active';
        DOM.laserFill.style.width = `${gameState.mining_progress * 100}%`;
    } else {
        DOM.laserValue.textContent = gameState.asteroid ? 'Ready' : 'Standby';
        DOM.laserFill.style.width = '0%';
    }

    // Hold gauge
    DOM.holdValue.textContent = `${gameState.hold_used} / ${gameState.hold_capacity}`;
    DOM.holdFill.style.width = `${(gameState.hold_used / gameState.hold_capacity) * 100}%`;
}

function renderCredits() {
    DOM.creditsValue.textContent = formatNumber(gameState.credits);
}

function renderInventory() {
    const elements = Object.keys(gameState.inventory).filter(el => gameState.inventory[el] > 0);

    if (elements.length === 0) {
        DOM.inventoryList.innerHTML = '<div class="inventory-empty">Hold is empty</div>';
        DOM.btnSell.disabled = true;
        return;
    }

    DOM.btnSell.disabled = false;

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

    DOM.inventoryList.innerHTML = html;
}

function renderComposition() {
    if (!gameState.asteroid) {
        DOM.compositionGrid.innerHTML = `
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

    DOM.compositionGrid.innerHTML = html;
}

function updateStatus(message) {
    DOM.statusText.textContent = message;
}

function updateButtonStates() {
    DOM.btnScan.disabled = gameState.is_mining || gameState.asteroid !== null;
    DOM.btnMine.disabled = gameState.is_mining || gameState.asteroid === null;
    DOM.btnAbandon.disabled = gameState.is_mining || gameState.asteroid === null;
}

// ========================================
// DISCOVERY SYSTEM
// ========================================
let discoveryTimeout = null;

function showDiscoveryAlert(element) {
    if (discoveryTimeout) {
        clearTimeout(discoveryTimeout);
    }

    DOM.discoveryElement.textContent = `${element} - ${CONFIG.elements[element].name}`;
    DOM.discoveryAlert.classList.add('visible');

    discoveryTimeout = setTimeout(() => {
        DOM.discoveryAlert.classList.remove('visible');
        discoveryTimeout = null;
    }, CONFIG.alertDuration);
}

function checkDiscovery(element) {
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
function abandonAsteroid() {
    if (gameState.is_mining || gameState.asteroid === null) return;

    // Clear asteroid
    gameState.asteroid = null;

    // Update UI
    DOM.asteroid.classList.remove('visible');
    DOM.asteroidPlaceholder.style.display = 'block';

    updateStatus('Asteroid Abandoned');
    renderComposition();
    updateButtonStates();
}

function scanAsteroid() {
    if (gameState.is_mining || gameState.asteroid !== null) return;

    // Generate Iron-Nickel asteroid
    const composition = {};
    let remainingPercent = 100;

    // Fe percentage
    const fePercent = randomInRange(
        CONFIG.ironNickelComposition.Fe.min,
        CONFIG.ironNickelComposition.Fe.max
    );
    composition.Fe = fePercent;
    remainingPercent -= fePercent;

    // Ni percentage
    const niPercent = randomInRange(
        CONFIG.ironNickelComposition.Ni.min,
        Math.min(CONFIG.ironNickelComposition.Ni.max, remainingPercent - 1)
    );
    composition.Ni = niPercent;
    remainingPercent -= niPercent;

    // Co gets the rest
    composition.Co = remainingPercent;

    // Total yield
    const totalYield = randomInRange(CONFIG.yieldMin, CONFIG.yieldMax);

    gameState.asteroid = {
        type: 'iron_nickel',
        size: 'small',
        composition,
        totalYield
    };

    // Update UI
    DOM.asteroid.classList.add('visible');
    DOM.asteroidPlaceholder.style.display = 'none';

    updateStatus('Asteroid Locked');
    renderComposition();
    updateButtonStates();
    saveGame();
}

let miningStartTime = null;
let miningAnimationId = null;

function startMining() {
    if (gameState.is_mining || !gameState.asteroid) return;

    gameState.is_mining = true;
    gameState.mining_progress = 0;
    miningStartTime = performance.now();

    DOM.asteroid.classList.add('mining');
    DOM.miningProgressContainer.classList.add('visible');

    updateStatus('Mining in Progress...');
    updateButtonStates();
    renderGauges();

    // Start animation loop
    miningAnimationId = requestAnimationFrame(updateMiningProgress);
}

function updateMiningProgress(currentTime) {
    if (!gameState.is_mining) return;

    const elapsed = currentTime - miningStartTime;
    gameState.mining_progress = Math.min(elapsed / CONFIG.miningTime, 1);

    DOM.miningProgressFill.style.width = `${gameState.mining_progress * 100}%`;
    renderGauges();

    if (gameState.mining_progress >= 1) {
        completeMining();
    } else {
        miningAnimationId = requestAnimationFrame(updateMiningProgress);
    }
}

function completeMining() {
    if (!gameState.asteroid) return;

    const asteroid = gameState.asteroid;

    // Calculate resources collected
    let totalCollected = 0;
    const collected = {};

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
    DOM.asteroid.classList.remove('visible', 'mining');
    DOM.asteroidPlaceholder.style.display = 'block';
    DOM.miningProgressContainer.classList.remove('visible');
    DOM.miningProgressFill.style.width = '0%';

    updateStatus('Mining Complete');
    renderGauges();
    renderInventory();
    renderComposition();
    updateButtonStates();
    saveGame();
}

function sellResources() {
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
        saveGame();
    }
}

// ========================================
// SAVE/LOAD
// ========================================
function saveGame() {
    const saveData = {
        credits: gameState.credits,
        discovered_elements: gameState.discovered_elements,
        inventory: gameState.inventory,
        hold_used: gameState.hold_used
    };

    try {
        localStorage.setItem('asteroidMiner', JSON.stringify(saveData));
    } catch (e) {
        console.error('Failed to save game:', e);
    }
}

function loadGame() {
    try {
        const saveData = localStorage.getItem('asteroidMiner');
        if (saveData) {
            const data = JSON.parse(saveData);
            gameState.credits = data.credits || 0;
            gameState.discovered_elements = data.discovered_elements || [];
            gameState.inventory = data.inventory || {};
            gameState.hold_used = data.hold_used || 0;
            return true;
        }
    } catch (e) {
        console.error('Failed to load game:', e);
    }
    return false;
}

// ========================================
// INITIALIZATION
// ========================================
function init() {
    cacheDOMElements();

    // Load saved game
    loadGame();

    // Attach event listeners
    DOM.btnScan.addEventListener('click', scanAsteroid);
    DOM.btnMine.addEventListener('click', startMining);
    DOM.btnAbandon.addEventListener('click', abandonAsteroid);
    DOM.btnSell.addEventListener('click', sellResources);

    // Initial render
    renderGauges();
    renderCredits();
    renderInventory();
    renderComposition();
    updateButtonStates();

    // Auto-save interval
    setInterval(saveGame, CONFIG.autoSaveInterval);

    console.log('Asteroid Miner initialized');
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', init);

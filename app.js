// app.js
const tg = window.Telegram.WebApp;
tg.expand();

const PLANTS = {
    lettuce: { name: "Салат Латук", water: 10, energy: 15, time: 900000, food: 15 },
    tomato: { name: "Томаты", water: 15, energy: 20, time: 1200000, food: 25 },
    potato: { name: "Картофель", water: 20, energy: 25, time: 1800000, food: 40 }
};

let gameState = {
    stamina: 100,
    food: 100,
    water: 100,
    trash: 0,
    ice: 0,
    regolith: 0,
    crystals: 10,
    solarPanels: 0,
    currentGrowing: null,
    lastTick: Date.now(),
    scavCooldown: false
};

function init() {
    loadGame();
    setInterval(gameTick, 1000);
    setInterval(consumeResources, 3600000);
    updateUI();
}

function gameTick() {
    const now = Date.now();
    const delta = (now - gameState.lastTick) / 1000;
    
    if(gameState.stamina < 100) {
        gameState.stamina = Math.min(100, gameState.stamina + gameState.solarPanels * 0.1 * delta);
    }
    
    gameState.lastTick = now;
    updateUI();
}

function consumeResources() {
    gameState.food = Math.max(0, gameState.food - 0.5);
    gameState.water = Math.max(0, gameState.water - 0.5);
    saveGame();
    updateUI();
}

function scavenge() {
    if(gameState.stamina < 1 || gameState.scavCooldown) {
        showNotification(gameState.scavCooldown ? 'Подождите 30 секунд!' : 'Недостаточно стамины!', '#ff4444');
        return;
    }
    
    gameState.stamina = Math.max(0, gameState.stamina - 1);
    gameState.scavCooldown = true;
    
    setTimeout(() => {
        gameState.scavCooldown = false;
        updateUI();
    }, 30000);

    if(Math.random() < 0.25) {
        const resources = ['trash', 'ice', 'regolith'];
        const resource = resources[Math.floor(Math.random() * 3)];
        const amount = Math.floor(Math.random() * 4) + 1;
        gameState[resource] += amount;
        showNotification(`Найдено: ${getResourceEmoji(resource)} ${amount} ед!`, '#4CAF50');
    } else {
        showNotification('Поиск не дал результатов', '#ff4444');
    }
    
    saveGame();
    updateUI();
}

function rest() {
    if(gameState.food >= 10 && gameState.water >= 10) {
        gameState.stamina = Math.min(100, gameState.stamina + 20);
        gameState.food -= 10;
        gameState.water -= 10;
        showNotification('Отдых завершён!', '#2196F3');
        saveGame();
        updateUI();
    } else {
        showNotification('Недостаточно еды или воды!', '#ff4444');
    }
}

function buySolarPanel() {
    if(gameState.crystals >= 5) {
        gameState.crystals -= 5;
        gameState.solarPanels++;
        showNotification('Солнечная панель установлена!', '#FFC107');
        saveGame();
        updateUI();
    } else {
        showNotification('Недостаточно кристаллов!', '#ff4444');
    }
}

function chargeBatteries() {
    if(gameState.solarPanels > 0) {
        const chargeAmount = 20 * gameState.solarPanels;
        gameState.stamina = Math.min(100, gameState.stamina + chargeAmount);
        showNotification(`⚡ +${chargeAmount} стамины`, '#4CAF50');
        saveGame();
        updateUI();
    }
}

function startGrowing() {
    if(gameState.currentGrowing) {
        showNotification('Уже идет выращивание!', '#ff4444');
        return;
    }
    
    const plantType = document.getElementById('plantSelect').value;
    const plant = PLANTS[plantType];
    
    if(gameState.water >= plant.water && gameState.stamina >= plant.energy) {
        gameState.water -= plant.water;
        gameState.stamina -= plant.energy;
        gameState.currentGrowing = {
            plant: plantType,
            endTime: Date.now() + plant.time
        };
        
        const timer = setInterval(() => {
            const remaining = gameState.currentGrowing.endTime - Date.now();
            if(remaining <= 0) {
                clearInterval(timer);
                gameState.food += plant.food;
                gameState.currentGrowing = null;
                showNotification(`Урожай ${plant.name} готов! +${plant.food} еды`, '#4CAF50');
                document.getElementById('growingProgress').textContent = '';
                saveGame();
                updateUI();
            } else {
                const progress = Math.round((1 - remaining/plant.time)*100);
                document.getElementById('growingProgress').textContent = `Прогресс: ${progress}%`;
            }
        }, 1000);
        
        showNotification(`Начато выращивание ${plant.name}`, '#4CAF50');
        saveGame();
        updateUI();
    } else {
        showNotification('Недостаточно ресурсов!', '#ff4444');
    }
}

function saveGame() {
    localStorage.setItem('marsColony', JSON.stringify(gameState));
}

function loadGame() {
    const saved = localStorage.getItem('marsColony');
    if(saved) gameState = JSON.parse(saved);
    updateUI();
}

function updateUI() {
    document.getElementById('stamina').textContent = Math.floor(gameState.stamina);
    document.getElementById('food').textContent = gameState.food.toFixed(1);
    document.getElementById('water').textContent = gameState.water.toFixed(1);
    document.getElementById('trash').textContent = gameState.trash;
    document.getElementById('ice').textContent = gameState.ice;
    document.getElementById('regolith').textContent = gameState.regolith;
    document.getElementById('crystals').textContent = gameState.crystals;
    document.getElementById('panelsCount').textContent = `(${gameState.solarPanels})`;
    document.getElementById('scavButton').disabled = gameState.scavCooldown || gameState.stamina < 1;
}

function getResourceEmoji(resource) {
    const emojis = {
        trash: '🗑️',
        ice: '🧊',
        regolith: '🌑'
    };
    return emojis[resource] || '';
}

function showNotification(text, color = '#fff') {
    const el = document.getElementById('notifications');
    el.textContent = text;
    el.style.color = color;
    setTimeout(() => el.textContent = '', 3000);
}

// Запуск игры
init();

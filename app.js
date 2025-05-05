let gameState = {
    stamina: 100,
    food: 100,
    water: 100,
    trash: 0,
    ice: 0,
    regolith: 0,
    lastTick: Date.now(),
    scavCooldown: false
};

function init() {
    loadGame();
    setInterval(gameTick, 60000); // Обновление каждую минуту
    setInterval(consumeResources, 300000); // Расход каждые 5 минут
    updateUI();
}

function gameTick() {
    const now = Date.now();
    const deltaMinutes = (now - gameState.lastTick) / 60000;
    
    // Регенерация стамины: 1 ед/5 минут
    gameState.stamina = Math.min(100, gameState.stamina + deltaMinutes / 5);
    
    gameState.lastTick = now;
    updateUI();
    saveGame();
}

function consumeResources() {
    gameState.food = Math.max(0, gameState.food - 0.5);
    gameState.water = Math.max(0, gameState.water - 0.5);
    updateUI();
    saveGame();
}

function scavenge() {
    if(gameState.stamina < 3 || gameState.scavCooldown) {
        showNotification(gameState.scavCooldown ? 'Подождите 30 секунд!' : 'Недостаточно стамины!', '#ff4444');
        return;
    }
    
    gameState.stamina = Math.max(0, gameState.stamina - 3);
    gameState.scavCooldown = true;
    
    setTimeout(() => {
        gameState.scavCooldown = false;
        updateUI();
    }, 30000);

    if(Math.random() < 0.35) {
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
    document.getElementById('scavButton').disabled = gameState.scavCooldown || gameState.stamina < 3;
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

// Инициализация состояния игры
let gameState = JSON.parse(localStorage.getItem('gameState')) || {
    stamina: 100,
    food: 100,
    water: 100,
    scrapMetal: 0,
    energy: 0,
    solarPanels: 0,
    lastUpdate: Date.now()
};

// Присваивание переменных
let { stamina, food, water, scrapMetal, energy, solarPanels, lastUpdate } = gameState;

// Константы
const maxStamina = 100;
const staminaPerSecond = 0.00333; // 1 единица за 5 минут
const foodWaterPerSecond = 0.00167; // 0.5 единицы за 5 минут
const energyPerPanelPerSecond = 0.01; // Энергия от одной панели в секунду

// Кэширование DOM-элементов
const DOM = {
    stamina: document.getElementById('stamina'),
    food: document.getElementById('food'),
    water: document.getElementById('water'),
    scrapMetal: document.getElementById('scrapMetal'),
    energy: document.getElementById('energy'),
    solarPanels: document.getElementById('solarPanels'),
    message: document.getElementById('message')
};

// Обновление интерфейса
function updateDisplay() {
    DOM.stamina.innerText = stamina.toFixed(1);
    DOM.food.innerText = food.toFixed(1);
    DOM.water.innerText = water.toFixed(1);
    DOM.scrapMetal.innerText = scrapMetal.toFixed(1);
    DOM.energy.innerText = energy.toFixed(1);
    DOM.solarPanels.innerText = solarPanels;
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

// Обновление состояния игры
function updateGame() {
    const now = Date.now();
    const secondsPassed = (now - lastUpdate) / 1000;
    if (secondsPassed <= 0) return;

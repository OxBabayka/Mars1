const tg = window.Telegram.WebApp;
tg.ready();

const user = tg.initDataUnsafe.user;
const username = user ? user.username : 'колонист';
document.querySelector('h1').innerText = `Добро пожаловать на Марс, ${username}!`;

// Инициализация данных
let energy = localStorage.getItem('energy') ? parseInt(localStorage.getItem('energy')) : 1600;
let water = localStorage.getItem('water') ? parseInt(localStorage.getItem('water')) : 0;
let oxygen = localStorage.getItem('oxygen') ? parseInt(localStorage.getItem('oxygen')) : 0;
let metal = localStorage.getItem('metal') ? parseInt(localStorage.getItem('metal')) : 0;
let coffee = localStorage.getItem('coffee') ? parseInt(localStorage.getItem('coffee')) : 0;
let buildings = localStorage.getItem('buildings') ? JSON.parse(localStorage.getItem('buildings')) : {
    residential: 0,
    mine: 0,
    solar: 0
};
let crop = localStorage.getItem('crop') ? JSON.parse(localStorage.getItem('crop')) : null;
let tech = localStorage.getItem('tech') ? JSON.parse(localStorage.getItem('tech')) : {
    greenhouse: 0,
    mine: 0
};
let coffeeBonus = localStorage.getItem('coffeeBonus') ? parseInt(localStorage.getItem('coffeeBonus')) : 0;
let lastUpdate = localStorage.getItem('lastUpdate') ? parseInt(localStorage.getItem('lastUpdate')) : Date.now();
const maxEnergy = 1600;

// Восстановление энергии: 900 единиц за 24 часа
const baseEnergyPerSecond = 900 / (24 * 60 * 60); // 0.0104167 энергии в секунду

// Показ панелей
function showPanel(panelId) {
    document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(panelId).classList.add('active');
    document.querySelector(`.tab[onclick="showPanel('${panelId}')"]`).classList.add('active');
}

// Обновление отображения
function updateDisplay() {
    document.getElementById('energy').innerText = `Энергия: ${Math.floor(energy)}`;
    document.getElementById('water').innerText = `Вода: ${water}`;
    document.getElementById('oxygen').innerText = `Кислород: ${oxygen}`;
    document.getElementById('metal').innerText = `Металл: ${metal}`;
    document.getElementById('coffee').innerText = `Кофе: ${coffee}`;
    document.getElementById('buildingCount').innerText = `Здания: Жилых: ${buildings.residential}, Шахт: ${buildings.mine}, Панелей: ${buildings.solar}`;
    document.getElementById('mineProduction').innerText = `Производство металла: ${(buildings.mine * (1 + tech.mine * 0.5)).toFixed(1)}/мин`;
    document.getElementById('solarProduction').innerText = `Производство энергии: ${(buildings.solar * 5 * (1 + tech.mine * 0.2)).toFixed(1)}/мин`;
    document.getElementById('cropStatus').innerText = crop ? `Теплица: ${crop.name} (готово через ${Math.ceil(crop.timeLeft)} сек)` : 'Теплица: нет активных культур';
    document.getElementById('techStatus').innerText = `Улучшения: Теплица: ${tech.greenhouse}, Шахта: ${tech.mine}`;
    document.getElementById('coffeeBonus').innerText = coffeeBonus > 0 ? `Бонус от кофе: +${(coffeeBonus * 100).toFixed(0)}% к восстановлению энергии` : 'Бонус от кофе: нет';
    
    // Проверка кислорода
    const oxygenConsumption = buildings.residential * 2; // Каждый жилой модуль потребляет 2 кислорода в минуту
    document.getElementById('oxygenStatus').innerText = oxygen >= oxygenConsumption ? 'Кислород: стабильно' : 'Кислород: дефицит!';
    
    localStorage.setItem('energy', Math.floor(energy));
    localStorage.setItem('water', water);
    localStorage.setItem('oxygen', oxygen);
    localStorage.setItem('metal', metal);
    localStorage.setItem('coffee', coffee);
    localStorage.setItem('buildings', JSON.stringify(buildings));
    localStorage.setItem('crop', JSON.stringify(crop));
    localStorage.setItem('tech', JSON.stringify(tech));
    localStorage.setItem('coffeeBonus', coffeeBonus);
    localStorage.setItem('lastUpdate', Date.now());
}

// Обновление игры
function updateGame() {
    const now = Date.now();
    const secondsPassed = (now - lastUpdate) / 1000;
    
    // Восстановление энергии
    const energyPerSecond = baseEnergyPerSecond * (1 + coffeeBonus);
    energy += secondsPassed * energyPerSecond;
    if (energy > maxEnergy) energy = maxEnergy;
    
    // Производство ресурсов
    const mineProduction = buildings.mine * (1 + tech.mine * 0.5) / 60; // Металл в секунду
    const solarProduction = buildings.solar * 5 * (1 + tech.mine * 0.2) / 60; // Энергия в секунду
    metal += mineProduction * secondsPassed;
    energy += solarProduction * secondsPassed;
    
    // Потребление кислорода
    const oxygenConsumption = buildings.residential * 2 / 60; // Кислород в секунду
    oxygen -= oxygenConsumption * secondsPassed;
    if (oxygen < 0) oxygen = 0;
    
    // Обновление теплицы
    if (crop) {
        crop.timeLeft -= secondsPassed;
        if (crop.timeLeft <= 0) {
            water += crop.waterReward || 0;
            oxygen += crop.oxygenReward || 0;
            coffee += crop.coffeeReward || 0;
            document.getElementById('message').innerText = `${crop.name} созрел! Получено: ${crop.waterReward || 0} воды, ${crop.oxygenReward || 0} кислорода, ${crop.coffeeReward || 0} кофе`;
            crop = null;
        }
    }
    
    // Уменьшение бонуса от кофе
    if (coffeeBonus > 0) {
        coffeeBonus -= secondsPassed / 3600; // Бонус длится 1 час
        if (coffeeBonus < 0) coffeeBonus = 0;
    }
    
    lastUpdate = now;
    updateDisplay();
}

// Строительство зданий
function buildBuilding(type) {
    const buildingCosts = {
        residential: { energy: 200, metal: 50 },
        mine: { energy: 150, metal: 30 },
        solar: { energy: 100, metal: 20 }
    };
    const cost = buildingCosts[type];
    
    if (energy >= cost.energy && metal >= cost.metal) {
        energy -= cost.energy;
        metal -= cost.metal;
        buildings[type]++;
        document.getElementById('message').innerText = `Построен ${type === 'residential' ? 'жилой модуль' : type === 'mine' ? 'шахта' : 'солнечная панель'}!`;
        updateDisplay();
    } else {
        document.getElementById('message').innerText = 'Недостаточно ресурсов!';
    }
}

// Посадка культур
function plantCrop(type) {
    if (crop) {
        document.getElementById('message').innerText = 'Теплица занята!';
        return;
    }
    
    const crops = {
        potato: { energy: 50, water: 10, time: 60, waterReward: 20, oxygenReward: 10, name: 'Картофель' },
        lettuce: { energy: 30, water: 5, time: 30, waterReward: 10, oxygenReward: 5, name: 'Салат' },
        wheat: { energy: 70, water: 15, time: 90, waterReward: 30, oxygenReward: 15, name: 'Пшеница' },
        coffee: { energy: 60, water: 12, time: 120, coffeeReward: 10, name: 'Кофе' }
    };
    const cropData = crops[type];
    
    if (energy >= cropData.energy && water >= cropData.water) {
        energy -= cropData.energy;
        water -= cropData.water;
        crop = {
            name: cropData.name,
            timeLeft: cropData.time * (1 - tech.greenhouse * 0.2), // Улучшение теплицы сокращает время
            waterReward: cropData.waterReward,
            oxygenReward: cropData.oxygenReward,
            coffeeReward: cropData.coffeeReward
        };
        document.getElementById('message').innerText = `${cropData.name} посажен!`;
        updateDisplay();
    } else {
        document.getElementById('message').innerText = 'Недостаточно ресурсов!';
    }
}

// Варка кофе
function brewCoffee() {
    if (buildings.residential === 0) {
        document.getElementById('message').innerText = 'Нужен жилой модуль!';
        return;
    }
    if (coffee >= 5 && water >= 10) {
        coffee -= 5;
        water -= 10;
        coffeeBonus = 0.5; // +50% к восстановлению энергии на 1 час
        document.getElementById('message').innerText = 'Кофе сварен! Восстановление энергии ускорено на 1 час!';
        updateDisplay();
    } else {
        document.getElementById('message').innerText = 'Недостаточно кофе или воды!';
    }
}

// Исследование технологий
function researchTech(type) {
    const techCosts = {
        greenhouse: { metal: 100, water: 50 },
        mine: { metal: 150, energy: 50 }
    };
    const cost = techCosts[type];
    
    if ((type === 'greenhouse' && metal >= cost.metal && water >= cost.water) ||
        (type === 'mine' && metal >= cost.metal && energy >= cost.energy)) {
        if (type === 'greenhouse') {
            metal -= cost.metal;
            water -= cost.water;
        } else {
            metal -= cost.metal;
            energy -= cost.energy;
        }
        tech[type]++;
        document.getElementById('message').innerText = `Технология "${type === 'greenhouse' ? 'Теплица' : 'Шахта'}" улучшена!`;
        updateDisplay();
    } else {
        document.getElementById('message').innerText = 'Недостаточно ресурсов!';
    }
}

// Автоматическое обновление
setInterval(updateGame, 1000);

// Инициализация
updateGame();
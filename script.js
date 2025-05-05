const tg = window.Telegram.WebApp;
tg.ready();

const user = tg.initDataUnsafe.user;
const userId = user ? user.id : 'test_user';
const username = user ? user.username || 'колонист' : 'колонист';
document.querySelector('h1').innerText = `Mars Reborn, ${username}!`;

// Кэширование DOM-элементов
const DOM = {
    capacitor: document.getElementById('capacitor'),
    chargedBatteries: document.getElementById('chargedBatteries'),
    dischargedBatteries: document.getElementById('dischargedBatteries'),
    stamina: document.getElementById('stamina'),
    water: document.getElementById('water'),
    food: document.getElementById('food'),
    coffeeCups: document.getElementById('coffeeCups'),
    ice: document.getElementById('ice'),
    regolith: document.getElementById('regolith'),
    trash: document.getElementById('trash'),
    scrapMetal: document.getElementById('scrapMetal'),
    metal: document.getElementById('metal'),
    soil: document.getElementById('soil'),
    co2: document.getElementById('co2'),
    o2: document.getElementById('o2'),
    h2: document.getElementById('h2'),
    coffeeBeans: document.getElementById('coffeeBeans'),
    chargingStatus: document.getElementById('chargingStatus'),
    cropStatus: document.getElementById('cropStatus'),
    cropInventory: document.getElementById('cropInventory'),
    progressBar: document.getElementById('progressBar'),
    progress: document.getElementById('progress'),
    message: document.getElementById('message'),
    referralLink: document.getElementById('referralLink'),
    normalTimer: document.getElementById('normalTimer'),
    advancedTimer: document.getElementById('advancedTimer')
};

// Инициализация данных
let gameState = JSON.parse(localStorage.getItem('gameState')) || {
    capacitor: 100,
    chargedBatteries: 5,
    dischargedBatteries: 0,
    chargingBatteries: [],
    solarPanels: 0,
    stamina: 100,
    water: 100,
    food: 100,
    coffeeCups: 0,
    ice: 0,
    regolith: 0,
    trash: 0,
    scrapMetal: 0,
    metal: 0,
    soil: 0,
    co2: 0,
    o2: 0,
    h2: 0,
    coffeeBeans: 0,
    chemLabs: 0,
    cads: 0,
    lastCollectionNormal: 0,
    lastCollectionAdvanced: 0,
    crop: null,
    lastUpdate: Date.now(),
    referrals: []
};

// Присваивание переменных
let { capacitor, chargedBatteries, dischargedBatteries, chargingBatteries, solarPanels, stamina, water, food, coffeeCups, ice, regolith, trash, scrapMetal, metal, soil, co2, o2, h2, coffeeBeans, chemLabs, cads, lastCollectionNormal, lastCollectionAdvanced, crop, lastUpdate, referrals } = gameState;

const maxCapacitor = 100;
const maxStamina = 100;
const staminaPerSecond = 0.00333;
const foodWaterPerSecond = 0.00167;
const batteryChargeTime = 21600;
const botUsername = '@MarsRebornBot';

// Конфигурация культур
const CROP_CONFIG = {
    lettuce: { name: 'Салат латук', time: 900, soil: 5, water: 10, stamina: 5, energy: 5, food: 10 },
    potato: { name: 'Картофель', time: 1200, soil: 6, water: 12, stamina: 6, energy: 6, food: 12 },
    carrot: { name: 'Морковь', time: 1500, soil: 7, water: 14, stamina: 7, energy: 7, food: 14 },
    sunflower: { name: 'Подсолнечник', time: 300, soil: 4, water: 15, stamina: 4, energy: 4, food: 8 },
    rice: { name: 'Рис', time: 1800, soil: 8, water: 16, stamina: 8, energy: 8, food: 16 }
};

// Конфигурация действий
const ACTION_CONFIG = {
    cookFood: {
        resources: { coffeeBeans: 1 },
        stamina: 5,
        energy: 2,
        callback: () => { food += 5; DOM.message.innerText = 'Еда приготовлена!'; },
        animation: 'flash'
    },
    brewCoffee: {
        resources: { coffeeBeans: 5 },
        stamina: 5,
        energy: 3,
        callback: () => { coffeeCups += 1; DOM.message.innerText = 'Кофе сварен!'; },
        animation: 'particles'
    },
    drinkCoffee: {
        resources: { coffeeCups: 1 },
        stamina: 0,
        energy: 0,
        callback: () => { stamina = Math.min(maxStamina, stamina + 10); DOM.message.innerText = 'Стамина восстановлена!'; },
        animation: 'flash'
    },
    collectNormal: {
        resources: {},
        stamina: 3,
        energy: 1,
        cooldown: 30000,
        callback: () => {
            const items = [];
            if (Math.random() < 0.5) { ice += 1; items.push('лёд'); }
            if (Math.random() < 0.5) { regolith += 1; items.push('реголит'); }
            if (Math.random() < 0.5) { trash += 1; items.push('мусор'); }
            if (Math.random() < 0.15) { scrapMetal += 1; items.push('металлолом'); }
            DOM.message.innerText = items.length > 0 ? `Вы собрали: ${items.join(', ')}` : 'Ничего не найдено!';
            lastCollectionNormal = Date.now();
        },
        animation: 'particles'
    },
    collectAdvanced: {
        resources: {},
        stamina: 10,
        energy: 2,
        cooldown: 60000,
        callback: () => {
            const items = [];
            if (Math.random() < 0.7) { ice += 1; items.push('лёд'); }
            if (Math.random() < 0.7) { regolith += 1; items.push('реголит'); }
            if (Math.random() < 0.7) { trash += 1; items.push('мусор'); }
            if (Math.random() < 0.35) { scrapMetal += 1; items.push('металлолом'); }
            DOM.message.innerText = items.length > 0 ? `Вы собрали: ${items.join(', ')}` : 'Ничего не найдено!';
            lastCollectionAdvanced = Date.now();
        },
        animation: 'particles'
    },
    buildSolarPanel: {
        resources: { scrapMetal: 10 },
        stamina: 10,
        energy: 10,
        callback: () => { solarPanels += 1; DOM.message.innerText = 'Солнечная панель построена!'; },
        animation: 'particles'
    },
    buildChemLab: {
        resources: { scrapMetal: 20 },
        stamina: 10,
        energy: 15,
        callback: () => { chemLabs += 1; DOM.message.innerText = 'Хим Лаб построена!'; },
        animation: 'particles'
    },
    purifyIce: {
        resources: { ice: 1 },
        stamina: 5,
        energy: 3,
        condition: () => chemLabs >= 1,
        callback: () => { water += 1; DOM.message.innerText = 'Лёд очищен в воду!'; },
        animation: 'flash'
    },
    processTrash: {
        resources: { trash: 1 },
        stamina: 5,
        energy: 3,
        condition: () => chemLabs >= 1,
        callback: () => { scrapMetal += 0.5; DOM.message.innerText = 'Мусор переработан в металлолом!'; },
        animation: 'flash'
    },
    produceMetal: {
        resources: { scrapMetal: 1, co2: 0.1, o2: 0.1 },
        stamina: 5,
        energy: 5,
        condition: () => chemLabs >= 1,
        callback: () => { metal += 0.5; DOM.message.innerText = 'Металл произведён!'; },
        animation: 'particles'
    },
    buildCAD: {
        resources: { scrapMetal: 15 },
        stamina: 10,
        energy: 12,
        callback: () => { cads += 1; DOM.message.innerText = 'C.A.D+ построен!'; },
        animation: 'particles'
    },
    produceSoil: {
        resources: { regolith: 1 },
        stamina: 5,
        energy: 4,
        condition: () => cads >= 1,
        callback: () => { soil += 0.5; DOM.message.innerText = 'Почва произведена!'; },
        animation: 'flash'
    },
    extractGases: {
        resources: { regolith: 1 },
        stamina: 5,
        energy: 4,
        condition: () => cads >= 1,
        callback: () => { co2 += 0.2; o2 += 0.2; h2 += 0.1; DOM.message.innerText = 'Газы добыты!'; },
        animation: 'flash'
    }
};

// Функция переключения панелей
function showPanel(panelId) {
    document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(panelId).classList.add('active');
    document.querySelector(`.tab[onclick="showPanel('${panelId}')"]`).classList.add('active');
    if (panelId !== 'referral') document.getElementById('referral').classList.remove('active');
}

// Функция сохранения состояния
function saveState() {
    gameState = { capacitor, chargedBatteries, dischargedBatteries, chargingBatteries, solarPanels, stamina, water, food, coffeeCups, ice, regolith, trash, scrapMetal, metal, soil, co2, o2, h2, coffeeBeans, chemLabs, cads, lastCollectionNormal, lastCollectionAdvanced, crop, lastUpdate, referrals };
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

// Функция анимации для кнопок
function animateAction(button, type = 'flash') {
    const effect = document.createElement('div');
    effect.className = 'action-effect';
    button.appendChild(effect);
    setTimeout(() => effect.remove(), 500);

    if (type === 'particles') {
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.setProperty('--x', Math.random() * 2 - 1);
            particle.style.setProperty('--y', Math.random() * 2 - 1);
            button.appendChild(particle);
            setTimeout(() => particle.remove(), 700);
        }
    }

    anime({
        targets: button,
        scale: [1, 1.1, 1],
        duration: 300,
        easing: 'easeInOutQuad'
    });
}

// Функция обновления интерфейса
function updateDisplay() {
    DOM.capacitor.innerText = `${capacitor.toFixed(1)} кВт/ч`;
    DOM.chargedBatteries.innerText = chargedBatteries;
    DOM.dischargedBatteries.innerText = dischargedBatteries;
    DOM.stamina.innerText = stamina.toFixed(1);
    DOM.water.innerText = water.toFixed(1);
    DOM.food.innerText = food.toFixed(1);
    DOM.coffeeCups.innerText = coffeeCups;
    DOM.ice.innerText = ice;
    DOM.regolith.innerText = regolith;
    DOM.trash.innerText = trash;
    DOM.scrapMetal.innerText = scrapMetal.toFixed(1);
    DOM.metal.innerText = metal.toFixed(1);
    DOM.soil.innerText = soil.toFixed(1);
    DOM.co2.innerText = co2.toFixed(1);
    DOM.o2.innerText = o2.toFixed(1);
    DOM.h2.innerText = h2.toFixed(1);
    DOM.coffeeBeans.innerText = coffeeBeans;
    DOM.chargingStatus.innerText = `Заряжающиеся батареи: ${chargingBatteries.length}`;
    DOM.cropInventory.innerText = `Собрано: Кофейные зёрна: ${coffeeBeans}`;
    if (crop) {
        const totalTime = CROP_CONFIG[crop.type].time;
        const progress = (totalTime - crop.timeLeft) / totalTime * 100;
        DOM.cropStatus.innerText = `Теплица: ${CROP_CONFIG[crop.type].name} (${progress.toFixed(0)}%)`;
        DOM.progressBar.style.display = 'block';
        DOM.progress.style.width = `${progress}%`;
    } else {
        DOM.cropStatus.innerText = 'Теплица: нет активных культур';
        DOM.progressBar.style.display = 'none';
    }
    saveState();
}

// Функция обновления таймеров
function updateTimers() {
    const now = Date.now();
    const normalTimeLeft = Math.max(0, 30000 - (now - lastCollectionNormal)) / 1000;
    const advancedTimeLeft = Math.max(0, 60000 - (now - lastCollectionAdvanced)) / 1000;
    DOM.normalTimer.innerText = normalTimeLeft > 0 ? `Осталось: ${normalTimeLeft.toFixed(0)} сек` : 'Готово';
    DOM.advancedTimer.innerText = advancedTimeLeft > 0 ? `Осталось: ${advancedTimeLeft.toFixed(0)} сек` : 'Готово';
}

// Функция обновления батарей
function updateBatteries(secondsPassed) {
    const now = Date.now();
    chargingBatteries = chargingBatteries.filter(battery => {
        const timePassed = (now - battery.startTime) / 1000;
        if (timePassed >= batteryChargeTime) {
            chargedBatteries += 1;
            return false;
        }
        return true;
    });
}

// Функция игрового цикла
function updateGame() {
    const now = Date.now();
    const secondsPassed = Math.min((now - lastUpdate) / 1000, 60);
    if (secondsPassed <= 0) return;

    let staminaRate = staminaPerSecond;
    if (food === 0 || water === 0) staminaRate = 0;
    else if (food < 30 || water < 30) staminaRate *= 0.5;
    stamina = Math.min(maxStamina, stamina + staminaRate * secondsPassed);

    food = Math.max(0, food - foodWaterPerSecond * secondsPassed);
    water = Math.max(0, water - foodWaterPerSecond * secondsPassed);

    if (crop) {
        crop.timeLeft -= secondsPassed;
        if (crop.timeLeft <= 0) {
            food += CROP_CONFIG[crop.type].food;
            DOM.message.innerText = `${CROP_CONFIG[crop.type].name} собран! +${CROP_CONFIG[crop.type].food} еды`;
            crop = null;
        }
    }

    updateBatteries(secondsPassed);

    lastUpdate = now;
    updateDisplay();
    updateTimers();
}

// Функция проверки ресурсов
function checkResources(requirements) {
    for (const [resource, amount] of Object.entries(requirements)) {
        if (gameState[resource] < amount) {
            DOM.message.innerText = `Недостаточно ${resource}!`;
            return false;
        }
    }
    return true;
}

// Функция проверки стамины
function checkStamina(amount) {
    if (stamina >= amount) return true;
    DOM.message.innerText = 'Недостаточно стамины!';
    return false;
}

// Функция проверки энергии
function checkEnergy(amount) {
    if (capacitor >= amount) return true;
    DOM.message.innerText = 'Недостаточно энергии в капаситоре!';
    return false;
}

// Функция выполнения действия
function performAction(actionKey) {
    const config = ACTION_CONFIG[actionKey];
    const button = event.target;
    if (config.condition && !config.condition()) {
        DOM.message.innerText = `Требуется ${actionKey.includes('Chem') || actionKey === 'produceMetal' ? 'Хим Лаб' : 'C.A.D+'}!`;
        return;
    }
    if (config.cooldown && Date.now() - (actionKey === 'collectNormal' ? lastCollectionNormal : lastCollectionAdvanced) < config.cooldown) {
        DOM.message.innerText = `Сбор возможен раз в ${config.cooldown / 1000} сек!`;
        return;
    }
    if (checkResources(config.resources) && checkStamina(config.stamina) && checkEnergy(config.energy)) {
        for (const [resource, amount] of Object.entries(config.resources)) {
            gameState[resource] -= amount;
        }
        stamina -= config.stamina;
        capacitor -= config.energy;
        config.callback();
        animateAction(button, config.animation);
        updateDisplay();
    }
}

// Функция посадки культуры
function plantCrop(type) {
    if (crop) {
        DOM.message.innerText = 'Теплица занята!';
        return;
    }
    const config = CROP_CONFIG[type];
    const button = event.target;
    if (checkResources({ soil: config.soil, water: config.water }) && checkStamina(config.stamina) && checkEnergy(config.energy)) {
        soil -= config.soil;
        water -= config.water;
        stamina -= config.stamina;
        capacitor -= config.energy;
        crop = { type, timeLeft: config.time };
        DOM.message.innerText = `${config.name} посажен!`;
        animateAction(button, 'particles');
        updateDisplay();
    } else {
        DOM.message.innerText = 'Недостаточно ресурсов!';
    }
}

// Функция зарядки батареи
function chargeBattery() {
    const button = event.target;
    if (dischargedBatteries < 1) {
        DOM.message.innerText = 'Нет разряженных батарей!';
        return;
    }
    const totalSlots = solarPanels * 3;
    if (chargingBatteries.length >= totalSlots) {
        DOM.message.innerText = 'Все слоты для зарядки заняты!';
        return;
    }
    dischargedBatteries -= 1;
    chargingBatteries.push({ startTime: Date.now(), panelId: solarPanels });
    DOM.message.innerText = 'Батарея поставлена на зарядку!';
    animateAction(button, 'flash');
    updateDisplay();
}

// Функция использования батареи
function useBattery() {
    const button = event.target;
    if (chargedBatteries < 1) {
        DOM.message.innerText = 'Нет заряженных батарей!';
        return;
    }
    if (capacitor >= maxCapacitor) {
        DOM.message.innerText = 'Капаситор полон!';
        return;
    }
    chargedBatteries -= 1;
    dischargedBatteries += 1;
    capacitor = Math.min(maxCapacitor, capacitor + 20);
    DOM.message.innerText = 'Капаситор заряжен на 20 кВт/ч!';
    animateAction(button, 'flash');
    updateDisplay();
}

// Функция генерации реферальной ссылки
function generateReferralLink() {
    const referralLink = `https://t.me/${botUsername}?start=${userId}`;
    DOM.referralLink.innerText = `Ваша реферальная ссылка: ${referralLink}`;
    tg.showPopup({
        title: 'Реферальная ссылка',
        message: `Поделитесь ссылкой: ${referralLink}`,
        buttons: [{ type: 'ok', text: 'Копировать' }, { type: 'cancel' }]
    }, (buttonId) => {
        if (buttonId === 'ok') {
            navigator.clipboard.writeText(referralLink);
            DOM.message.innerText = 'Ссылка скопирована!';
        }
    });
}

// Функция показа реферальной панели
function showReferral() {
    showPanel('referral');
    generateReferralLink();
}

// Функция проверки рефералов
function checkReferral() {
    const urlParams = new URLSearchParams(window.location.search);
    const referrerId = urlParams.get('start');
    if (referrerId && referrerId !== userId && !referrals.includes(referrerId)) {
        referrals.push(referrerId);
        water += 10;
        DOM.message.innerText = 'Бонус за реферала: +10 воды!';
        saveState();
        updateDisplay();
    }
}

// Запуск игрового цикла
setInterval(updateGame, 1000);

// Инициализация
checkReferral();
updateDisplay();
updateTimers();

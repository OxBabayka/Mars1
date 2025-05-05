// Инициализация Telegram Web App для интеграции с Telegram
const tg = window.Telegram.WebApp;
tg.ready();

// Получение данных пользователя из Telegram
const user = tg.initDataUnsafe.user;
const userId = user ? user.id : 'test_user'; // ID пользователя или тестовая заглушка
const username = user ? user.username || 'колонист' : 'колонист'; // Имя пользователя или стандартное
document.querySelector('h1').innerText = `Mars Reborn, ${username}!`; // Персонализация заголовка

// Кэширование DOM-элементов для оптимизации производительности
const DOM = {
    capacitor: document.getElementById('capacitor'), // Энергия капаситора
    chargedBatteries: document.getElementById('chargedBatteries'), // Заряженные батареи
    dischargedBatteries: document.getElementById('dischargedBatteries'), // Разряженные батареи
    stamina: document.getElementById('stamina'), // Стамина игрока
    water: document.getElementById('water'), // Вода
    food: document.getElementById('food'), // Еда
    coffeeCups: document.getElementById('coffeeCups'), // Кружки кофе
    ice: document.getElementById('ice'), // Лёд
    regolith: document.getElementById('regolith'), // Реголит
    trash: document.getElementById('trash'), // Мусор
    scrapMetal: document.getElementById('scrapMetal'), // Металлолом
    metal: document.getElementById('metal'), // Металл
    soil: document.getElementById('soil'), // Почва
    co2: document.getElementById('co2'), // CO₂
    o2: document.getElementById('o2'), // O₂
    h2: document.getElementById('h2'), // H₂
    coffeeBeans: document.getElementById('coffeeBeans'), // Кофейные зёрна
    chargingStatus: document.getElementById('chargingStatus'), // Статус заряжающихся батарей
    cropStatus: document.getElementById('cropStatus'), // Статус теплицы
    cropInventory: document.getElementById('cropInventory'), // Инвентарь культур
    progressBar: document.getElementById('progressBar'), // Прогресс-бар теплицы
    progress: document.getElementById('progress'), // Полоса прогресса
    message: document.getElementById('message'), // Сообщения об ошибках/успехах
    referralLink: document.getElementById('referralLink'), // Реферальная ссылка
    normalTimer: document.getElementById('normalTimer'), // Таймер обычного сбора
    advancedTimer: document.getElementById('advancedTimer') // Таймер расширенного сбора
};

// Загрузка состояния игры из localStorage или инициализация стартовых значений
let gameState = JSON.parse(localStorage.getItem('gameState')) || {
    capacitor: 100, // Стартовое значение капаситора (кВт/ч)
    chargedBatteries: 5, // Заряженные батареи
    dischargedBatteries: 0, // Разряженные батареи
    chargingBatteries: [], // Заряжающиеся батареи [{startTime: timestamp, panelId: number}]
    solarPanels: 0, // Количество солнечных панелей
    stamina: 100, // Стартовое значение стамины
    water: 100, // Стартовое значение воды
    food: 100, // Стартовое значение еды
    coffeeCups: 0, // Кружки кофе
    ice: 0, // Лёд
    regolith: 0, // Реголит
    trash: 0, // Мусор
    scrapMetal: 0, // Металлолом
    metal: 0, // Металл
    soil: 0, // Почва
    co2: 0, // CO₂
    o2: 0, // O₂
    h2: 0, // H₂
    coffeeBeans: 0, // Кофейные зёрна
    chemLabs: 0, // Количество Хим Лаб
    cads: 0, // Количество C.A.D+
    lastCollectionNormal: 0, // Время последнего обычного сбора
    lastCollectionAdvanced: 0, // Время последнего расширенного сбора
    crop: null, // Текущая культура в теплице
    lastUpdate: Date.now(), // Время последнего обновления
    referrals: [] // Список рефералов
};

// Присваивание переменных из gameState для удобства работы
let { capacitor, chargedBatteries, dischargedBatteries, chargingBatteries, solarPanels, stamina, water, food, coffeeCups, ice, regolith, trash, scrapMetal, metal, soil, co2, o2, h2, coffeeBeans, chemLabs, cads, lastCollectionNormal, lastCollectionAdvanced, crop, lastUpdate, referrals } = gameState;

// Константы игры
const maxCapacitor = 100; // Максимальная вместимость капаситора
const maxStamina = 100; // Максимальная стамина
const staminaPerSecond = 0.00333; // Регенерация стамины: 1 ед./5 мин
const foodWaterPerSecond = 0.00167; // Расход еды/воды: 0.5 ед./5 мин
const batteryChargeTime = 21600; // Время зарядки батареи: 6 часов (в секундах)
const botUsername = '@MarsRebornBot'; // Имя Telegram-бота

// Конфигурация культур для теплицы
const CROP_CONFIG = {
    lettuce: { 
        name: 'Салат латук', 
        time: 900, // 15 минут
        soil: 5, 
        water: 10, 
        stamina: 5, 
        energy: 5, 
        food: 10 // Урожай
    },
    potato: { 
        name: 'Картофель', 
        time: 1200, // 20 минут
        soil: 6, 
        water: 12, 
        stamina: 6, 
        energy: 6, 
        food: 12 
    },
    carrot: { 
        name: 'Морковь', 
        time: 1500, // 25 минут
        soil: 7, 
        water: 14, 
        stamina: 7, 
        energy: 7, 
        food: 14 
    },
    sunflower: { 
        name: 'Подсолнечник', 
        time: 300, // 5 минут
        soil: 4, 
        water: 15, 
        stamina: 4, 
        energy: 4, 
        food: 8 
    },
    rice: { 
        name: 'Рис', 
        time: 1800, // 30 минут
        soil: 8, 
        water: 16, 
        stamina: 8, 
        energy: 8, 
        food: 16 
    }
};

// Конфигурация действий игры
const ACTION_CONFIG = {
    cookFood: {
        resources: { coffeeBeans: 1 }, // Требуемые ресурсы
        stamina: 5, // Затраты стамины
        energy: 2, // Затраты энергии
        callback: () => { food += 5; DOM.message.innerText = 'Еда приготовлена!'; }, // Действие
        animation: 'flash' // Тип анимации
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
        cooldown: 30000, // 30 секунд
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
        cooldown: 60000, // 60 секунд
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
        condition: () => chemLabs >= 1, // Требуется Хим Лаб
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
        condition: () => cads >= 1, // Требуется C.A.D+
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

// Переключение панелей (вкладок)
function showPanel(panelId) {
    document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active')); // Скрыть все панели
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active')); // Убрать активность вкладок
    document.getElementById(panelId).classList.add('active'); // Показать выбранную панель
    document.querySelector(`.tab[onclick="showPanel('${panelId}')"]`).classList.add('active'); // Активировать вкладку
    if (panelId !== 'referral') document.getElementById('referral').classList.remove('active'); // Скрыть реферальную панель
}

// Сохранение состояния игры в localStorage
function saveState() {
    gameState = { capacitor, chargedBatteries, dischargedBatteries, chargingBatteries, solarPanels, stamina, water, food, coffeeCups, ice, regolith, trash, scrapMetal, metal, soil, co2, o2, h2, coffeeBeans, chemLabs, cads, lastCollectionNormal, lastCollectionAdvanced, crop, lastUpdate, referrals };
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

// Анимация для кнопок
function animateAction(button, type = 'flash') {
    const effect = document.createElement('div');
    effect.className = 'action-effect';
    button.appendChild(effect);
    setTimeout(() => effect.remove(), 500); // Удаление эффекта через 0.5 сек

    if (type === 'particles') {
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.setProperty('--x', Math.random() * 2 - 1); // Случайное направление
            particle.style.setProperty('--y', Math.random() * 2 - 1);
            button.appendChild(particle);
            setTimeout(() => particle.remove(), 700); // Удаление частиц через 0.7 сек
        }
    }

    anime({
        targets: button,
        scale: [1, 1.1, 1], // Увеличение и возврат масштаба
        duration: 300,
        easing: 'easeInOutQuad'
    });
}

// Обновление интерфейса
function updateDisplay() {
    DOM.capacitor.innerText = `${capacitor.toFixed(1)} кВт/ч`; // Энергия капаситора
    DOM.chargedBatteries.innerText = chargedBatteries; // Заряженные батареи
    DOM.dischargedBatteries.innerText = dischargedBatteries; // Разряженные батареи
    DOM.stamina.innerText = stamina.toFixed(1); // Стамина
    DOM.water.innerText = water.toFixed(1); // Вода
    DOM.food.innerText = food.toFixed(1); // Еда
    DOM.coffeeCups.innerText = coffeeCups; // Кружки кофе
    DOM.ice.innerText = ice; // Лёд
    DOM.regolith.innerText = regolith; // Реголит
    DOM.trash.innerText = trash; // Мусор
    DOM.scrapMetal.innerText = scrapMetal.toFixed(1); // Металлолом
    DOM.metal.innerText = metal.toFixed(1); // Металл
    DOM.soil.innerText = soil.toFixed(1); // Почва
    DOM.co2.innerText = co2.toFixed(1); // CO₂
    DOM.o2.innerText = o2.toFixed(1); // O₂
    DOM.h2.innerText = h2.toFixed(1); // H₂
    DOM.coffeeBeans.innerText = coffeeBeans; // Кофейные зёрна
    DOM.chargingStatus.innerText = `Заряжающиеся батареи: ${chargingBatteries.length}`; // Статус зарядки
    DOM.cropInventory.innerText = `Собрано: Кофейные зёрна: ${coffeeBeans}`; // Инвентарь культур
    if (crop) {
        const totalTime = CROP_CONFIG[crop.type].time;
        const progress = (totalTime - crop.timeLeft) / totalTime * 100;
        DOM.cropStatus.innerText = `Теплица: ${CROP_CONFIG[crop.type].name} (${progress.toFixed(0)}%)`; // Статус теплицы
        DOM.progressBar.style.display = 'block';
        DOM.progress.style.width = `${progress}%`; // Прогресс-бар
    } else {
        DOM.cropStatus.innerText = 'Теплица: нет активных культур';
        DOM.progressBar.style.display = 'none';
    }
    saveState(); // Сохранение состояния
}

// Обновление таймеров сбора ресурсов
function updateTimers() {
    const now = Date.now();
    const normalTimeLeft = Math.max(0, 30000 - (now - lastCollectionNormal)) / 1000; // Остаток времени для обычного сбора
    const advancedTimeLeft = Math.max(0, 60000 - (now - lastCollectionAdvanced)) / 1000; // Остаток времени для расширенного сбора
    DOM.normalTimer.innerText = normalTimeLeft > 0 ? `Осталось: ${normalTimeLeft.toFixed(0)} сек` : 'Готово';
    DOM.advancedTimer.innerText = advancedTimeLeft > 0 ? `Осталось: ${advancedTimeLeft.toFixed(0)} сек` : 'Готово';
}

// Обновление состояния заряжающихся батарей
function updateBatteries(secondsPassed) {
    const now = Date.now();
    chargingBatteries = chargingBatteries.filter(battery => {
        const timePassed = (now - battery.startTime) / 1000;
        if (timePassed >= batteryChargeTime) {
            chargedBatteries += 1; // Батарея заряжена
            return false; // Удаляем из очереди
        }
        return true; // Оставляем в очереди
    });
}

// Основной игровой цикл (каждую секунду)
function updateGame() {
    const now = Date.now();
    const secondsPassed = Math.min((now - lastUpdate) / 1000, 60); // Ограничение для длительного бездействия
    if (secondsPassed <= 0) return;

    // Регенерация стамины
    let staminaRate = staminaPerSecond;
    if (food === 0 || water === 0) staminaRate = 0; // Нет регенерации при нуле еды/воды
    else if (food < 30 || water < 30) staminaRate *= 0.5; // Половина регенерации при < 30
    stamina = Math.min(maxStamina, stamina + staminaRate * secondsPassed);

    // Расход еды и воды
    food = Math.max(0, food - foodWaterPerSecond * secondsPassed);
    water = Math.max(0, water - foodWaterPerSecond * secondsPassed);

    // Обновление теплицы
    if (crop) {
        crop.timeLeft -= secondsPassed;
        if (crop.timeLeft <= 0) {
            food += CROP_CONFIG[crop.type].food; // Добавление еды
            DOM.message.innerText = `${CROP_CONFIG[crop.type].name} собран! +${CROP_CONFIG[crop.type].food} еды`;
            crop = null; // Очистка теплицы
        }
    }

    // Обновление батарей
    updateBatteries(secondsPassed);

    lastUpdate = now;
    updateDisplay(); // Обновление интерфейса
    updateTimers(); // Обновление таймеров
}

// Проверка наличия ресурсов
function checkResources(requirements) {
    for (const [resource, amount] of Object.entries(requirements)) {
        if (gameState[resource] < amount) {
            DOM.message.innerText = `Недостаточно ${resource}!`;
            return false;
        }
    }
    return true;
}

// Проверка стамины
function checkStamina(amount) {
    if (stamina >= amount) return true;
    DOM.message.innerText = 'Недостаточно стамины!';
    return false;
}

// Проверка энергии
function checkEnergy(amount) {
    if (capacitor >= amount) return true;
    DOM.message.innerText = 'Недостаточно энергии в капаситоре!';
    return false;
}

// Выполнение действия
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
            gameState[resource] -= amount; // Списание ресурсов
        }
        stamina -= config.stamina; // Списание стамины
        capacitor -= config.energy; // Списание энергии
        config.callback(); // Выполнение действия
        animateAction(button, config.animation); // Анимация
        updateDisplay(); // Обновление интерфейса
    }
}

// Посадка культуры
function plantCrop(type) {
    if (crop) {
        DOM.message.innerText = 'Теплица занята!';
        return;
    }
    const config = CROP_CONFIG[type];
    const button = event.target;
    if (checkResources({ soil: config.soil, water: config.water }) && checkStamina(config.stamina) && checkEnergy(config.energy)) {
        soil -= config.soil; // Списание почвы
        water -= config.water; // Списание воды
        stamina -= config.stamina; // Списание стамины
        capacitor -= config.energy; // Списание энергии
        crop = { type, timeLeft: config.time }; // Начало роста культуры
        DOM.message.innerText = `${config.name} посажен!`;
        animateAction(button, 'particles');
        updateDisplay();
    } else {
        DOM.message.innerText = 'Недостаточно ресурсов!';
    }
}

// Зарядка батареи
function chargeBattery() {
    const button = event.target;
    if (dischargedBatteries < 1) {
        DOM.message.innerText = 'Нет разряженных батарей!';
        return;
    }
    const totalSlots = solarPanels * 3; // Слоты для зарядки (3 на панель)
    if (chargingBatteries.length >= totalSlots) {
        DOM.message.innerText = 'Все слоты для зарядки заняты!';
        return;
    }
    dischargedBatteries -= 1; // Уменьшение разряженных батарей
    chargingBatteries.push({ startTime: Date.now(), panelId: solarPanels }); // Добавление в очередь зарядки
    DOM.message.innerText = 'Батарея поставлена на зарядку!';
    animateAction(button, 'flash');
    updateDisplay();
}

// Использование батареи
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
    chargedBatteries -= 1; // Уменьшение заряженных батарей
    dischargedBatteries += 1; // Увеличение разряженных батарей
    capacitor = Math.min(maxCapacitor, capacitor + 20); // Зарядка капаситора
    DOM.message.innerText = 'Капаситор заряжен на 20 кВт/ч!';
    animateAction(button, 'flash');
    updateDisplay();
}

// Реферальная система
function generateReferralLink() {
    const referralLink = `https://t.me/${botUsername}?start=${userId}`; // Создание ссылки
    DOM.referralLink.innerText = `Ваша реферальная ссылка: ${referralLink}`;
    tg.showPopup({
        title: 'Реферальная ссылка',
        message: `Поделитесь ссылкой: ${referralLink}`,
        buttons: [{ type: 'ok', text: 'Копировать' }, { type: 'cancel' }]
    }, (buttonId) => {
        if (buttonId === 'ok') {
            navigator.clipboard.writeText(referralLink); // Копирование ссылки
            DOM.message.innerText = 'Ссылка скопирована!';
        }
    });
}

// Показ панели рефералов
function showReferral() {
    showPanel('referral');
    generateReferralLink();
}

// Проверка рефералов при запуске
function checkReferral() {
    const urlParams = new URLSearchParams(window.location.search);
    const referrerId = urlParams.get('start');
    if (referrerId && referrerId !== userId && !referrals.includes(referrerId)) {
        referrals.push(referrerId); // Добавление реферала
        water += 10; // Бонус
        DOM.message.innerText = 'Бонус за реферала: +10 воды!';
        saveState();
        updateDisplay();
    }
}

// Запуск игрового цикла (каждую секунду)
setInterval(updateGame, 1000);

// Инициализация игры
checkReferral(); // Проверка рефералов
updateDisplay(); // Начальное обновление интерфейса
updateTimers(); // Начальное обновление таймеров
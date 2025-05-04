let energy = 1600;
let water = 0;
let food = 0;
let coffeeCups = 0;
let roastedBeans = 0;
let dirtyIce = 0;
let electricity = 0;
let solarPanels = 0;
let chemLabs = 0;
let lastCollection = 0;
let crop = null;
let cropTime = 0;
let cropType = '';

function updateDisplay() {
    document.getElementById('energy').innerText = `Энергия: ${energy}`;
    document.getElementById('water').innerText = `Вода: ${water}`;
    document.getElementById('food').innerText = `Еда: ${food}`;
    document.getElementById('coffeeCups').innerText = `Кружки кофе: ${coffeeCups}`;
    document.getElementById('resourcesList').innerText = `Ресурсы: Энергия: ${energy}, Вода: ${water}, Еда: ${food}, Кружки кофе: ${coffeeCups}, Обжаренные зёрна: ${roastedBeans}, Грязный лёд: ${dirtyIce}`;
    document.getElementById('electricity').innerText = `Электричество: ${electricity} кВт/ч`;
    if (crop) {
        document.getElementById('cropStatus').innerText = `Теплица: ${cropType} растёт`;
        document.getElementById('progressBar').style.display = 'block';
        document.getElementById('progress').style.width = `${(cropTime / (crop === 'potato' ? 60 : crop === 'lettuce' ? 900 : 120)) * 100}%`;
    } else {
        document.getElementById('cropStatus').innerText = 'Теплица: нет активных культур';
        document.getElementById('progressBar').style.display = 'none';
    }
}

function plantCrop(type) {
    if (crop) {
        document.getElementById('message').innerText = 'Теплица занята!';
        return;
    }
    const costs = {
        potato: { energy: 50, water: 10 },
        lettuce: { energy: 30, water: 5 },
        coffee: { energy: 60, water: 12 }
    };
    if (energy >= costs[type].energy && water >= costs[type].water) {
        energy -= costs[type].energy;
        water -= costs[type].water;
        crop = type;
        cropType = type === 'potato' ? 'Картофель' : type === 'lettuce' ? 'Салат латук' : 'Кофе';
        cropTime = 0;
        document.getElementById('message').innerText = `${cropType} посажен!`;
        updateDisplay();
    } else {
        document.getElementById('message').innerText = 'Недостаточно ресурсов!';
    }
}

function drinkCoffee() {
    if (coffeeCups >= 1) {
        coffeeCups -= 1;
        energy += 50;
        document.getElementById('message').innerText = 'Энергия восстановлена!';
        updateDisplay();
    } else {
        document.getElementById('message').innerText = 'Недостаточно кофе!';
    }
}

function cookFood() {
    if (food >= 1) {
        food -= 1;
        document.getElementById('message').innerText = 'Еда приготовлена!';
        updateDisplay();
    } else {
        document.getElementById('message').innerText = 'Недостаточно еды!';
    }
}

function brewCoffee() {
    if (roastedBeans >= 5) {
        roastedBeans -= 5;
        coffeeCups += 1;
        document.getElementById('message').innerText = 'Кофе сварен!';
        updateDisplay();
    } else {
        document.getElementById('message').innerText = 'Недостаточно обжаренных зёрен!';
    }
}

function buildSolarPanel() {
    if (energy >= 100) {
        energy -= 100;
        solarPanels += 1;
        electricity += 100;
        document.getElementById('message').innerText = 'Солнечная панель построена!';
        updateDisplay();
    } else {
        document.getElementById('message').innerText = 'Недостаточно энергии!';
    }
}

function buildChemLab() {
    if (energy >= 200) {
        energy -= 200;
        chemLabs += 1;
        document.getElementById('message').innerText = 'Хим Лаб построена!';
        updateDisplay();
    } else {
        document.getElementById('message').innerText = 'Недостаточно энергии!';
    }
}

function purifyIce() {
    if (dirtyIce >= 1 && chemLabs >= 1) {
        dirtyIce -= 1;
        water += 1;
        document.getElementById('message').innerText = 'Грязный лёд очищен в воду!';
        updateDisplay();
    } else {
        document.getElementById('message').innerText = 'Недостаточно грязного льда или Хим Лаб не построена!';
    }
}

function collectResources() {
    const now = Date.now();
    if (now - lastCollection < 60000) {
        document.getElementById('message').innerText = 'Сбор возможен раз в минуту!';
        return;
    }
    lastCollection = now;
    const items = ['мусор', 'грязный лёд'];
    const collected = items.filter(() => Math.random() < 0.5);
    if (collected.length > 0) {
        collected.forEach(item => {
            if (item === 'грязный лёд') {
                dirtyIce += 1;
            }
        });
        document.getElementById('message').innerText = `Вы собрали: ${collected.join(', ')}`;
    } else {
        document.getElementById('message').innerText = 'Ничего не найдено!';
    }
    updateDisplay();
}

setInterval(() => {
    if (crop) {
        cropTime += 1;
        if (cropTime >= (crop === 'potato' ? 60 : crop === 'lettuce' ? 900 : 120)) {
            if (crop === 'potato') {
                food += 5;
            } else if (crop === 'lettuce') {
                food += 3;
            } else if (crop === 'coffee') {
                roastedBeans += 10;
            }
            crop = null;
            cropTime = 0;
            document.getElementById('message').innerText = `${cropType} собран!`;
        }
    }
    food -= 0.5 / 60; // 0.5 в минуту
    water -= 0.5 / 60;
    if (food < 0) food = 0;
    if (water < 0) water = 0;
    electricity = solarPanels * 100 - (10 + (crop ? 20 : 0) + chemLabs * 30); // Расход электричества
    updateDisplay();
}, 1000);

updateDisplay();

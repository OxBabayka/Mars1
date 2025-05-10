const exploreButton = document.getElementById('explore-button');
if (exploreButton) {
    exploreButton.addEventListener('click', () => game.exploreCell(0));
} else {
    console.error('Кнопка "Исследовать окрестности" не найдена');
}

const purifyIceButton = document.getElementById('purify-ice-button');
if (purifyIceButton) {
    purifyIceButton.addEventListener('click', () => game.purifyIce());
} else {
    console.error('Кнопка "Очистить лёд" не найдена');
}

const recycleScrapButton = document.getElementById('recycle-scrap-button');
if (recycleScrapButton) {
    recycleScrapButton.addEventListener('click', () => game.recycleScrap());
} else {
    console.error('Кнопка "Переработать металлолом" не найдена');
}

const chargeBatteryButton = document.getElementById('charge-battery-button');
if (chargeBatteryButton) {
    chargeBatteryButton.addEventListener('click', () => game.chargeBattery());
} else {
    console.error('Кнопка "Зарядить батарею" не найдена');
}

const dischargeBatteryButton = document.getElementById('discharge-battery-button');
if (dischargeBatteryButton) {
    dischargeBatteryButton.addEventListener('click', () => game.dischargeBattery());
} else {
    console.error('Кнопка "Разрядить батарею" не найдена');
}

const restButton = document.getElementById('rest-button');
if (restButton) {
    restButton.addEventListener('click', () => game.rest());
} else {
    console.error('Кнопка "Отдых" не найдена');
}

const buildButton = document.getElementById('build-button');
if (buildButton) {
    buildButton.addEventListener('click', () => {
        const modal = document.getElementById('building-modal');
        if (modal) {
            modal.style.display = 'flex';
            game.updateUI();
        }
    });
} else {
    console.error('Кнопка "Строить/Улучшать здания" не найдена');
}

const closeModalButton = document.getElementById('close-modal');
if (closeModalButton) {
    closeModalButton.addEventListener('click', () => {
        const modal = document.getElementById('building-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    });
} else {
    console.error('Кнопка "Закрыть" в модальном окне не найдена');
}

const buildPowerStationButton = document.getElementById('build-power-station');
if (buildPowerStationButton) {
    buildPowerStationButton.addEventListener('click', () => {
        game.buildPowerStation();
    });
} else {
    console.error('Кнопка "Построить/Улучшить" для энергетической станции не найдена');
}

const buildGreenhouseButton = document.getElementById('build-greenhouse');
if (buildGreenhouseButton) {
    buildGreenhouseButton.addEventListener('click', () => {
        game.buildGreenhouse();
    });
} else {
    console.error('Кнопка "Построить" для теплицы не найдена');
}

// Ячейки теплицы
for (let i = 1; i <= 3; i++) {
    const slotIndex = i - 1;

    const growSproutsButton = document.getElementById(`grow-sprouts-${i}`);
    if (growSproutsButton) {
        growSproutsButton.addEventListener('click', () => game.growPlant(slotIndex, 'sprouts'));
    } else {
        console.error(`Кнопка "Пророщенные зерна" для ячейки ${i} не найдена`);
    }

    const growLettuceButton = document.getElementById(`grow-lettuce-${i}`);
    if (growLettuceButton) {
        growLettuceButton.addEventListener('click', () => game.growPlant(slotIndex, 'lettuce'));
    } else {
        console.error(`Кнопка "Салат-латук" для ячейки ${i} не найдена`);
    }

    const growPotatoButton = document.getElementById(`grow-potato-${i}`);
    if (growPotatoButton) {
        growPotatoButton.addEventListener('click', () => game.growPlant(slotIndex, 'potato'));
    } else {
        console.error(`Кнопка "Картофель" для ячейки ${i} не найдена`);
    }

    const growCornButton = document.getElementById(`grow-corn-${i}`);
    if (growCornButton) {
        growCornButton.addEventListener('click', () => game.growPlant(slotIndex, 'corn'));
    } else {
        console.error(`Кнопка "Кукуруза" для ячейки ${i} не найдена`);
    }

    const growCoffeeButton = document.getElementById(`grow-coffee-${i}`);
    if (growCoffeeButton) {
        growCoffeeButton.addEventListener('click', () => game.growPlant(slotIndex, 'coffee'));
    } else {
        console.error(`Кнопка "Кофе" для ячейки ${i} не найдена`);
    }
}

class Game {
    constructor() {
        // Начальные ресурсы и параметры
        this.resources = {
            energy: 100,
            maxEnergy: 100,
            food: 100,
            water: 100,
            materials: 0,
            ice: 0,
            regolith: 0,
            sand: 0,
            scrapMetal: 0,
            batteries: { charged: 0, empty: 5 },
            cornSeeds: 0,
            coffeeBunches: 0
        };
        this.stamina = 100;
        this.maxStamina = 100;

        // Здания
        this.buildings = {
            powerStation: { level: 0 },
            greenhouse: { level: 0 }
        };

        // Состояния действий
        this.exploring = false;
        this.purifying = false;
        this.recycling = false;
        this.charging = false;
        this.resting = false;

        // Ячейки теплицы
        this.greenhouseSlots = [
            { plant: null, startTime: null, timer: null },
            { plant: null, startTime: null, timer: null },
            { plant: null, startTime: null, timer: null }
        ];

        // Время действий (в секундах)
        this.exploreTime = 25;      // 25 секунд
        this.purifyTime = 7200;     // 2 часа
        this.recycleTime = 1800;    // 30 минут
        this.chargeTime = 39600;    // 11 часов
        this.restCooldown = 86400;  // 24 часа

        // Затраты и параметры
        this.exploreCost = 1;
        this.purifyCost = { ice: 20, stamina: 15, energy: 15 };
        this.recycleCost = { scrapMetal: 50, stamina: 10, energy: 10 };
        this.dischargeGain = 10;
        this.batteryBreakChance = 0.07;

        // Параметры растений
        this.plants = {
            sprouts: { time: 15 * 60, stamina: 1, energy: 5, water: 10, foodGain: 15 },
            lettuce: { time: 30 * 60, stamina: 3, energy: 7, water: 15, foodGain: 25 },
            potato: { time: 60 * 60, stamina: 5, energy: 15, water: 25, foodGain: 35 },
            corn: { time: 4 * 3600, stamina: 10, energy: 30, water: 15, cornGain: 1 },
            coffee: { time: 4 * 3600, stamina: 5, energy: 30, water: 30, coffeeGain: 1 }
        };

        // Таймеры и время начала действий
        this.exploreTimer = null;
        this.purifyTimer = null;
        this.recycleTimer = null;
        this.chargeTimer = null;
        this.restTimer = null;
        this.exploreStartTime = null;
        this.purifyStartTime = null;
        this.recycleStartTime = null;
        this.chargeStartTime = null;
        this.lastRestTime = null;

        // Время игрока
        this.joinTime = null;
        this.timeSpentInterval = null;
    }

    start() {
        console.log('Игра запущена');
        this.loadGame();
        this.createMap();
        this.updateUI();
        setInterval(() => this.tick(), 1000);
        setInterval(() => this.regenStamina(), 300000);
        setInterval(() => this.saveGame(), 5000);
        this.initPlayerProfile();
        this.updateTimeSpent();
        this.timeSpentInterval = setInterval(() => this.updateTimeSpent(), 1000);
    }

    createMap() {
        const mapGrid = document.querySelector('.map-grid');
        if (!mapGrid) {
            console.error('Элемент .map-grid не найден');
            return;
        }
        mapGrid.innerHTML = '';
        for (let i = 0; i < 100; i++) {
            const cell = document.createElement('div');
            cell.classList.add('map-cell');
            if (i === 45) {
                cell.id = 'residential-module-cell';
                cell.title = 'Жилой модуль';
            } else {
                cell.addEventListener('click', () => this.exploreCell(i));
            }
            mapGrid.appendChild(cell);
        }
    }

    exploreCell(index) {
        if (!this.exploring && this.stamina >= this.exploreCost) {
            this.exploring = true;
            this.stamina -= this.exploreCost;
            this.exploreStartTime = Date.now();
            this.updateExploreTimer();
            this.exploreTimer = setInterval(() => this.updateExploreTimer(), 1000);
            setTimeout(() => {
                clearInterval(this.exploreTimer);
                this.finishExploration();
            }, this.exploreTime * 1000);
            this.updateUI();
        }
    }

    finishExploration() {
        this.exploring = false;
        this.exploreStartTime = null;
        if (Math.random() < 0.45) {
            const resourcesFound = this.generateResources();
            this.resources.ice += resourcesFound.ice;
            this.resources.regolith += resourcesFound.regolith;
            this.resources.sand += resourcesFound.sand;
            this.resources.scrapMetal += resourcesFound.scrapMetal;
            this.notify(`Исследование завершено!\nПолучено: Лёд: ${resourcesFound.ice}, Реголит: ${resourcesFound.regolith}, Песок: ${resourcesFound.sand}, Металлолом: ${resourcesFound.scrapMetal}`);
        } else {
            this.notify('Исследование завершено!\nНичего не найдено');
        }
        this.updateUI();
    }

    generateResources() {
        return {
            ice: Math.floor(Math.random() * 6),
            regolith: Math.floor(Math.random() * 6),
            sand: Math.floor(Math.random() * 6),
            scrapMetal: Math.floor(Math.random() * 6)
        };
    }

    purifyIce() {
        if (!this.purifying &&
            this.resources.ice >= this.purifyCost.ice &&
            this.stamina >= this.purifyCost.stamina &&
            this.resources.energy >= this.purifyCost.energy) {
            this.purifying = true;
            this.resources.ice -= this.purifyCost.ice;
            this.stamina -= this.purifyCost.stamina;
            this.resources.energy -= this.purifyCost.energy;
            this.purifyStartTime = Date.now();
            this.updatePurifyTimer();
            this.purifyTimer = setInterval(() => this.updatePurifyTimer(), 1000);
            setTimeout(() => {
                clearInterval(this.purifyTimer);
                this.finishPurifying();
            }, this.purifyTime * 1000);
            this.updateUI();
        }
    }

    finishPurifying() {
        this.purifying = false;
        this.purifyStartTime = null;
        this.resources.water += 12;
        const sandGained = Math.floor(Math.random() * 4) + 2;
        const regolithGained = Math.floor(Math.random() * 4) + 2;
        this.resources.sand += sandGained;
        this.resources.regolith += regolithGained;
        this.updateUI();
        this.notify(`Очистка завершена!\nПолучено: Вода: 12, Песок: ${sandGained}, Реголит: ${regolithGained}`);
    }

    recycleScrap() {
        if (!this.recycling &&
            this.resources.scrapMetal >= this.recycleCost.scrapMetal &&
            this.stamina >= this.recycleCost.stamina &&
            this.resources.energy >= this.recycleCost.energy) {
            this.recycling = true;
            this.resources.scrapMetal -= this.recycleCost.scrapMetal;
            this.stamina -= this.recycleCost.stamina;
            this.resources.energy -= this.recycleCost.energy;
            this.recycleStartTime = Date.now();
            this.updateRecycleTimer();
            this.recycleTimer = setInterval(() => this.updateRecycleTimer(), 1000);
            setTimeout(() => {
                clearInterval(this.recycleTimer);
                this.finishRecycling();
            }, this.recycleTime * 1000);
            this.updateUI();
        }
    }

    finishRecycling() {
        this.recycling = false;
        this.recycleStartTime = null;
        this.resources.materials += 30;
        this.updateUI();
        this.notify('Переработка завершена!\nПолучено: Материалы: 30');
    }

    chargeBattery() {
        if (!this.charging && this.resources.batteries.empty > 0) {
            this.charging = true;
            this.resources.batteries.empty -= 1;
            this.chargeStartTime = Date.now();
            this.updateChargeTimer();
            this.chargeTimer = setInterval(() => this.updateChargeTimer(), 1000);
            setTimeout(() => {
                clearInterval(this.chargeTimer);
                this.finishCharging();
            }, this.chargeTime * 1000);
            this.updateUI();
        }
    }

    finishCharging() {
        this.charging = false;
        this.chargeStartTime = null;
        this.resources.batteries.charged += 1;
        this.updateUI();
        this.notify('Батарея заряжена!');
    }

    dischargeBattery() {
        if (this.resources.batteries.charged > 0) {
            this.resources.batteries.charged -= 1;
            this.resources.energy += this.dischargeGain;
            if (Math.random() < this.batteryBreakChance) {
                this.notify('Батарея сломалась при разрядке!');
            } else {
                this.resources.batteries.empty += 1;
            }
            this.updateUI();
        }
    }

    rest() {
        const now = Date.now();
        if (!this.lastRestTime || (now - this.lastRestTime) >= this.restCooldown * 1000) {
            this.stamina = Math.min(this.maxStamina, this.stamina + 15);
            this.lastRestTime = now;
            this.updateRestTimer();
            this.notify('Отдых завершен. Стамина восстановлена на 15.');
            this.updateUI();
        } else {
            this.notify('Отдых недоступен. Подождите до окончания кулдауна.');
        }
    }

    buildPowerStation() {
        const cost = 50;
        if (this.resources.materials >= cost) {
            this.resources.materials -= cost;
            this.buildings.powerStation.level += 1;
            this.resources.maxEnergy += 50;
            if (this.resources.energy > this.resources.maxEnergy) {
                this.resources.energy = this.resources.maxEnergy;
            }
            this.updateUI();
            this.notify(`Энергетическая станция улучшена до уровня ${this.buildings.powerStation.level}! Максимальная энергия увеличена на 50.`);
        } else {
            this.notify('Недостаточно материалов для строительства!');
        }
    }

    buildGreenhouse() {
        const materialCost = 120;
        const energyCost = 25;
        if (this.buildings.greenhouse.level === 0 &&
            this.resources.materials >= materialCost &&
            this.resources.energy >= energyCost) {
            this.resources.materials -= materialCost;
            this.resources.energy -= energyCost;
            this.buildings.greenhouse.level = 1;
            this.updateUI();
            this.notify('Теплица построена! Теперь вы можете выращивать растения.');
            const slotsElement = document.getElementById('greenhouse-slots');
            if (slotsElement) {
                slotsElement.style.display = 'block';
            }
        } else {
            this.notify('Недостаточно ресурсов или теплица уже построена!');
        }
    }

    growPlant(slotIndex, plantType) {
        if (this.buildings.greenhouse.level === 0) {
            this.notify('Сначала постройте теплицу!');
            return;
        }
        const slot = this.greenhouseSlots[slotIndex];
        if (slot.plant) {
            this.notify(`Ячейка ${slotIndex + 1} занята! Дождитесь завершения роста.`);
            return;
        }
        const plant = this.plants[plantType];
        if (this.stamina >= plant.stamina &&
            this.resources.energy >= plant.energy &&
            this.resources.water >= plant.water) {
            this.stamina -= plant.stamina;
            this.resources.energy -= plant.energy;
            this.resources.water -= plant.water;
            slot.plant = plantType;
            slot.startTime = Date.now();
            slot.timer = setInterval(() => this.updateSlotTimer(slotIndex), 1000);
            setTimeout(() => {
                clearInterval(slot.timer);
                this.finishGrowing(slotIndex);
            }, plant.time * 1000);
            this.updateUI();
        } else {
            this.notify('Недостаточно ресурсов для выращивания растения!');
        }
    }

    finishGrowing(slotIndex) {
        const slot = this.greenhouseSlots[slotIndex];
        const plantType = slot.plant;
        if (plantType === 'sprouts') {
            this.resources.food += this.plants.sprouts.foodGain;
            this.notify(`Пророщенные зерна созрели! Получено: ${this.plants.sprouts.foodGain} еды.`);
        } else if (plantType === 'lettuce') {
            this.resources.food += this.plants.lettuce.foodGain;
            this.notify(`Салат-латук созрел! Получено: ${this.plants.lettuce.foodGain} еды.`);
        } else if (plantType === 'potato') {
            this.resources.food += this.plants.potato.foodGain;
            this.notify(`Картофель созрел! Получено: ${this.plants.potato.foodGain} еды.`);
        } else if (plantType === 'corn') {
            this.resources.cornSeeds += this.plants.corn.cornGain;
            this.notify(`Кукуруза созрела! Получено: ${this.plants.corn.cornGain} семян кукурузы.`);
        } else if (plantType === 'coffee') {
            this.resources.coffeeBunches += this.plants.coffee.coffeeGain;
            this.notify(`Кофе созрел! Получено: ${this.plants.coffee.coffeeGain} кофейных гроздьев.`);
        }
        slot.plant = null;
        slot.startTime = null;
        slot.timer = null;
        this.updateUI();
    }

    updateSlotTimer(slotIndex) {
        const slot = this.greenhouseSlots[slotIndex];
        if (slot.startTime) {
            const elapsed = Math.floor((Date.now() - slot.startTime) / 1000);
            const remaining = this.plants[slot.plant].time - elapsed;
            const statusElement = document.getElementById(`slot-${slotIndex + 1}-status`);
            if (statusElement) {
                if (remaining > 0) {
                    const hours = Math.floor(remaining / 3600);
                    const minutes = Math.floor((remaining % 3600) / 60);
                    const seconds = remaining % 60;
                    statusElement.textContent = `Растёт (${hours}ч ${minutes}м ${seconds}с)`;
                } else {
                    statusElement.textContent = 'Пусто';
                }
            }
        }
    }

    tick() {
        this.updateUI();
    }

    regenStamina() {
        if (this.resources.food >= 0.5 && this.resources.water >= 0.5 && this.stamina < this.maxStamina) {
            this.stamina += 1;
            this.resources.food -= 0.5;
            this.resources.water -= 0.5;
            if (this.stamina > this.maxStamina) this.stamina = this.maxStamina;
            this.updateUI();
        }
    }

    updateExploreTimer() {
        if (this.exploreStartTime) {
            const elapsed = Math.floor((Date.now() - this.exploreStartTime) / 1000);
            const remaining = this.exploreTime - elapsed;
            const progressElement = document.getElementById('explore-progress');
            if (progressElement) {
                if (remaining >= 0) {
                    progressElement.textContent = `Исследование: ${remaining} сек`;
                } else {
                    progressElement.textContent = '';
                }
            }
        }
    }

    updatePurifyTimer() {
        if (this.purifyStartTime) {
            const elapsed = Math.floor((Date.now() - this.purifyStartTime) / 1000);
            const remaining = this.purifyTime - elapsed;
            const progressElement = document.getElementById('purify-progress');
            if (progressElement) {
                if (remaining >= 0) {
                    progressElement.textContent = `Очистка: ${Math.floor(remaining / 3600)} ч ${Math.floor((remaining % 3600) / 60)} мин`;
                } else {
                    progressElement.textContent = '';
                }
            }
        }
    }

    updateRecycleTimer() {
        if (this.recycleStartTime) {
            const elapsed = Math.floor((Date.now() - this.recycleStartTime) / 1000);
            const remaining = this.recycleTime - elapsed;
            const progressElement = document.getElementById('recycle-progress');
            if (progressElement) {
                if (remaining >= 0) {
                    progressElement.textContent = `Переработка: ${Math.floor(remaining / 60)} мин`;
                } else {
                    progressElement.textContent = '';
                }
            }
        }
    }

    updateChargeTimer() {
        if (this.chargeStartTime) {
            const elapsed = Math.floor((Date.now() - this.chargeStartTime) / 1000);
            const remaining = this.chargeTime - elapsed;
            const progressElement = document.getElementById('charge-progress');
            if (progressElement) {
                if (remaining >= 0) {
                    progressElement.textContent = `Зарядка: ${Math.floor(remaining / 3600)} ч ${Math.floor((remaining % 3600) / 60)} мин`;
                } else {
                    progressElement.textContent = '';
                }
            }
        }
    }

    updateRestTimer() {
        if (this.lastRestTime) {
            const elapsed = Math.floor((Date.now() - this.lastRestTime) / 1000);
            const remaining = this.restCooldown - elapsed;
            const timerElement = document.getElementById('rest-timer');
            if (timerElement) {
                if (remaining > 0) {
                    const hours = Math.floor(remaining / 3600);
                    const minutes = Math.floor((remaining % 3600) / 60);
                    const seconds = remaining % 60;
                    timerElement.textContent = `До следующего отдыха: ${hours}ч ${minutes}м ${seconds}с`;
                } else {
                    timerElement.textContent = 'Отдых доступен';
                }
            }
        } else {
            const timerElement = document.getElementById('rest-timer');
            if (timerElement) {
                timerElement.textContent = 'Отдых доступен';
            }
        }
    }

    updateUI() {
        const elements = {
            stamina: document.getElementById('stamina'),
            energy: document.getElementById('resource-energy'),
            food: document.getElementById('resource-food'),
            water: document.getElementById('resource-water'),
            materials: document.getElementById('resource-materials'),
            ice: document.getElementById('resource-ice'),
            regolith: document.getElementById('resource-regolith'),
            sand: document.getElementById('resource-sand'),
            scrapMetal: document.getElementById('resource-scrapMetal'),
            batteries: document.getElementById('resource-batteries'),
            cornSeeds: document.getElementById('resource-corn-seeds'),
            coffeeBunches: document.getElementById('resource-coffee-bunches'),
            exploreButton: document.getElementById('explore-button'),
            purifyButton: document.getElementById('purify-ice-button'),
            recycleButton: document.getElementById('recycle-scrap-button'),
            chargeButton: document.getElementById('charge-battery-button'),
            dischargeButton: document.getElementById('discharge-battery-button'),
            restButton: document.getElementById('rest-button'),
            powerStationLevel: document.getElementById('power-station-level'),
            greenhouseLevel: document.getElementById('greenhouse-level')
        };

        if (elements.stamina) {
            elements.stamina.textContent = `Стамина: ${this.stamina}/${this.maxStamina}`;
        }
        if (elements.energy) {
            elements.energy.textContent = `Энергия: ${Math.max(0, this.resources.energy)}/${this.resources.maxEnergy}`;
        }
        if (elements.food) {
            elements.food.textContent = `Еда: ${Math.max(0, this.resources.food.toFixed(1))}`;
        }
        if (elements.water) {
            elements.water.textContent = `Вода: ${Math.max(0, this.resources.water.toFixed(1))}`;
        }
        if (elements.materials) {
            elements.materials.textContent = `Материалы: ${Math.max(0, this.resources.materials)}`;
        }
        if (elements.ice) {
            elements.ice.textContent = `Лёд: ${Math.max(0, this.resources.ice)}`;
        }
        if (elements.regolith) {
            elements.regolith.textContent = `Реголит: ${Math.max(0, this.resources.regolith)}`;
        }
        if (elements.sand) {
            elements.sand.textContent = `Песок: ${Math.max(0, this.resources.sand)}`;
        }
        if (elements.scrapMetal) {
            elements.scrapMetal.textContent = `Металлолом: ${Math.max(0, this.resources.scrapMetal)}`;
        }
        if (elements.batteries) {
            elements.batteries.textContent = `Батареи: ${Math.max(0, this.resources.batteries.charged)} заряженных, ${Math.max(0, this.resources.batteries.empty)} пустых`;
        }
        if (elements.cornSeeds) {
            elements.cornSeeds.textContent = `Семена кукурузы: ${Math.max(0, this.resources.cornSeeds)}`;
        }
        if (elements.coffeeBunches) {
            elements.coffeeBunches.textContent = `Кофейные гроздья: ${Math.max(0, this.resources.coffeeBunches)}`;
        }

        if (elements.exploreButton) {
            elements.exploreButton.disabled = this.exploring || this.stamina < this.exploreCost;
        }
        if (elements.purifyButton) {
            elements.purifyButton.disabled = this.purifying || 
                this.resources.ice < this.purifyCost.ice || 
                this.stamina < this.purifyCost.stamina || 
                this.resources.energy < this.purifyCost.energy;
        }
        if (elements.recycleButton) {
            elements.recycleButton.disabled = this.recycling || 
                this.resources.scrapMetal < this.recycleCost.scrapMetal || 
                this.stamina < this.recycleCost.stamina || 
                this.resources.energy < this.recycleCost.energy;
        }
        if (elements.chargeButton) {
            elements.chargeButton.disabled = this.charging || this.resources.batteries.empty <= 0;
        }
        if (elements.dischargeButton) {
            elements.dischargeButton.disabled = this.resources.batteries.charged <= 0;
        }
        if (elements.restButton) {
            elements.restButton.disabled = this.resting || (this.lastRestTime && (Date.now() - this.lastRestTime) < this.restCooldown * 1000);
        }
        if (elements.powerStationLevel) {
            elements.powerStationLevel.textContent = this.buildings.powerStation.level;
        }
        if (elements.greenhouseLevel) {
            elements.greenhouseLevel.textContent = this.buildings.greenhouse.level;
        }
    }

    notify(message) {
        const notifications = document.getElementById('notifications');
        if (notifications) {
            notifications.textContent = message;
        } else {
            console.error('Элемент #notifications не найден');
        }
    }

    initPlayerProfile() {
        let userName = 'Неизвестный игрок';
        let userPhoto = 'https://via.placeholder.com/40';
        let joinTime = localStorage.getItem('joinTime');

        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.ready();
            const user = window.Telegram.WebApp.initDataUnsafe.user;
            if (user) {
                userName = `${user.first_name} ${user.last_name || ''}`.trim();
                userPhoto = user.photo_url || 'https://via.placeholder.com/40';
            }
        }

        if (!joinTime) {
            joinTime = Date.now();
            localStorage.setItem('joinTime', joinTime);
        } else {
            joinTime = parseInt(joinTime, 10);
        }
        this.joinTime = joinTime;

        const profileInfo = document.getElementById('profile-info');
        if (profileInfo) {
            profileInfo.innerHTML = `
                <img src="${userPhoto}" alt="Profile Photo">
                <span>${userName}</span>
            `;
        } else {
            console.error('Элемент #profile-info не найден');
        }

        const joinDate = new Date(joinTime);
        const joinTimeElement = document.getElementById('join-time');
        if (joinTimeElement) {
            joinTimeElement.textContent = `Присоединился: ${joinDate.toLocaleString()}`;
        } else {
            console.error('Элемент #join-time не найден');
        }
    }

    updateTimeSpent() {
        const now = Date.now();
        const timeSpent = Math.floor((now - this.joinTime) / 1000);
        const hours = Math.floor(timeSpent / 3600);
        const minutes = Math.floor((timeSpent % 3600) / 60);
        const seconds = timeSpent % 60;
        const timeSpentElement = document.getElementById('time-spent');
        if (timeSpentElement) {
            timeSpentElement.textContent = `Время в игре: ${hours}ч ${minutes}м ${seconds}с`;
        } else {
            console.error('Элемент #time-spent не найден');
        }
    }

    saveGame() {
        const gameState = {
            resources: this.resources,
            stamina: this.stamina,
            maxStamina: this.maxStamina,
            buildings: this.buildings,
            exploring: this.exploring,
            purifying: this.purifying,
            recycling: this.recycling,
            charging: this.charging,
            resting: this.resting,
            greenhouseSlots: this.greenhouseSlots.map(slot => ({
                plant: slot.plant,
                startTime: slot.startTime
            })),
            exploreStartTime: this.exploreStartTime,
            purifyStartTime: this.purifyStartTime,
            recycleStartTime: this.recycleStartTime,
            chargeStartTime: this.chargeStartTime,
            lastRestTime: this.lastRestTime
        };
        localStorage.setItem('marsRebornSave', JSON.stringify(gameState));
    }

    loadGame() {
        const savedState = localStorage.getItem('marsRebornSave');
        if (savedState) {
            const gameState = JSON.parse(savedState);
            this.resources = gameState.resources;
            this.stamina = gameState.stamina;
            this.maxStamina = gameState.maxStamina;
            this.buildings = gameState.buildings || { powerStation: { level: 0 }, greenhouse: { level: 0 } };

            if (gameState.exploring) {
                this.exploring = true;
                this.exploreStartTime = gameState.exploreStartTime;
                const elapsed = Math.floor((Date.now() - this.exploreStartTime) / 1000);
                const remaining = this.exploreTime - elapsed;
                if (remaining > 0) {
                    this.updateExploreTimer();
                    this.exploreTimer = setInterval(() => this.updateExploreTimer(), 1000);
                    setTimeout(() => {
                        clearInterval(this.exploreTimer);
                        this.finishExploration();
                    }, remaining * 1000);
                } else {
                    this.finishExploration();
                }
            }

            if (gameState.purifying) {
                this.purifying = true;
                this.purifyStartTime = gameState.purifyStartTime;
                const elapsed = Math.floor((Date.now() - this.purifyStartTime) / 1000);
                const remaining = this.purifyTime - elapsed;
                if (remaining > 0) {
                    this.updatePurifyTimer();
                    this.purifyTimer = setInterval(() => this.updatePurifyTimer(), 1000);
                    setTimeout(() => {
                        clearInterval(this.purifyTimer);
                        this.finishPurifying();
                    }, remaining * 1000);
                } else {
                    this.finishPurifying();
                }
            }

            if (gameState.recycling) {
                this.recycling = true;
                this.recycleStartTime = gameState.recycleStartTime;
                const elapsed = Math.floor((Date.now() - this.recycleStartTime) / 1000);
                const remaining = this.recycleTime - elapsed;
                if (remaining > 0) {
                    this.updateRecycleTimer();
                    this.recycleTimer = setInterval(() => this.updateRecycleTimer(), 1000);
                    setTimeout(() => {
                        clearInterval(this.recycleTimer);
                        this.finishRecycling();
                    }, remaining * 1000);
                } else {
                    this.finishRecycling();
                }
            }

            if (gameState.charging) {
                this.charging = true;
                this.chargeStartTime = gameState.chargeStartTime;
                const elapsed = Math.floor((Date.now() - this.chargeStartTime) / 1000);
                const remaining = this.chargeTime - elapsed;
                if (remaining > 0) {
                    this.updateChargeTimer();
                    this.chargeTimer = setInterval(() => this.updateChargeTimer(), 1000);
                    setTimeout(() => {
                        clearInterval(this.chargeTimer);
                        this.finishCharging();
                    }, remaining * 1000);
                } else {
                    this.finishCharging();
                }
            }

            this.lastRestTime = gameState.lastRestTime;
            if (this.lastRestTime && (Date.now() - this.lastRestTime) < this.restCooldown * 1000) {
                this.resting = true;
                this.updateRestTimer();
                this.restTimer = setInterval(() => this.updateRestTimer(), 1000);
            }

            if (gameState.greenhouseSlots) {
                gameState.greenhouseSlots.forEach((slotData, index) => {
                    if (slotData.plant && slotData.startTime) {
                        const plant = slotData.plant;
                        const elapsed = Math.floor((Date.now() - slotData.startTime) / 1000);
                        const remaining = this.plants[plant].time - elapsed;
                        if (remaining > 0) {
                            this.greenhouseSlots[index].plant = plant;
                            this.greenhouseSlots[index].startTime = slotData.startTime;
                            this.greenhouseSlots[index].timer = setInterval(() => this.updateSlotTimer(index), 1000);
                            setTimeout(() => {
                                clearInterval(this.greenhouseSlots[index].timer);
                                this.finishGrowing(index);
                            }, remaining * 1000);
                        } else {
                            this.finishGrowing(index);
                        }
                    }
                });
            }

            if (this.buildings.greenhouse.level > 0) {
                const slotsElement = document.getElementById('greenhouse-slots');
                if (slotsElement) {
                    slotsElement.style.display = 'block';
                }
            }
        }
    }
}

const game = new Game();
game.start();

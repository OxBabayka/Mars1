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
            batteries: { charged: 0, empty: 5 } // 5 пустых батарей
        };
        this.stamina = 100;
        this.maxStamina = 100;

        // Здания
        this.buildings = {
            powerStation: { level: 0 }
        };

        // Состояния действий
        this.exploring = false;
        this.purifying = false;
        this.recycling = false;
        this.charging = false;
        this.resting = false;

        // Время действий (в секундах)
        this.exploreTime = 25;      // 25 секунд
        this.purifyTime = 7200;     // 2 часа
        this.recycleTime = 1800;    // 30 минут
        this.chargeTime = 39600;    // 11 часов
        this.restCooldown = 86400;  // 24 часа

        // Затраты и параметры
        this.exploreCost = 1;       // 1 стамина
        this.purifyCost = { ice: 20, stamina: 15, energy: 15 };
        this.recycleCost = { scrapMetal: 50, stamina: 10, energy: 10 };
        this.dischargeGain = 10;    // Разрядка даёт 10 энергии
        this.batteryBreakChance = 0.07; // 7% шанс поломки

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

    // Запуск игры
    start() {
        console.log('Игра запущена');
        this.loadGame();
        this.createMap();
        this.updateUI();
        setInterval(() => this.tick(), 1000);              // Обновление каждую секунду
        setInterval(() => this.regenStamina(), 300000);    // Регенерация стамины каждые 5 минут
        setInterval(() => this.saveGame(), 5000);          // Сохранение каждые 5 секунд
        this.initPlayerProfile();
        this.updateTimeSpent();
        this.timeSpentInterval = setInterval(() => this.updateTimeSpent(), 1000);
    }

    // Создание карты (10x10)
    createMap() {
        const mapGrid = document.querySelector('.map-grid');
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

    // Исследование окрестностей
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
            ice: Math.floor(Math.random() * 6),           // 0-5
            regolith: Math.floor(Math.random() * 6),      // 0-5
            sand: Math.floor(Math.random() * 6),          // 0-5
            scrapMetal: Math.floor(Math.random() * 6)     // 0-5
        };
    }

    // Очистка льда
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
        const sandGained = Math.floor(Math.random() * 4) + 2; // 2-5
        const regolithGained = Math.floor(Math.random() * 4) + 2; // 2-5
        this.resources.sand += sandGained;
        this.resources.regolith += regolithGained;
        this.updateUI();
        this.notify(`Очистка завершена!\nПолучено: Вода: 12, Песок: ${sandGained}, Реголит: ${regolithGained}`);
    }

    // Переработка металлолома
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

    // Зарядка батареи
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

    // Разрядка батареи
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

    // Отдых
    rest() {
        const now = Date.now();
        if (!this.lastRestTime || (now - this.lastRestTime) >= this.restCooldown * 1000) {
            this.stamina = Math.min(this.maxStamina, this.stamina + 15);
            this.lastRestTime = now;
            this.resting = true;
            this.updateRestTimer();
            this.restTimer = setInterval(() => this.updateRestTimer(), 1000);
            setTimeout(() => {
                clearInterval(this.restTimer);
                this.resting = false;
                this.notify('Отдых завершён. Выносливость восстановлена на 15.');
            }, 1000); // Уведомление через 1 секунду
            this.updateUI();
        } else {
            this.notify('Отдых пока недоступен. Дождитесь окончания кулдауна.');
        }
    }

    // Строительство/улучшение зданий
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

    // Обновление каждую секунду
    tick() {
        this.updateUI();
    }

    // Регенерация стамины
    regenStamina() {
        if (this.resources.food >= 0.5 && this.resources.water >= 0.5 && this.stamina < this.maxStamina) {
            this.stamina += 1;
            this.resources.food -= 0.5;
            this.resources.water -= 0.5;
            if (this.stamina > this.maxStamina) this.stamina = this.maxStamina;
            this.updateUI();
        }
    }

    // Обновление таймера исследования
    updateExploreTimer() {
        if (this.exploreStartTime) {
            const elapsed = Math.floor((Date.now() - this.exploreStartTime) / 1000);
            const remaining = this.exploreTime - elapsed;
            if (remaining >= 0) {
                document.getElementById('explore-progress').textContent = `Исследование: ${remaining} сек`;
            } else {
                document.getElementById('explore-progress').textContent = '';
            }
        }
    }

    // Обновление таймера очистки льда
    updatePurifyTimer() {
        if (this.purifyStartTime) {
            const elapsed = Math.floor((Date.now() - this.purifyStartTime) / 1000);
            const remaining = this.purifyTime - elapsed;
            if (remaining >= 0) {
                document.getElementById('purify-progress').textContent = `Очистка: ${Math.floor(remaining / 3600)} ч ${Math.floor((remaining % 3600) / 60)} мин`;
            } else {
                document.getElementById('purify-progress').textContent = '';
            }
        }
    }

    // Обновление таймера переработки
    updateRecycleTimer() {
        if (this.recycleStartTime) {
            const elapsed = Math.floor((Date.now() - this.recycleStartTime) / 1000);
            const remaining = this.recycleTime - elapsed;
            if (remaining >= 0) {
                document.getElementById('recycle-progress').textContent = `Переработка: ${Math.floor(remaining / 60)} мин`;
            } else {
                document.getElementById('recycle-progress').textContent = '';
            }
        }
    }

    // Обновление таймера зарядки
    updateChargeTimer() {
        if (this.chargeStartTime) {
            const elapsed = Math.floor((Date.now() - this.chargeStartTime) / 1000);
            const remaining = this.chargeTime - elapsed;
            if (remaining >= 0) {
                document.getElementById('charge-progress').textContent = `Зарядка: ${Math.floor(remaining / 3600)} ч ${Math.floor((remaining % 3600) / 60)} мин`;
            } else {
                document.getElementById('charge-progress').textContent = '';
            }
        }
    }

    // Обновление таймера отдыха
    updateRestTimer() {
        if (this.lastRestTime) {
            const elapsed = Math.floor((Date.now() - this.lastRestTime) / 1000);
            const remaining = this.restCooldown - elapsed;
            if (remaining > 0) {
                const hours = Math.floor(remaining / 3600);
                const minutes = Math.floor((remaining % 3600) / 60);
                const seconds = remaining % 60;
                document.getElementById('rest-timer').textContent = `До следующего отдыха: ${hours}ч ${minutes}м ${seconds}с`;
            } else {
                document.getElementById('rest-timer').textContent = 'Отдых доступен';
            }
        } else {
            document.getElementById('rest-timer').textContent = 'Отдых доступен';
        }
    }

    // Обновление интерфейса
    updateUI() {
        document.getElementById('stamina').textContent = `Стамина: ${this.stamina}/${this.maxStamina}`;
        document.getElementById('resource-energy').textContent = `Энергия: ${this.resources.energy}/${this.resources.maxEnergy}`;
        document.getElementById('resource-food').textContent = `Еда: ${this.resources.food.toFixed(1)}`;
        document.getElementById('resource-water').textContent = `Вода: ${this.resources.water.toFixed(1)}`;
        document.getElementById('resource-materials').textContent = `Материалы: ${this.resources.materials}`;
        document.getElementById('resource-ice').textContent = `Лёд: ${this.resources.ice}`;
        document.getElementById('resource-regolith').textContent = `Реголит: ${this.resources.regolith}`;
        document.getElementById('resource-sand').textContent = `Песок: ${this.resources.sand}`;
        document.getElementById('resource-scrapMetal').textContent = `Металлолом: ${this.resources.scrapMetal}`;
        document.getElementById('resource-batteries').textContent = `Батареи: ${this.resources.batteries.charged} заряженных, ${this.resources.batteries.empty} пустых`;

        document.getElementById('explore-button').disabled = this.exploring || this.stamina < this.exploreCost;
        document.getElementById('purify-ice-button').disabled = this.purifying || 
            this.resources.ice < this.purifyCost.ice || 
            this.stamina < this.purifyCost.stamina || 
            this.resources.energy < this.purifyCost.energy;
        document.getElementById('recycle-scrap-button').disabled = this.recycling || 
            this.resources.scrapMetal < this.recycleCost.scrapMetal || 
            this.stamina < this.recycleCost.stamina || 
            this.resources.energy < this.recycleCost.energy;
        document.getElementById('charge-battery-button').disabled = this.charging || this.resources.batteries.empty <= 0;
        document.getElementById('discharge-battery-button').disabled = this.resources.batteries.charged <= 0;
        document.getElementById('rest-button').disabled = this.resting || (this.lastRestTime && (Date.now() - this.lastRestTime) < this.restCooldown * 1000);

        // Обновление модального окна
        document.getElementById('power-station-level').textContent = this.buildings.powerStation.level;
    }

    // Уведомления
    notify(message) {
        const notifications = document.getElementById('notifications');
        notifications.textContent = message;
    }

    // Инициализация профиля игрока через Telegram
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
        profileInfo.innerHTML = `
            <img src="${userPhoto}" alt="Profile Photo">
            <span>${userName}</span>
        `;

        const joinDate = new Date(joinTime);
        document.getElementById('join-time').textContent = `Присоединился: ${joinDate.toLocaleString()}`;
    }

    // Обновление времени в игре
    updateTimeSpent() {
        const now = Date.now();
        const timeSpent = Math.floor((now - this.joinTime) / 1000);
        const hours = Math.floor(timeSpent / 3600);
        const minutes = Math.floor((timeSpent % 3600) / 60);
        const seconds = timeSpent % 60;
        document.getElementById('time-spent').textContent = `Время в игре: ${hours}ч ${minutes}м ${seconds}с`;
    }

    // Сохранение прогресса
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
            exploreStartTime: this.exploreStartTime,
            purifyStartTime: this.purifyStartTime,
            recycleStartTime: this.recycleStartTime,
            chargeStartTime: this.chargeStartTime,
            lastRestTime: this.lastRestTime
        };
        localStorage.setItem('marsRebornSave', JSON.stringify(gameState));
    }

    // Загрузка прогресса
    loadGame() {
        const savedState = localStorage.getItem('marsRebornSave');
        if (savedState) {
            const gameState = JSON.parse(savedState);
            this.resources = gameState.resources;
            this.stamina = gameState.stamina;
            this.maxStamina = gameState.maxStamina;
            this.buildings = gameState.buildings || { powerStation: { level: 0 } };

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
        }
    }
}

const game = new Game();
game.start();

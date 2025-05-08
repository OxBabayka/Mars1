class Game {
    constructor() {
        this.resources = {
            energy: 100,
            food: 50,
            water: 50,
            materials: 100,
            scrapMetal: 0,
            dirtyIce: 0,
            regolith: 0,
            sand: 0
        };
        this.stamina = 100;
        this.maxStamina = 100;
        this.exploring = false;
        this.purifying = false;
        this.recycling = false;
        this.exploreTime = 25;
        this.purifyTime = 7200;
        this.recycleTime = 1800;
        this.exploreCost = 3;
        this.purifyCost = 15;
        this.recycleCost = 10;
        this.exploreTimer = null;
        this.purifyTimer = null;
        this.recycleTimer = null;
        this.exploreStartTime = null;
        this.purifyStartTime = null;
        this.recycleStartTime = null;
        this.joinTime = null;
        this.timeSpentInterval = null;
    }

    start() {
        console.log('Game started');
        this.loadGame();
        this.createMap();
        this.updateUI();
        setInterval(() => this.tick(), 1000);
        setInterval(() => this.regenStamina(), 300000);
        setInterval(() => this.consumeFoodWater(), 300000);
        setInterval(() => this.saveGame(), 5000);
        this.initPlayerProfile();
        this.updateTimeSpent();
        this.timeSpentInterval = setInterval(() => this.updateTimeSpent(), 1000);
    }

    createMap() {
        const mapGrid = document.querySelector('.map-grid');
        mapGrid.innerHTML = '';
        for (let i = 0; i < 100; i++) {
            const cell = document.createElement('div');
            cell.classList.add('map-cell');
            cell.addEventListener('click', () => this.exploreCell(i));
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
        const resourcesFound = this.generateResources();
        this.resources.scrapMetal += resourcesFound.scrapMetal;
        this.resources.dirtyIce += resourcesFound.dirtyIce;
        this.resources.regolith += resourcesFound.regolith;
        this.resources.sand += resourcesFound.sand;
        this.updateUI();
        this.notify(`Исследование завершено!\nПолучено:\n- Металлолом: ${resourcesFound.scrapMetal}\n- Грязный лёд: ${resourcesFound.dirtyIce}\n- Реголит: ${resourcesFound.regolith}\n- Песок: ${resourcesFound.sand}`);
    }

    generateResources() {
        return {
            scrapMetal: Math.floor(Math.random() * 5),
            dirtyIce: Math.floor(Math.random() * 5),
            regolith: Math.floor(Math.random() * 5),
            sand: Math.floor(Math.random() * 5)
        };
    }

    purifyIce() {
        if (!this.purifying && this.resources.dirtyIce >= 1 && this.resources.energy >= this.purifyCost) {
            this.purifying = true;
            this.resources.dirtyIce -= 1;
            this.resources.energy -= this.purifyCost;
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
        this.resources.water += 5;
        this.updateUI();
        this.notify('Очистка завершена! Получено: 5 воды');
    }

    recycleScrap() {
        if (!this.recycling && this.resources.scrapMetal >= 1 && this.resources.energy >= this.recycleCost) {
            this.recycling = true;
            this.resources.scrapMetal -= 1;
            this.resources.energy -= this.recycleCost;
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
        this.resources.materials += 3;
        this.updateUI();
        this.notify('Переработка завершена! Получено: 3 материала');
    }

    tick() {
        this.updateUI();
    }

    regenStamina() {
        if (this.stamina < this.maxStamina && this.resources.food >= 1 && this.resources.water >= 1) {
            this.stamina = Math.min(this.maxStamina, this.stamina + 10);
            this.resources.food -= 1;
            this.resources.water -= 1;
            this.updateUI();
        }
    }

    consumeFoodWater() {
        if (this.resources.food > 0 && this.resources.water > 0) {
            this.resources.food -= 1;
            this.resources.water -= 1;
        } else {
            this.stamina -= 10;
            if (this.stamina < 0) this.stamina = 0;
            this.notify('Недостаток еды или воды! Выносливость уменьшается.');
        }
        this.updateUI();
    }

    updateExploreTimer() {
        if (this.exploreStartTime) {
            const elapsed = Math.floor((Date.now() - this.exploreStartTime) / 1000);
            const remaining = this.exploreTime - elapsed;
            if (remaining >= 0) {
                document.getElementById('explore-timer').textContent = `Исследование: ${remaining} сек`;
            } else {
                document.getElementById('explore-timer').textContent = '';
            }
        }
    }

    updatePurifyTimer() {
        if (this.purifyStartTime) {
            const elapsed = Math.floor((Date.now() - this.purifyStartTime) / 1000);
            const remaining = this.purifyTime - elapsed;
            if (remaining >= 0) {
                const hours = Math.floor(remaining / 3600);
                const minutes = Math.floor((remaining % 3600) / 60);
                const seconds = remaining % 60;
                document.getElementById('purify-timer').textContent = `Очистка: ${hours}ч ${minutes}м ${seconds}с`;
            } else {
                document.getElementById('purify-timer').textContent = '';
            }
        }
    }

    updateRecycleTimer() {
        if (this.recycleStartTime) {
            const elapsed = Math.floor((Date.now() - this.recycleStartTime) / 1000);
            const remaining = this.recycleTime - elapsed;
            if (remaining >= 0) {
                const minutes = Math.floor(remaining / 60);
                const seconds = remaining % 60;
                document.getElementById('recycle-timer').textContent = `Переработка: ${minutes}м ${seconds}с`;
            } else {
                document.getElementById('recycle-timer').textContent = '';
            }
        }
    }

    updateUI() {
        document.getElementById('stamina').textContent = `Выносливость: ${this.stamina}/${this.maxStamina}`;
        document.getElementById('food').textContent = `Еда: ${this.resources.food}`;
        document.getElementById('water').textContent = `Вода: ${this.resources.water}`;
        document.getElementById('resources').innerHTML = `
            <h2>Ресурсы</h2>
            <p>Энергия: ${this.resources.energy}</p>
            <p>Материалы: ${this.resources.materials}</p>
            <p>Металлолом: ${this.resources.scrapMetal}</p>
            <p>Грязный лёд: ${this.resources.dirtyIce}</p>
            <p>Реголит: ${this.resources.regolith}</p>
            <p>Песок: ${this.resources.sand}</p>
        `;
        document.getElementById('explore-button').disabled = this.exploring || this.stamina < this.exploreCost;
        document.getElementById('purify-ice-button').disabled = this.purifying || this.resources.dirtyIce < 1 || this.resources.energy < this.purifyCost;
        document.getElementById('recycle-scrap-button').disabled = this.recycling || this.resources.scrapMetal < 1 || this.resources.energy < this.recycleCost;
    }

    notify(message) {
        const notifications = document.getElementById('notifications');
        notifications.textContent = message;
    }

    initPlayerProfile() {
        let userName = 'Неизвестный игрок';
        let userPhoto = 'https://via.placeholder.com/50';
        let joinTime = localStorage.getItem('joinTime');

        // Проверка Telegram Web App
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
            const user = window.Telegram.WebApp.initDataUnsafe.user;
            if (user) {
                userName = `${user.first_name} ${user.last_name || ''}`.trim();
                userPhoto = user.photo_url || 'https://via.placeholder.com/50';
            }
        } else {
            console.log('Запуск вне Telegram: используется заглушка для профиля');
        }

        // Установка времени присоединения
        if (!joinTime) {
            joinTime = Date.now();
            localStorage.setItem('joinTime', joinTime);
        } else {
            joinTime = parseInt(joinTime, 10);
        }
        this.joinTime = joinTime;

        // Обновление UI профиля
        const profileInfo = document.getElementById('profile-info');
        profileInfo.innerHTML = `
            <img src="${userPhoto}" alt="Profile Photo">
            <span>${userName}</span>
        `;

        const joinDate = new Date(joinTime);
        document.getElementById('join-time').textContent = `Присоединился: ${joinDate.toLocaleString()}`;
    }

    updateTimeSpent() {
        const now = Date.now();
        const timeSpent = Math.floor((now - this.joinTime) / 1000);
        const hours = Math.floor(timeSpent / 3600);
        const minutes = Math.floor((timeSpent % 3600) / 60);
        const seconds = timeSpent % 60;
        document.getElementById('time-spent').textContent = `Время в игре: ${hours}ч ${minutes}м ${seconds}с`;
    }

    saveGame() {
        const gameState = {
            resources: this.resources,
            stamina: this.stamina,
            maxStamina: this.maxStamina,
            exploring: this.exploring,
            purifying: this.purifying,
            recycling: this.recycling,
            exploreStartTime: this.exploreStartTime,
            purifyStartTime: this.purifyStartTime,
            recycleStartTime: this.recycleStartTime
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
        }
    }
}

const game = new Game();
game.start();
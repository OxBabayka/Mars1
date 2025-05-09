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
        this.resting = false;
        this.exploreTime = 25;
        this.purifyTime = 7200;
        this.recycleTime = 1800;
        this.restTime = 43200; // 12 часов
        this.exploreCost = 3;
        this.purifyCost = { dirtyIce: 20, stamina: 15, energy: 15 };
        this.recycleCost = { scrapMetal: 50, stamina: 10, energy: 10 };
        this.restCost = { stamina: 15 };
        this.exploreTimer = null;
        this.purifyTimer = null;
        this.recycleTimer = null;
        this.restTimer = null;
        this.exploreStartTime = null;
        this.purifyStartTime = null;
        this.recycleStartTime = null;
        this.restStartTime = null;
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
        const resourcesFound = this.generateResources();
        let foundMessage = 'Исследование завершено!\nПолучено:\n';
        let hasResources = false;

        if (resourcesFound.scrapMetal > 0) {
            this.resources.scrapMetal += resourcesFound.scrapMetal;
            foundMessage += `- Металлолом: ${resourcesFound.scrapMetal}\n`;
            hasResources = true;
        }
        if (resourcesFound.dirtyIce > 0) {
            this.resources.dirtyIce += resourcesFound.dirtyIce;
            foundMessage += `- Грязный лёд: ${resourcesFound.dirtyIce}\n`;
            hasResources = true;
        }
        if (resourcesFound.regolith > 0) {
            this.resources.regolith += resourcesFound.regolith;
            foundMessage += `- Реголит: ${resourcesFound.regolith}\n`;
            hasResources = true;
        }
        if (resourcesFound.sand > 0) {
            this.resources.sand += resourcesFound.sand;
            foundMessage += `- Песок: ${resourcesFound.sand}\n`;
            hasResources = true;
        }

        if (!hasResources) {
            foundMessage += 'Ничего не найдено';
        }

        this.updateUI();
        this.notify(foundMessage);
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
        if (!this.purifying &&
            this.resources.dirtyIce >= this.purifyCost.dirtyIce &&
            this.stamina >= this.purifyCost.stamina &&
            this.resources.energy >= this.purifyCost.energy) {
            this.purifying = true;
            this.resources.dirtyIce -= this.purifyCost.dirtyIce;
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
        this.notify(`Очистка завершена!\nПолучено: 12 воды, ${sandGained} песка, ${regolithGained} реголита`);
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
        this.notify('Переработка завершена!\nПолучено: 30 материалов');
    }

    rest() {
        if (!this.resting) {
            this.resting = true;
            this.stamina = Math.min(this.maxStamina, this.stamina + 15);
            this.restStartTime = Date.now();
            this.updateRestTimer();
            this.restTimer = setInterval(() => this.updateRestTimer(), 1000);
            setTimeout(() => {
                clearInterval(this.restTimer);
                this.resting = false;
                this.notify('Отдых завершён. Выносливость восстановлена на 15.');
            }, this.restTime * 1000);
            this.updateUI();
        }
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
                const progress = (elapsed / this.purifyTime) * 100;
                document.getElementById('purify-progress').innerHTML = `<div style="width: ${progress}%"></div>`;
            } else {
                document.getElementById('purify-progress').innerHTML = '<div></div>';
            }
        }
    }

    updateRecycleTimer() {
        if (this.recycleStartTime) {
            const elapsed = Math.floor((Date.now() - this.recycleStartTime) / 1000);
            const remaining = this.recycleTime - elapsed;
            if (remaining >= 0) {
                const progress = (elapsed / this.recycleTime) * 100;
                document.getElementById('recycle-progress').innerHTML = `<div style="width: ${progress}%"></div>`;
            } else {
                document.getElementById('recycle-progress').innerHTML = '<div></div>';
            }
        }
    }

    updateRestTimer() {
        if (this.restStartTime) {
            const elapsed = Math.floor((Date.now() - this.restStartTime) / 1000);
            const remaining = this.restTime - elapsed;
            if (remaining >= 0) {
                const hours = Math.floor(remaining / 3600);
                const minutes = Math.floor((remaining % 3600) / 60);
                const seconds = remaining % 60;
                document.getElementById('rest-timer').textContent = `До следующего отдыха: ${hours}ч ${minutes}м ${seconds}с`;
            } else {
                document.getElementById('rest-timer').textContent = '';
            }
        }
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
            this.notify('Недостаток еды или воды!\nВыносливость уменьшается.');
        }
        this.updateUI();
    }

    updateUI() {
        document.getElementById('stamina').textContent = `Выносливость: ${this.stamina}/${this.maxStamina}`;
        document.getElementById('resource-energy').textContent = `Энергия: ${this.resources.energy}`;
        document.getElementById('resource-food').textContent = `Еда: ${this.resources.food}`;
        document.getElementById('resource-water').textContent = `Вода: ${this.resources.water}`;
        document.getElementById('resource-materials').textContent = `Материалы: ${this.resources.materials}`;
        document.getElementById('resource-scrapMetal').textContent = `Металлолом: ${this.resources.scrapMetal}`;
        document.getElementById('resource-dirtyIce').textContent = `Грязный лёд: ${this.resources.dirtyIce}`;
        document.getElementById('resource-regolith').textContent = `Реголит: ${this.resources.regolith}`;
        document.getElementById('resource-sand').textContent = `Песок: ${this.resources.sand}`;
        document.getElementById('explore-button').disabled = this.exploring || this.stamina < this.exploreCost;
        document.getElementById('purify-ice-button').disabled = this.purifying || 
            this.resources.dirtyIce < this.purifyCost.dirtyIce || 
            this.stamina < this.purifyCost.stamina || 
            this.resources.energy < this.purifyCost.energy;
        document.getElementById('recycle-scrap-button').disabled = this.recycling || 
            this.resources.scrapMetal < this.recycleCost.scrapMetal || 
            this.stamina < this.recycleCost.stamina || 
            this.resources.energy < this.recycleCost.energy;
        document.getElementById('rest-button').disabled = this.resting;
    }

    notify(message) {
        const notifications = document.getElementById('notifications');
        notifications.textContent = message;
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
            resting: this.resting,
            exploreStartTime: this.exploreStartTime,
            purifyStartTime: this.purifyStartTime,
            recycleStartTime: this.recycleStartTime,
            restStartTime: this.restStartTime
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
            this.resting = gameState.resting;

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

            if (gameState.resting) {
                this.resting = true;
                this.restStartTime = gameState.restStartTime;
                const elapsed = Math.floor((Date.now() - this.restStartTime) / 1000);
                const remaining = this.restTime - elapsed;
                if (remaining > 0) {
                    this.updateRestTimer();
                    this.restTimer = setInterval(() => this.updateRestTimer(), 1000);
                    setTimeout(() => {
                        clearInterval(this.restTimer);
                        this.resting = false;
                        this.notify('Отдых завершён. Выносливость восстановлена на 15.');
                    }, remaining * 1000);
                } else {
                    this.resting = false;
                    this.notify('Отдых завершён. Выносливость восстановлена на 15.');
                }
            }
        }
    }
}

const game = new Game();
game.start();

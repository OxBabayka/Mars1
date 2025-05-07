class Game {
    constructor() {
        this.resources = {
            energy: 100,
            water: 100,
            food: 100,
            materials: 100,
            ice: 0,
            dirtyIce: 0,
            heavyWater: 0
        };
        this.stamina = 100;
        this.maxStamina = 100;
        this.food = 50;
        this.water = 50;
        this.exploring = false;
        this.exploreTime = 25; // 25 секунд
        this.exploreCost = 3; // 3 стамины
        this.exploreChance = 0.45; // 45% шанс найти ресурсы
        this.exploreTimer = null;
        this.exploreStartTime = null;
    }

    start() {
        console.log('Game started');
        this.createMap();
        this.updateUI();
        setInterval(() => this.tick(), 1000); // Обновление каждую секунду
        setInterval(() => this.regenStamina(), 300000); // Регенерация стамины каждые 5 минут
        setInterval(() => this.consumeFoodWater(), 300000); // Расход еды и воды каждые 5 минут
    }

    createMap() {
        const mapGrid = document.querySelector('.map-grid');
        for (let i = 0; i < 100; i++) {
            const cell = document.createElement('div');
            cell.classList.add('map-cell');
            cell.addEventListener('click', () => this.selectCell(i));
            mapGrid.appendChild(cell);
        }
    }

    selectCell(index) {
        console.log(`Выбрана клетка ${index}`);
    }

    tick() {
        // Убрана генерация ресурсов от зданий
        this.updateUI();
    }

    regenStamina() {
        if (this.food >= 0.5 && this.water >= 0.5 && this.stamina < this.maxStamina) {
            this.stamina += 1;
            if (this.stamina > this.maxStamina) this.stamina = this.maxStamina;
            this.updateUI();
        }
    }

    consumeFoodWater() {
        if (this.food >= 0.5 && this.water >= 0.5) {
            this.food -= 0.5;
            this.water -= 0.5;
        } else {
            console.log('Недостаточно еды или воды для регенерации стамины');
        }
        this.updateUI();
    }

    exploreSurface() {
        if (this.exploring) {
            console.log('Уже исследуется');
            return;
        }
        if (this.stamina < this.exploreCost) {
            console.log('Недостаточно стамины для исследования');
            return;
        }
        this.stamina -= this.exploreCost;
        this.exploring = true;
        this.exploreStartTime = Date.now();
        console.log('Начато исследование поверхности');
        this.updateExploreTimer();
        this.exploreTimer = setInterval(() => this.updateExploreTimer(), 1000);
        setTimeout(() => {
            clearInterval(this.exploreTimer);
            this.finishExploration();
        }, this.exploreTime * 1000);
    }

    updateExploreTimer() {
        const elapsed = Math.floor((Date.now() - this.exploreStartTime) / 1000);
        const remaining = this.exploreTime - elapsed;
        if (remaining > 0) {
            document.getElementById('explore-timer').textContent = `Исследование завершится через ${remaining} сек.`;
        } else {
            document.getElementById('explore-timer').textContent = '';
        }
    }

    finishExploration() {
        this.exploring = false;
        let notification = '';
        if (Math.random() < this.exploreChance) {
            const resources = ['ice', 'dirtyIce', 'heavyWater'];
            const resource = resources[Math.floor(Math.random() * resources.length)];
            const amount = Math.floor(Math.random() * 10) + 1;
            this.resources[resource] += amount;
            notification = `Найдено: ${resource} x${amount}`;
        } else {
            notification = 'Ничего не найдено';
        }
        document.getElementById('notifications').textContent = notification;
        this.updateUI();
    }

    updateUI() {
        document.getElementById('resources').innerHTML = `
            <h2>Ресурсы</h2>
            <p>Энергия: ${this.resources.energy}</p>
            <p>Вода: ${this.resources.water}</p>
            <p>Пища: ${this.resources.food}</p>
            <p>Материалы: ${this.resources.materials}</p>
            <p>Лёд: ${this.resources.ice}</p>
            <p>Грязный лёд: ${this.resources.dirtyIce}</p>
            <p>Тяжёлая вода: ${this.resources.heavyWater}</p>
        `;
        document.getElementById('stamina').textContent = `Стамина: ${this.stamina}/${this.maxStamina}`;
        document.getElementById('food').textContent = `Еда: ${this.food}`;
        document.getElementById('water').textContent = `Вода: ${this.water}`;
    }
}
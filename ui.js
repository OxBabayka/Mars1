document.getElementById('explore-button').addEventListener('click', () => game.exploreCell(0));
document.getElementById('purify-ice-button').addEventListener('click', () => game.purifyIce());
document.getElementById('recycle-scrap-button').addEventListener('click', () => game.recycleScrap());
document.getElementById('charge-battery-button').addEventListener('click', () => game.chargeBattery());
document.getElementById('discharge-battery-button').addEventListener('click', () => game.dischargeBattery());
document.getElementById('rest-button').addEventListener('click', () => game.rest());

// Модальное окно
const modal = document.getElementById('building-modal');
document.getElementById('build-button').addEventListener('click', () => {
    modal.style.display = 'flex';
    game.updateUI();
});
document.getElementById('close-modal').addEventListener('click', () => {
    modal.style.display = 'none';
});
document.getElementById('build-power-station').addEventListener('click', () => {
    game.buildPowerStation();
});

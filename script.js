const tg = window.Telegram.WebApp;
tg.ready();

const user = tg.initDataUnsafe.user;
const username = user ? user.username : 'колонист';

document.querySelector('h1').innerText = `Добро пожаловать на Марс, ${username}!`;

let resources = 0;

function buildBuilding() {
    resources += 10;
    document.getElementById('resources').innerText = `Ресурсы: ${resources}`;
}
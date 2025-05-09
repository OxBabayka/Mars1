// Управление действиями
document.getElementById('explore-button').addEventListener('click', () => game.exploreCell(0));
document.getElementById('purify-ice-button').addEventListener('click', () => game.purifyIce());
document.getElementById('recycle-scrap-button').addEventListener('click', () => game.recycleScrap());
document.getElementById('rest-button').addEventListener('click', () => game.rest());

// Управление навигацией
const navButtons = document.querySelectorAll('.nav-button');
const sections = document.querySelectorAll('.section');

navButtons.forEach(button => {
    button.addEventListener('click', () => {
        navButtons.forEach(btn => btn.classList.remove('active'));
        sections.forEach(section => section.classList.remove('active'));

        button.classList.add('active');
        const sectionId = button.id.replace('nav-', '') + '-section';
        document.getElementById(sectionId).classList.add('active');
    });
});

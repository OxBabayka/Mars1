document.addEventListener('DOMContentLoaded', () => {
    console.log('Million on Europa is starting...');
    const game = new Game();
    game.start();
    setupExploreButton(game);
});


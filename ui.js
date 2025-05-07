function setupExploreButton(game) {
    const exploreButton = document.getElementById('explore-button');
    exploreButton.addEventListener('click', () => game.exploreSurface());
}


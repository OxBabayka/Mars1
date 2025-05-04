let resources = 0;

function buildBuilding() {
    resources += 10;
    document.getElementById('resources').innerText = `Ресурсы: ${resources}`;
}
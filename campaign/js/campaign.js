import { CMlevels } from './maps.js';
import { CampaignCamera } from './camera.js';
import { Movement } from './movement.js';

const canvas = document.getElementById("campaign");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const tileS = 100;  ////////////////// ROZMIAR KLATKI ////////////////////


let currentLevelIndex = 0;
let levelData = CMlevels[currentLevelIndex];
let map = levelData.grid;

let player = { x: 0, y: 0, pixelX: 0, pixelY: 0 };
let movement = new Movement(player, map, tileS);

// Важно: объявляем камеру через let, чтобы её можно было перезаписать
let camera = new CampaignCamera(canvas.width, canvas.height, map[0].length * tileS, map.length * tileS);

// Флаг, чтобы телепорт не срабатывал каждый кадр
let isTeleporting = false;

function initLevel(index, spawnX = null, spawnY = null) {
    currentLevelIndex = index;
    levelData = CMlevels[currentLevelIndex];
    map = levelData.grid;

    if (spawnX !== null && spawnY !== null) {
        // Если указаны координаты (при переходе)
        player.pixelX = spawnX * tileS;
        player.pixelY = spawnY * tileS;
    } else {
        // Стандартный поиск спавна (цифра 3)
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                if (map[y][x] === 3) {
                    player.pixelX = x * tileS;
                    player.pixelY = y * tileS;
                }
            }
        }
    }
    
    // КРИТИЧЕСКИЙ МОМЕНТ: Обновляем карту в движении и ПОЛНОСТЬЮ пересоздаем камеру
    movement.map = map;
    camera = new CampaignCamera(
        canvas.width, 
        canvas.height, 
        map[0].length * tileS, 
        map.length * tileS
    );
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    movement.update();
    camera.update(player.pixelX, player.pixelY);
    
    /////////////////// ЛОГИКА ТЕЛЕПОРТАЦИИ ///////////////////
    let gridX = Math.floor((player.pixelX + tileS / 2) / tileS);
    let gridY = Math.floor((player.pixelY + tileS / 2) / tileS);
    
    if (map[gridY] && map[gridY][gridX] >= 4 && !isTeleporting) {
        const portal = levelData.portals[map[gridY][gridX]];
        if (portal) {
            isTeleporting = true;
            initLevel(portal.targetLevel, portal.targetX, portal.targetY);
            setTimeout(() => { isTeleporting = false; }, 500);
            requestAnimationFrame(draw);
            return; 
        }
    }

    //////////////////////////////////////////////////////////

    ctx.save();
    ctx.translate(Math.floor(-camera.x), Math.floor(-camera.y));

    // РИСУЕМ КАРТУ
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (map[y][x] === 1) {
                ctx.fillStyle = "#333"; ////////////////////// SCIANY
            } else if (map[y][x] >= 4) {
                ctx.fillStyle = "blue";  ////////////////////// PORTAL
            } else {
                ctx.fillStyle = "#eee"; ////////////////////// PODLOGA
            }
            // Рисуем ровно размер в размер
            ctx.fillRect(x * tileS, y * tileS, tileS, tileS);
        }
    }

    /////////////// DRAW PLAYER /////////////
    ctx.fillStyle = "red";
    
    // Чтобы кубик не "залезал" на стены, мы рисуем его 
    // ровно по границам его хитбокса (используем margin из движения)
    const m = movement.margin; 
    ctx.fillRect(
        Math.floor(player.pixelX) + m, 
        Math.floor(player.pixelY) + m, 
        tileS - m * 2, 
        tileS - m * 2
    );

    ctx.restore();
    requestAnimationFrame(draw);
}

// Запускаем через новую функцию инициализации
initLevel(0);
draw();
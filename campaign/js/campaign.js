import { CMlevels } from './maps.js'; 
import { CampaignCamera } from './camera.js';     ///////////////// IMPORTUJEMY CO NAM TRZEBA Z INNYCH PLIKOW /////////////////
import { Movement } from './movement.js';
import { Inventory } from './inventory.js';  
import { Player } from './animate.js';

const canvas = document.getElementById("campaign");
const ctx = canvas.getContext("2d");

let keys = {}; ///////////////// PRZECHOWYWANIE NACISNIETYCH KLAWISZY /////////////////

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const tileS = 100;  //////////////////// ROZMIAR KLATKI //////////////////////

let player = { x: 0, y: 0, pixelX: 0, pixelY: 0 }; //////////////////// DANE POZYCJI GRACZA ////////////////////
let playerVisual = new Player(tileS); //////////////////// WIZUALIZACJA I ANIMACJA ////////////////////

let currentLevelIndex = 0;
let levelData = CMlevels[currentLevelIndex];
let map = levelData.grid;

let movement = new Movement(player, map, tileS);

////////////////////// INICJALIZUJEMY INWENTARZ /////////////////////
const inventory = new Inventory(canvas, ctx);

let camera = new CampaignCamera(canvas.width, canvas.height, map[0].length * tileS, map.length * tileS);

let isTeleporting = false;

///////////////// NACISNIENIE KLAWISZY /////////////////
window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true; ///////////////// REJESTRACJA NACISNIECIA /////////////////
    
    if (key === "e" || key === "у") {
        if (inventory.currentChest) {
            inventory.currentChest = null;
        } else if (!inventory.isOpen) {
            checkChestInteraction();
        }
    }

    if (key === "f" || key === "а") {
        if (!inventory.currentChest) { 
            inventory.isOpen = !inventory.isOpen;
        }
    }
});

///////////////// ZWOLNIENIE KLAWISZY /////////////////
window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false; ///////////////// REJESTRACJA PUSZCZENIA /////////////////
});

function checkChestInteraction() {
    let centerX = Math.floor((player.pixelX + tileS / 2) / tileS);
    let centerY = Math.floor((player.pixelY + tileS / 2) / tileS);

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            let gridX = centerX + dx;
            let gridY = centerY + dy;

            if (map[gridY] && map[gridY][gridX] === 2) {
                const chestKey = `${gridX},${gridY}`;
                if (levelData.chests && levelData.chests[chestKey]) {
                    inventory.currentChest = { key: chestKey, items: levelData.chests[chestKey] };
                    return;
                }
            }
        }
    }
}

function initLevel(index, spawnX = null, spawnY = null) {
    currentLevelIndex = index;
    levelData = CMlevels[currentLevelIndex];
    map = levelData.grid;

    if (spawnX !== null && spawnY !== null) {
        player.pixelX = spawnX * tileS;
        player.pixelY = spawnY * tileS;
    } else {
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                if (map[y][x] === 3) {
                    player.pixelX = x * tileS;
                    player.pixelY = y * tileS;
                }
            }
        }
    }
    
    movement.map = map;
    camera = new CampaignCamera(canvas.width, canvas.height, map[0].length * tileS, map.length * tileS);
}

function draw() {   //////////////////////////////////////////////////////// FUNKCJA DRAW \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    /////////////////// BLOKUJEMY RUCH JESLI UI OTWARTE ///////////////////
    if (!inventory.isUIActive()) {
        movement.keys = keys; ////////////////// PRZEKAZUJEMY KLAWISZE DO RUCHU //////////////////
        movement.update();
        playerVisual.updateAnimation(keys); //////////////////// AKTUALIZACJA KLATEK ANIMACJI ////////////////////
    }
    
    camera.update(player.pixelX, player.pixelY);
    
    // Проверка портала (улучшенная)
    let gridX = Math.floor((player.pixelX + tileS / 2) / tileS);
    let gridY = Math.floor((player.pixelY + tileS / 2) / tileS);
    
    if (map[gridY] && map[gridY][gridX] >= 4 && !isTeleporting) {
        const portal = levelData.portals[map[gridY][gridX]];
        if (portal) {
            isTeleporting = true;
            console.log("Teleporting to:", portal.targetLevel);
            initLevel(portal.targetLevel, portal.targetX, portal.targetY);
            
            // Ждем чуть-чуть перед тем как разрешить новый переход, чтобы не кидало туда-сюда
            setTimeout(() => { isTeleporting = false; }, 1000);
            
            // Просто выходим из текущего кадра, следующий отрисует уже новую карту
            requestAnimationFrame(draw);
            return; 
        }
    }

    ctx.save();
    ctx.translate(Math.floor(-camera.x), Math.floor(-camera.y));

    /////////////////// RYSOWANIE MAPY ////////////////////
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (map[y][x] === 1) {
                ctx.fillStyle = "#333";
            } else if (map[y][x] === 2) {
                ctx.fillStyle = "orange";
            } else if (map[y][x] >= 4) {
                ctx.fillStyle = "blue";
            } else {
                ctx.fillStyle = "#eee";
            }
            ctx.fillRect(x * tileS, y * tileS, tileS, tileS);
        }
    }

    ////////////////// RYSOWANIE ANIMOWANEGO GRACZA /////////////////
    playerVisual.draw(ctx, player.pixelX, player.pixelY); 

    ctx.restore();

    ////////////////// RYSOWANIE UI //////////////////
    inventory.draw();

    requestAnimationFrame(draw);
}

initLevel(0);
draw();
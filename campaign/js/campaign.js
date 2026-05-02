import { CMlevels } from './maps.js'; 
import { CampaignCamera } from './camera.js';     ///////////////// IMPORTUJEMY CO NAM TRZEBA Z INNYCH PLIKOW /////////////////
import { Movement } from './movement.js';
import { Inventory } from './inventory.js'; 

const canvas = document.getElementById("campaign");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const tileS = 100;  //////////////////// ROZMIAR KLATKI //////////////////////

let currentLevelIndex = 0;
let levelData = CMlevels[currentLevelIndex];
let map = levelData.grid;

let player = { x: 0, y: 0, pixelX: 0, pixelY: 0 };
let movement = new Movement(player, map, tileS);

////////////////////// INICJALIZUJEMY INWENTARZ /////////////////////
const inventory = new Inventory(canvas, ctx);

let camera = new CampaignCamera(canvas.width, canvas.height, map[0].length * tileS, map.length * tileS);

let isTeleporting = false;

///////////////// NACISNIENIE KLAWISZY /////////////////
window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    
    ////////////////// WZAIMODZIALANIE (E) /////////////////
    if (key === "e" || key === "у") {
        if (inventory.currentChest) {
            inventory.currentChest = null;
        } else if (!inventory.isOpen) {
            checkChestInteraction();
        }
    }

    ////////////////// INVENTARZ (F) /////////////////
    if (key === "f" || key === "а") {
        if (!inventory.currentChest) { 
            inventory.isOpen = !inventory.isOpen;
        }
    }
});

function checkChestInteraction() {
    
    let centerX = Math.floor((player.pixelX + tileS / 2) / tileS);   ////////////////// SPRAWDZAMY GDZIE TERAZ JEST GRACZ /////////////////
    let centerY = Math.floor((player.pixelY + tileS / 2) / tileS);

    ////////////////// SPRAWDZAMY SASIEDNIE POLA (3x3) ////////////////////
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            let gridX = centerX + dx;
            let gridY = centerY + dy;

            //////////////////// SPRAWDZAMY CZY TO SKRZYNIA (ID 2) ///////////////////
            if (map[gridY] && map[gridY][gridX] === 2) {
                const chestKey = `${gridX},${gridY}`;
                
                //////////////////// SPRAWDZAMY DANE SKRZYNI W LEVELU /////////////////
                if (levelData.chests && levelData.chests[chestKey]) {
                    inventory.currentChest = {
                        key: chestKey,
                        items: levelData.chests[chestKey]
                    };
                    return; ////////////////////// ZNALEZIONO NAJBLIŻSZĄ SKRZYNIĘ /////////////////
                }
            }
        }
    }
}

function initLevel(index, spawnX = null, spawnY = null) {
    currentLevelIndex = index;
    levelData = CMlevels[currentLevelIndex];
    map = levelData.grid;

    ////////////////// USTAWIENIE SPAWNU /////////////////
    if (spawnX !== null && spawnY !== null) {
        player.pixelX = spawnX * tileS;
        player.pixelY = spawnY * tileS;
    } else {
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                ////////////////// SZUKAMY TILE SPAWNU (ID 3) /////////////////
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

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    /////////////////// BLOKUJEMY RUCH JESLI UI OTWARTE ///////////////////
    if (!inventory.isUIActive()) {
        movement.update();
    }
    
    camera.update(player.pixelX, player.pixelY);
    
    let gridX = Math.floor((player.pixelX + tileS / 2) / tileS);
    let gridY = Math.floor((player.pixelY + tileS / 2) / tileS);
    
    ////////////////// TELEPORTY /////////////////
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

    ////////////////// GRACZ /////////////////
    ctx.fillStyle = "red";
    const m = movement.margin; 
    ctx.fillRect(
        Math.floor(player.pixelX) + m, 
        Math.floor(player.pixelY) + m, 
        tileS - m * 2, 
        tileS - m * 2
    );

    ctx.restore();

    ////////////////// RYSOWANIE UI (INWENTARZ + SKRZYNIE) //////////////////
    inventory.draw();

    requestAnimationFrame(draw);
}

initLevel(0);
draw();
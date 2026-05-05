import { CMlevels } from './maps.js'; 
import { CampaignCamera } from './camera.js';     ///////////////// IMPORTUJEMY CO NAM TRZEBA Z INNYCH PLIKOW /////////////////
import { Movement } from './movement.js';
import { Inventory } from './inventory.js';  
import { Player } from './animate.js';
import { Enemy } from './enemies.js';
import { Pause } from './pause.js'; // Импортируем новый класс

const canvas = document.getElementById("campaign");
const ctx = canvas.getContext("2d");

let keys = {}; ///////////////// PRZECHOWYWANIE NACISNIETYCH KLAWISZY /////////////////

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const tileS = 90;  //////////////////// ROZMIAR KLATKI //////////////////////

let player = { x: 0, y: 0, pixelX: 0, pixelY: 0 }; //////////////////// DANE POZYCJI GRACZA ////////////////////
let playerVisual = new Player(tileS); //////////////////// WIZUALIZACJA I ANIMACJA ////////////////////

////////////////////////// HEARTS SYSTEM ////////////////
let playerHealth = 3; 
let isInvulnerable = false; ///// NIEZNISZCZALNOSC PO UDERZENIU /////

const heartImage = new Image();
heartImage.src = '../pictures/heart.png';

//////////////// DEAD SYSTEM /////////////////
let isDead = false;
let deathAlpha = 0; //// dead screen opacity ////
const deathImage = new Image();
deathImage.src = '../pictures/death_screen.png';

let currentLevelIndex = 0;
let levelData = null; 
let map = null;

let movement = null;

////////////////////// INICJALIZUJEMY INWENTARZ /////////////////////
const inventory = new Inventory(canvas, ctx);

////////////////////// ИНИЦИАЛИЗИРУЕМ ПАУЗУ /////////////////////
const pause = new Pause(canvas, ctx);

let droppedItems = []; //////// PRZECHOWYWANIE WYRZUCONYCH PRZEDMIOTOW ////////

// Callback do obsługi wyrzucania przedmiotów
inventory.onDropItem = (itemName) => {
    droppedItems.push({
        name: itemName,
        x: player.pixelX + tileS / 4,
        y: player.pixelY + tileS / 4
    });
};

let camera = null;

let isTeleporting = false;
let activeEnemies = []; //////// Tablica do przechowywania wrogow na biezacym poziomie ////////

///////////////// NACISNIENIE KLAWISZY /////////////////
window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true; ///////////////// REJESTRACJA NACISNIECIA /////////////////
    
    //////// JESLI GRACZ JEST MARTWY, NACISNIENIE E ZADZIALA TYLKO WTEDY, GDY EKRAN SMIERCI JEST PRAWIE CALKOWICIE WIDOCZNY (alpha > 0,8) //////////
    if (isDead && (key === "e" || key === "у")) {
        if (deathAlpha >= 0.8) {
            resetGame();
        }
        return;
    }

    // ЛОГИКА ПАУЗЫ И ВЫХОДА ИЗ МЕНЮ
    if (key === "escape") {
        if (inventory.isOpen || inventory.currentChest) {
            inventory.isOpen = false;
            inventory.currentChest = null;
        } else if (!isDead) {
            pause.toggle();
        }
    }

    if (key === "e" || key === "у") {
        if (inventory.currentChest) {
            inventory.currentChest = null;
        } else if (!inventory.isOpen && !pause.isPaused) {
            // Najpierw próbujemy podnieść przedmiot z ziemi, jeśli go nie ma - sprawdzamy skrzynię
            if (!checkPickUpItem()) {
                checkChestInteraction();
            }
        }
    }

    if (key === "f" || key === "а") {
        if (!inventory.currentChest && !pause.isPaused) { 
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

///////////////// FUNKCJA PODNOSZENIA PRZEDMIOTOW /////////////////
function checkPickUpItem() {
    let pCenterX = player.pixelX + tileS / 2;
    let pCenterY = player.pixelY + tileS / 2;

    for (let i = 0; i < droppedItems.length; i++) {
        let item = droppedItems[i];
        let dx = pCenterX - (item.x + 20);
        let dy = pCenterY - (item.y + 20);
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 60) {
            inventory.items.push(item.name);
            droppedItems.splice(i, 1);
            return true;
        }
    }
    return false;
}

///////////////// FUNKCJA RESET GAME /////////////////
function resetGame() {
    isDead = false;
    deathAlpha = 0;
    playerHealth = 3;
    inventory.items = []; // Полная очистка инвентаря при смерти (если нужно)
    
    // СБРОС СТАМИНЫ ПРИ СМЕРТИ
    if (movement) {
        movement.stamina = movement.maxStamina;
        movement.isExhausted = false;
    }

    // МЕНЯЕМ currentLevelIndex на 0, чтобы zawsze возрождаться na pierwszej karcie
    initLevel(0); 
}

function initLevel(index, spawnX = null, spawnY = null) {
    currentLevelIndex = index;
    
    //WAŻNE: Tworzymy „głęboką kopię” danych poziomu.
    // Teraz, jeśli usuniemy element z kopii, pozostanie on w oryginale (CMlevels).
    levelData = JSON.parse(JSON.stringify(CMlevels[currentLevelIndex]));
    
    map = levelData.grid;
    droppedItems = []; // Czyszczenie przedmiotów na ziemi przy zmianie poziomu/restarcie

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
    
    activeEnemies = [];
    if (levelData.enemies) {
        for (let eData of levelData.enemies) {
            activeEnemies.push(new Enemy(eData.startX, eData.startY, eData.waypoints, map, tileS));
        }
    }

    if (!movement) {
        movement = new Movement(player, map, tileS);
    } else {
        movement.map = map;
    }
    
    camera = new CampaignCamera(canvas.width, canvas.height, map[0].length * tileS, map.length * tileS);
}


function draw() {  
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    /////////////////// BLOKUJEMYa RUCH JESLI UI OTWARTE, ПАУЗА LUB GRACZ NIE ZYJE ///////////////////
    if (!inventory.isUIActive() && !isDead && !pause.isPaused) {
        movement.keys = keys; ////////////////// PRZEKAZUJEMY KLAWISZE DO RUCHU //////////////////
        movement.update(activeEnemies);
        playerVisual.updateAnimation(keys); //////////////////// AKTUALIZACJA KLATEK ANIMACJI ////////////////////

        for (let enemy of activeEnemies) {
            enemy.update(player);

            /////////////////////// SPRAWDZANIE KOLIZJI Z ODZRUCENIEM ///////////////////////////
            if (!isInvulnerable) {
                let pCenterX = player.pixelX + tileS / 2;
                let pCenterY = player.pixelY + tileS / 2;
                let eCenterX = enemy.pixelX + enemy.size / 2;
                let eCenterY = enemy.pixelY + enemy.size / 2;

                let dx = pCenterX - eCenterX;
                let dy = pCenterY - eCenterY;
                let dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 60) { // Радиус столкновения
                    playerHealth--;
                    if (playerHealth <= 0) {
                        isDead = true;
                    } else {
                        isInvulnerable = true;
                        let angle = Math.atan2(dy, dx);
                        let force = 40; 
                        let knockX = Math.cos(angle) * force;
                        let knockY = Math.sin(angle) * force;
                        
                        movement.move(knockX, knockY, activeEnemies); 
                        setTimeout(() => { isInvulnerable = false; }, 1000); 
                    }
                }
            }
        }
    }
    
    camera.update(player.pixelX, player.pixelY);
    
    let gridX = Math.floor((player.pixelX + tileS / 2) / tileS);
    let gridY = Math.floor((player.pixelY + 45) / tileS);
    
    if (map[gridY] && map[gridY][gridX] >= 4 && !isTeleporting && !isDead && !pause.isPaused) {
        const portal = levelData.portals[map[gridY][gridX]];
        if (portal) {
            isTeleporting = true;
            initLevel(portal.targetLevel, portal.targetX, portal.targetY);
            setTimeout(() => { isTeleporting = false; }, 1000);
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

    ////////////////// RYSOWANIE PRZEDMIOTOW NA PODLODZE //////////////////
    for (let item of droppedItems) {
        ctx.fillStyle = "white";
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 2;
        ctx.fillRect(item.x, item.y, 40, 40);
        ctx.strokeRect(item.x, item.y, 40, 40);
        
        ctx.fillStyle = "black";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(item.name, item.x + 20, item.y + 25);
        ctx.textAlign = "left";
    }

    ////////////////// RYSOWANIE ANIMOWANEGO GRACZA /////////////////
    if (isInvulnerable) {
        ctx.globalAlpha = (Math.floor(Date.now() / 100) % 2 === 0) ? 0.3 : 1.0;
    }

    playerVisual.draw(ctx, player.pixelX, player.pixelY); 
    ctx.globalAlpha = 1.0; 

    for (let enemy of activeEnemies) {
        enemy.draw(ctx);
    }

    ctx.restore();

    ////////////////// RYSOWANIE UI //////////////////
    inventory.draw();

    ///////// RYSOWANIE HEARTS ////////
    for (let i = 0; i < playerHealth; i++) {
        let heartSize = 50; 
        let gap = 10;       
        if (heartImage.complete) {
            ctx.drawImage(heartImage, 20 + (heartSize + gap) * i, 20, heartSize, heartSize);
        }
    }

    // РИСУЕМ ПОЛОСКУ СТАМИНЫ ПОД СЕРДЕЧКАМИ
    if (movement) {
        let sWidth = 170;
        let sHeight = 12;
        let sX = 20;
        let sY = 80; 

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(sX, sY, sWidth, sHeight);

        ctx.fillStyle = movement.isExhausted ? "red" : "#ffcc00";
        let currentSWidth = (movement.stamina / movement.maxStamina) * sWidth;
        ctx.fillRect(sX, sY, currentSWidth, sHeight);

        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        ctx.strokeRect(sX, sY, sWidth, sHeight);
    }

    // РИСУЕМ ОКНО ПАУЗЫ
    pause.draw();

    /////////////////////// DEATH EKRAN /////////////////////
    if (isDead) {
        if (deathAlpha < 1) deathAlpha += 0.01; 
        ctx.save();
        ctx.globalAlpha = deathAlpha;
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let imgW = 1536; 
        let imgH = 300; 

        if (deathImage.complete) {
            ctx.drawImage(deathImage, canvas.width/2 - imgW/2, canvas.height/2 - imgH/2, imgW, imgH);
        }
        if (deathAlpha > 0.8) {
            ctx.fillStyle = "white";
            ctx.font = "20px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Нажмите 'E' для возрождения", canvas.width / 2, canvas.height / 2 + 150);
        }
        ctx.restore();
    }

    requestAnimationFrame(draw);
}

initLevel(0);
draw();
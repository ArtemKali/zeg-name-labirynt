import { levels } from "./maps.js";
import { Camera } from "./camera.js";
import { Movement } from "./movement.js";
import { Player } from './animate.js';
import { Enemy } from './enemies.js';
import { Inventory } from './inventory.js';

window.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const mapName = params.get("map") || "Castle";
    
    const MAP_INDEX = { "Castle": 0, "Jungle": 1, "Desert": 2 };
    let currentLevel = MAP_INDEX[mapName] ?? 0; 
    let currentFloor = 0; 
    
    let map = [];
    let currentPortals = {};
    let hasKey = false;
    let gameOver = false;
    
    let camera;
    let movement;

    const canvas = document.getElementById("arcade");
    const ctx = canvas.getContext("2d");
    const tileSize = 80;

    let playerVisual = new Player(tileSize); // Animacja gracza
    let inventorySystem = new Inventory(canvas, ctx); // System ekwipunku
    let enemies = []; // Tablica przeciwników
    let isDead = false;
    let deathAlpha = 0; // Przezroczystość ekranu śmierci

    let playerHealth = 3; 
    let maxHealth = 3;
    
    // Inicjalizacja obrazów
    const heartImg = new Image();
    heartImg.src = "../pictures/heart.png"; 

    const deathImage = new Image();
    deathImage.src = "../pictures/death_screen.png";

    const keyImg = new Image();
    keyImg.src = "./textures/key/key.png";

    const wallImg = new Image();
    wallImg.src = "./textures/jungle/wall.png";

    const floorImg = new Image();
    floorImg.src = "./textures/jungle/floor.png";

    let player = { pixelX: 0, pixelY: 0 };

    // Znajdź punkt startowy gracza na mapie
    function findStart() {
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                if (map[y][x] === 3) {
                    player.pixelX = x * tileSize;
                    player.pixelY = y * tileSize;
                    return;
                }
            }
        }
    }

function drawDeathScreen() {
    // Zwiększ przezroczystość dla efektu płynnego pojawiania się
    deathAlpha = Math.min(deathAlpha + 0.01, 1);
    
    ctx.save();
    // Przyciemnienie tła
    ctx.fillStyle = `rgba(0, 0, 0, ${deathAlpha * 0.7})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = deathAlpha;

    // Rysowanie obrazu śmierci (wyśrodkowanie)
    if (deathImage.complete && deathImage.naturalWidth !== 0) {
        let imgW = 800; 
        let imgH = 200; 
        ctx.drawImage(deathImage, canvas.width/2 - imgW/2, canvas.height/2 - imgH/2, imgW, imgH);
    }

    // Napis pod obrazkiem
    ctx.fillStyle = "white";
    ctx.font = "bold 25px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Naciśnij 'R', aby spróbować ponownie", canvas.width / 2, canvas.height / 2 + 150);
    
    ctx.restore();
}

    function loadLevel(levelIndex, floorIndex) {
        const locationData = levels[levelIndex];
        if (!locationData || !locationData[floorIndex]) {
            console.error("Nie znaleziono piętra!");
            return;
        }

        const floorData = locationData[floorIndex];
        currentLevel = levelIndex;
        currentFloor = floorIndex;

        // Załaduj siatkę mapy
        map = floorData.grid.map(row => [...row]);
        currentPortals = floorData.portals || {};

        // Wyczyść listę przeciwników przy zmianie poziomu
        enemies = [];

        findStart();
        
        const mapW = map[0].length * tileSize;
        const mapH = map.length * tileSize;

        // Inicjalizacja kamery
        if (!camera) {
            camera = new Camera(canvas.width, canvas.height, mapW, mapH);
        } else {
            camera.mapWidth = mapW;
            camera.mapHeight = mapH;
        }

        // Inicjalizacja logiki ruchu
        if (!movement) {
            movement = new Movement(player, map, tileSize);
        } else {
            movement.map = map;
        }

        // Tworzenie przeciwników na danym piętrze
        if (floorData.enemies) {
            floorData.enemies.forEach(e => {
                const newEnemy = new Enemy(
                    e.startX, 
                    e.startY, 
                    e.waypoints || [], 
                    map, 
                    tileSize
                );
                enemies.push(newEnemy);
            });
        }
    }

    function checkTileEvents(isKeyPress = false) {
        let gridX = Math.floor((player.pixelX + tileSize / 2) / tileSize);
        let gridY = Math.floor((player.pixelY + tileSize / 2) / tileSize);

        if (!map[gridY] || map[gridY][gridX] === undefined) return;

        const tile = map[gridY][gridX];

        // 1. Logika schodów / portali
        if (isKeyPress && currentPortals[tile]) {
            const portal = currentPortals[tile];
            loadLevel(currentLevel, portal.targetFloor);
            player.pixelX = portal.targetX * tileSize;
            player.pixelY = portal.targetY * tileSize;
            return;
        }

        // 2. Podnoszenie klucza
        if (tile === 4) { 
            hasKey = true; 
            map[gridY][gridX] = 0; 
            console.log("Klucz został zebrany!");
        }

        // 3. Wyjście (wygrana)
        if (tile === 2) { 
            if (hasKey) {
                gameOver = true; 
                alert("Wygrałeś!"); 
                window.location.href = "../index.html"; 
            }
        }
    }

    // Obsługa klawiszy (E - akcja, R - restart)
    window.addEventListener("keydown", (e) => {
        if (e.code === "KeyE") {
            checkTileEvents(true);
        }
        if (e.code === "KeyR" && isDead) {
            location.reload(); 
        }
    });

function drawUI() {
    if (!ctx) return;

    let heartSize = 45;
    let gap = 10;
    
    // Rysowanie serc (zdrowie)
    for (let i = 0; i < Math.ceil(playerHealth); i++) {
        if (heartImg.complete && heartImg.naturalWidth !== 0) {
            ctx.drawImage(heartImg, 20 + (heartSize + gap) * i, 20, heartSize, heartSize);
        } else {
            // Zastępczy czerwony kwadrat w razie błędu obrazu
            ctx.fillStyle = "red";
            ctx.fillRect(20 + (heartSize + gap) * i, 20, heartSize - 5, heartSize - 5);
        }
    }

    // Rysowanie paska energii (stamina)
    if (movement) {
        let barWidth = 200;
        let barY = 75;
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(20, barY, barWidth, 12); 
        
        ctx.fillStyle = movement.isExhausted ? "#ff6600" : "#ffcc00";
        let sWidth = (movement.stamina / movement.maxStamina) * barWidth;
        ctx.fillRect(20, barY, sWidth, 12);

        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        ctx.strokeRect(20, barY, barWidth, 12);
    }
}

function gameLoop() {
    // Jeśli gracz nie żyje, rysuj ekran śmierci
    if (isDead) {
        drawDeathScreen();
        requestAnimationFrame(gameLoop); 
        return; 
    }

    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Aktualizacja logiki ruchu i animacji
    if (movement) {
        movement.update(enemies); 
        checkTileEvents(false); 

        if (playerVisual) {
            playerVisual.updateAnimation(movement.keys);
        }
    }

    // Renderowanie świata przez kamerę
    if (camera) {
        camera.update(player.pixelX, player.pixelY);
        camera.apply(ctx);
        
        drawMap();

        // Logika i rysowanie przeciwników
        enemies.forEach(enemy => {
            enemy.update(player); 
            enemy.draw(ctx);
            
            // Sprawdzanie kolizji z przeciwnikiem (obrażenia)
            let dist = Math.hypot(enemy.pixelX - player.pixelX, enemy.pixelY - player.pixelY);
            
            if (dist < 50) { 
                playerHealth -= 0.015; 
                
                if (playerHealth <= 0) {
                    playerHealth = 0;
                    isDead = true;
                }
            }
        });

        // Rysowanie postaci gracza
        if (playerVisual) {
            playerVisual.draw(ctx, player.pixelX, player.pixelY);
        }

        camera.release(ctx);
    }

    // Rysowanie interfejsu użytkownika
    drawUI();

    // Rysowanie ekwipunku, jeśli jest otwarty
    if (inventorySystem && inventorySystem.isOpen) {
        inventorySystem.draw();
    }

    requestAnimationFrame(gameLoop);
}

function drawMap() {
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            let tile = map[y][x];
            let posX = x * tileSize;
            let posY = y * tileSize;

            // --- NAJPIERW RYSUJEMY PODŁOGĘ DLA KAŻDEGO POLA ---
            if (floorImg.complete && floorImg.naturalWidth !== 0) {
                ctx.drawImage(floorImg, posX, posY, tileSize, tileSize);
            } else {
                ctx.fillStyle = "white"; // Zapasowy kolor podłogi
                ctx.fillRect(posX, posY, tileSize, tileSize);
            }

            // --- POTEM RYSUJEMY WARSTWĘ SPECJALNĄ (ŚCIANY, KLUCZE ITP.) ---
            if (tile === 1) { // ŚCIANA
                if (wallImg.complete && wallImg.naturalWidth !== 0) {
                    ctx.drawImage(wallImg, posX, posY, tileSize, tileSize);
                } else {
                    ctx.fillStyle = "black"; // Zapasowy kolor ściany
                    ctx.fillRect(posX, posY, tileSize, tileSize);
                }
            } 
            else if (tile === 2) { 
                ctx.fillStyle = "rgba(0, 255, 0, 0.5)"; // Zielona meta (półprzezroczysta)
                ctx.fillRect(posX, posY, tileSize, tileSize);
            } 
            else if (tile === 4) { // KLUCZ
                if (keyImg.complete && keyImg.naturalWidth !== 0) {
                    ctx.drawImage(keyImg, posX, posY, tileSize, tileSize);
                }
            }
            else if (tile === 6) { // SCHODY W GÓRĘ
                ctx.fillStyle = "rgba(255, 165, 0, 0.7)"; 
                ctx.fillRect(posX, posY, tileSize, tileSize);
            }
            else if (tile === 5) { // SCHODY W DÓŁ
                ctx.fillStyle = "rgba(182, 182, 0, 0.7)"; 
                ctx.fillRect(posX, posY, tileSize, tileSize);
            }
        }
    }
}

    // Start gry
    loadLevel(currentLevel, currentFloor);
    gameLoop();
});
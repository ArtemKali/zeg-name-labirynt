import { levels } from "./maps.js";
import { Camera } from "./camera.js";
import { Movement } from "./movement.js";
import { Player } from './animate.js';
import { Enemy } from './enemies.js';
import { Inventory } from './inventory.js';
import { Fog } from './fog.js';
import { Pause } from './pause.js';

window.addEventListener("DOMContentLoaded", () => {
const params = new URLSearchParams(window.location.search);
const mapName = params.get("map") || "Castle";
const difficulty = params.get("diff") || "Normal";
    
    const MAP_INDEX = { "Castle": 0, "Jungle": 1, "Desert": 2 };
    let currentLevel = MAP_INDEX[mapName] ?? 0; 
    let currentFloor = 0; 
    
    let map = [];
    let currentPortals = {};
    let hasKey = false;
    let gameOver = false;
    
    let camera;
    let movement;
    let fog; 
    let pauseSystem;

    const canvas = document.getElementById("arcade");
    const ctx = canvas.getContext("2d");
    const tileSize = 80;

    let playerVisual = new Player(tileSize);
    let inventorySystem = new Inventory(canvas, ctx);
    let enemies = []; 
    let isDead = false;
    let deathAlpha = 0;

    let playerHealth = 3; 
    let maxHealth = 3;
    
    // Загрузка ресурсов
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
        deathAlpha = Math.min(deathAlpha + 0.01, 1);
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${deathAlpha * 0.7})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = deathAlpha;
        if (deathImage.complete && deathImage.naturalWidth !== 0) {
            let imgW = 800; 
            let imgH = 200; 
            ctx.drawImage(deathImage, canvas.width/2 - imgW/2, canvas.height/2 - imgH/2, imgW, imgH);
        }
        ctx.fillStyle = "white";
        ctx.font = "bold 25px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Нажмите 'R', чтобы попробовать снова", canvas.width / 2, canvas.height / 2 + 150);
        ctx.restore();
    }

function loadLevel(levelIndex, floorIndex) {
    const locationData = levels[levelIndex];
    if (!locationData || !locationData[floorIndex]) return;

    const floorData = locationData[floorIndex];
    currentLevel = levelIndex;
    currentFloor = floorIndex;

    map = floorData.grid.map(row => [...row]);
    currentPortals = floorData.portals || {};
    enemies = [];

    findStart();
    
    const mapW = map[0].length * tileSize;
    const mapH = map.length * tileSize;

    // --- ЛОГИКА ТУМАНА ПО СЛОЖНОСТИ ---
    if (difficulty === "Easy") {
        fog = null; // На изи тумана нет вообще
    } else {
        fog = new Fog(map[0].length, map.length, tileSize);
    }

    if (!camera) {
        camera = new Camera(canvas.width, canvas.height, mapW, mapH);
    } else {
        camera.mapWidth = mapW;
        camera.mapHeight = mapH;
    }

    if (!movement) {
        movement = new Movement(player, map, tileSize);
    } else {
        movement.map = map;
    }

    // --- ЛОГИКА ВРАГОВ ПО СЛОЖНОСТИ ---
    if (difficulty !== "Easy" && floorData.enemies) {
        // Определяем количество врагов по твоему списку
        let enemyCount = 1; // По дефолту (Normal)
        if (difficulty === "Hard") enemyCount = 3;
        if (difficulty === "Extreme") enemyCount = 4;

        // Берем врагов из конфига карты, но не больше, чем положено по сложности
        for (let i = 0; i < enemyCount; i++) {
            // Если на карте прописано меньше врагов, чем нужно для харда, 
            // берем координаты первого попавшегося врага из конфига
            let eData = floorData.enemies[i] || floorData.enemies[0]; 
            
            if (eData) {
                enemies.push(new Enemy(eData.startX, eData.startY, null, map, tileSize));
            }
        }
    }
}

    function checkTileEvents(isKeyPress = false) {
        let gridX = Math.floor((player.pixelX + tileSize / 2) / tileSize);
        let gridY = Math.floor((player.pixelY + tileSize / 2) / tileSize);
        if (!map[gridY] || map[gridY][gridX] === undefined) return;
        const tile = map[gridY][gridX];

        if (isKeyPress && currentPortals[tile]) {
            const portal = currentPortals[tile];
            loadLevel(currentLevel, portal.targetFloor);
            player.pixelX = portal.targetX * tileSize;
            player.pixelY = portal.targetY * tileSize;
            return;
        }
        if (tile === 4) { hasKey = true; map[gridY][gridX] = 0; }
        if (tile === 2 && hasKey) { 
            gameOver = true; 
            alert("Победа!"); 
            window.location.href = "../index.html"; 
        }
    }

window.addEventListener("keydown", (e) => {
        if (e.code === "KeyE") checkTileEvents(true);
        if (e.code === "KeyR" && isDead) location.reload(); 
        
        // Добавляем отслеживание кнопки Escape
        if (e.key === "Escape" || e.code === "Escape") {
            if (pauseSystem) {
                pauseSystem.toggle();
            }
        }
    });

    function drawUI() {
        let heartSize = 45;
        let gap = 10;
        for (let i = 0; i < Math.ceil(playerHealth); i++) {
            if (heartImg.complete) ctx.drawImage(heartImg, 20 + (heartSize + gap) * i, 20, heartSize, heartSize);
        }
        if (movement) {
            let barWidth = 200;
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(20, 75, barWidth, 12); 
            ctx.fillStyle = movement.isExhausted ? "#ff6600" : "#ffcc00";
            ctx.fillRect(20, 75, (movement.stamina / movement.maxStamina) * barWidth, 12);
        }
    }

 function gameLoop() {
    // 1. Проверка смерти
    if (isDead) { 
        drawDeathScreen(); 
        requestAnimationFrame(gameLoop); 
        return; 
    }

    if (gameOver) return;

    // 2. Логика паузы
    if (pauseSystem && pauseSystem.isPaused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        ctx.save();
        if (camera) {
            camera.apply(ctx);
            drawMap();
            // Рисуем врагов только если они есть (на Easy их нет)
            if (enemies && enemies.length > 0) {
                enemies.forEach(enemy => enemy.draw(ctx));
            }
            if (playerVisual) playerVisual.draw(ctx, player.pixelX, player.pixelY);
            // Туман на паузе рисуем только если он включен
            if (fog) fog.draw(ctx, camera);
            camera.release(ctx);
        }
        ctx.restore();
        pauseSystem.draw(); 
        requestAnimationFrame(gameLoop); 
        return; 
    }

    // --- ОСНОВНОЙ ЦИКЛ ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 3. Обновление логики движения
    if (movement) {
        movement.update(enemies); 
        checkTileEvents(false);   
        if (playerVisual) playerVisual.updateAnimation(movement.keys);
    }

    // 4. Обновление тумана (ТОЛЬКО ЕСЛИ ОН ЕСТЬ)
    if (fog) {
        fog.update(player.pixelX, player.pixelY);
    }

    // 5. Рендеринг
    if (camera) {
        camera.update(player.pixelX, player.pixelY);
        camera.apply(ctx);
        
        drawMap();

        // Рисуем и обновляем врагов (ТОЛЬКО ЕСЛИ ОНИ ЕСТЬ)
        if (enemies && enemies.length > 0) {
            enemies.forEach(enemy => {
                enemy.update(player); 
                enemy.draw(ctx);
                
                let dist = Math.hypot(enemy.pixelX - player.pixelX, enemy.pixelY - player.pixelY);
                if (dist < 45) { 
                    playerHealth -= 0.02; 
                    if (playerHealth <= 0) { playerHealth = 0; isDead = true; }
                }
            });
        }

        if (playerVisual) {
            playerVisual.draw(ctx, player.pixelX, player.pixelY);
        }

        // Рисуем туман (ТОЛЬКО ЕСЛИ ОН ЕСТЬ)
        if (fog) {
            fog.draw(ctx, camera);
        }

        camera.release(ctx);
    }

    drawUI();

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

                // Рисуем пол
                if (floorImg.complete) ctx.drawImage(floorImg, posX, posY, tileSize, tileSize);
                else { ctx.fillStyle = "white"; ctx.fillRect(posX, posY, tileSize, tileSize); }

                // Рисуем стены и объекты
                if (tile === 1) {
                    if (wallImg.complete) ctx.drawImage(wallImg, posX, posY, tileSize, tileSize);
                    else { ctx.fillStyle = "black"; ctx.fillRect(posX, posY, tileSize, tileSize); }
                } else if (tile === 2) { 
                    ctx.fillStyle = "rgba(0, 255, 0, 0.5)"; ctx.fillRect(posX, posY, tileSize, tileSize);
                } else if (tile === 4) {
                    if (keyImg.complete) ctx.drawImage(keyImg, posX, posY, tileSize, tileSize);
                } else if (tile === 6 || tile === 5) {
                    ctx.fillStyle = "rgba(255, 165, 0, 0.7)"; ctx.fillRect(posX, posY, tileSize, tileSize);
                }
            }
        }
    }

loadLevel(currentLevel, currentFloor);
    
    // Инициализируем паузу, передавая канвас и контекст
    pauseSystem = new Pause(canvas, ctx); 
    
    gameLoop();
});
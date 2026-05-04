import { levels } from "./maps.js";
import { Camera } from "./camera.js";
import { Movement } from "./movement.js";

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

    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    const tileSize = 80;

    const keyImg = new Image();
    keyImg.src = "./textures/key/key.png";

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

    function loadLevel(levelIndex, floorIndex) {
        const locationData = levels[levelIndex];
        if (!locationData || !locationData[floorIndex]) {
            console.error("Floor not found!");
            return;
        }

        const floorData = locationData[floorIndex];
        currentLevel = levelIndex;
        currentFloor = floorIndex;

        map = floorData.grid.map(row => [...row]);
        currentPortals = floorData.portals || {};

        if (player.pixelX === 0 && player.pixelY === 0) {
            findStart();
        }
        
        const mapW = map[0].length * tileSize;
        const mapH = map.length * tileSize;
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
    }

    function checkTileEvents(isKeyPress = false) {
        let gridX = Math.floor((player.pixelX + tileSize / 2) / tileSize);
        let gridY = Math.floor((player.pixelY + tileSize / 2) / tileSize);

        if (!map[gridY] || map[gridY][gridX] === undefined) return;

        const tile = map[gridY][gridX];

        // 1. ЛОГИКА ЛЕСТНИЦ (И вверх 6, и вниз 5)
        if (isKeyPress && currentPortals[tile]) {
            const portal = currentPortals[tile];
            loadLevel(currentLevel, portal.targetFloor);
            player.pixelX = portal.targetX * tileSize;
            player.pixelY = portal.targetY * tileSize;
            return;
        }

        // 2. СБОР КЛЮЧА
        if (tile === 4) { 
            hasKey = true; 
            map[gridY][gridX] = 0; 
            console.log("Ключ получен!");
        }

        // 3. ВЫХОД
        if (tile === 2) { 
            if (hasKey) {
                gameOver = true; 
                alert("ПОБЕДА!"); 
                window.location.href = "../index.html"; 
            }
        }
    }

    window.addEventListener("keydown", (e) => {
        if (e.code === "KeyE") {
            checkTileEvents(true);
        }
    });

    function gameLoop() {
        if (gameOver) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (movement) {
            movement.update();
            checkTileEvents(false);
        }

        if (camera) {
            camera.update(player.pixelX, player.pixelY);
            camera.apply(ctx);
            
            drawMap();
            drawPlayer();
            
            camera.release(ctx);
        }
        requestAnimationFrame(gameLoop);
    }

    function drawMap() {
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                let tile = map[y][x];

                if (tile === 1) ctx.fillStyle = "black";        // Стена
                else if (tile === 2) ctx.fillStyle = "green";   // Финиш
                else if (tile === 3) ctx.fillStyle = "blue";    // Спавн
                else if (tile === 6) ctx.fillStyle = "orange";  // Лестница ВВЕРХ
                else if (tile === 5) ctx.fillStyle = "#B6B600"; // ЛЕСТНИЦА ВНИЗ
                else ctx.fillStyle = "white";                   // Пол

                if (tile === 4) { 
                    ctx.fillStyle = "white";
                    ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                    ctx.drawImage(keyImg, x * tileSize, y * tileSize, tileSize, tileSize);
                } else {
                    ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                }
            }
        }
    }

     function drawPlayer() {
        ctx.fillStyle = "red";
        // Рисуем игрока чуть меньше плитки
        ctx.fillRect(player.pixelX + 10, player.pixelY + 10, tileSize - 20, tileSize - 20);

    } 

    loadLevel(currentLevel, currentFloor);
    gameLoop();
});
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
    let timerInterval
    let elapsedTime = 0;

    let currentTileUnderPlayer = 0; // Запоминаем, на какой плитке стоит игрок   
    let activePuzzle = null;    // Может быть "note" (открыта записка) или "safe" (открыт сейф)
    let enteredPin = "";        // Сюда сохраняем цифры, которые вводит игрок (например, "48")
    const CORRECT_PIN = "4813"; // Пин-код с твоей картинки list.png
    let safeOpened = false;     // Открыт ли сейф окончательно
    let doorOpened = false;
  

    // Подгружаем твои новые файлы
    const noteImg = new Image();
    noteImg.src = "textures/safe/list.png"; // Маленькая записка на пол

    const noteUiImg = new Image();
    noteUiImg.src = "textures/safe/open_list.png"; // Большая записка (UI)

    const safeImg = new Image();
    safeImg.src = "textures/safe/safe.png"; // Маленький сейф на карту

    const safeUiImg = new Image();
    safeUiImg.src = "textures/safe/open_safe.png"; // Большой интерфейс сейфа (UI)

    // Новые картинки для двери
    const doorCloseImg = new Image();
    doorCloseImg.src = "textures/safe/door_close.png"; // Закрытая дверь

    const pinDoorImg = new Image();
    pinDoorImg.src = "textures/safe/pin-door.png"; // UI замка двери


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
    } // Конец логики врагов

    // ====================================================================
    // --- ДОБАВЛЕННЫЙ КОД ТАЙМЕРА (БЫЛ ПРОПУЩЕН!) ---
    // ====================================================================
    elapsedTime = 0; // Сбрасываем время при загрузке уровня/этажа
    
    clearInterval(timerInterval); // Удаляем старый таймер, чтобы они не копились
    
    timerInterval = setInterval(() => {
        // Если игра на паузе, игрок мертв или игра окончена — время застывает
        if ((typeof pauseSystem !== 'undefined' && pauseSystem && pauseSystem.isPaused) || isDead || gameOver) {
            return; 
        }
        
        elapsedTime++; // Каждую секунду прибавляем 1
    }, 1000);
    // ====================================================================

} // Самая последняя скобка функции loadLevel

function checkTileEvents(isMoving) {
    // Получаем текущие координаты игрока в сетке карты (индексы массива)
    let gridX = Math.floor(player.pixelX / tileSize);
    let gridY = Math.floor(player.pixelY / tileSize);

    // Проверяем, что игрок не вышел за пределы массива карты
    if (gridY >= 0 && gridY < map.length && gridX >= 0 && gridX < map[gridY].length) {
        let tile = map[gridY][gridX];

        // --- ЛОГИКА ДЛЯ ВСЕХ НАШИХ ГОЛОВОЛОМОК ---
        // Если игрок встал на записку сейфа (7), сам сейф (8), кодовую дверь (9) или записку двери (10)
        if (tile === 7 || tile === 8 || tile === 9 || tile === 10) {
            currentTileUnderPlayer = tile; // Запоминаем ID плитки, чтобы сработала кнопка "E"
        } else {
            currentTileUnderPlayer = 0; // Игрок ушел на обычный пол, сбрасываем взаимодействие
        }

        // --- ОСТАЛЬНАЯ СТАНДАРТНАЯ ЛОГИКА ИГРЫ ---
        // Плитка 2: Финиш (Выход из лабиринта)
        if (tile === 2) {
            gameOver = true;
            alert("🎉 Вы прошли уровень!");
        } 
        
        // Плитка 4: Обычный золотой ключ (тот, что лежит на полу или выпал из сейфа)
        else if (tile === 4) {
            map[gridY][gridX] = 0; // Стираем ключ с карты, превращая клетку в чистый пол
            hasKey = true;         // Добавляем ключ в инвентарь игрока
            alert("🔑 Вы подобрали ключ от финишной двери!");
        }
        
        // (Сюда при необходимости твой друг может вписать проверки для плиток 5 и 6)
    }
}

window.addEventListener("keydown", (e) => {
    // 1. Если открыта записка: Escape или E закрывает её
    if (activePuzzle === "note") {
        if (e.code === "Escape" || e.code === "KeyE") {
            activePuzzle = null;
            return;
        }
    }

    if (isDead || gameOver || (pauseSystem && pauseSystem.isPaused)) return;

    // 2. ВЗАИМОДЕЙСТВИЕ ПО НАЖАТИЮ НА "E"
    if (e.code === "KeyE") {
        
        // --- ВЗАИМОДЕЙСТВИЕ С ЗАПИСКОЙ ---
        if (currentTileUnderPlayer === 7) {
            activePuzzle = "note"; // Показывает open_list.png через gameLoop
        } 
        
        // --- ВЗАИМОДЕЙСТВИЕ С СЕЙФОМ ---
        else if (currentTileUnderPlayer === 8 && !safeOpened) {
            let inputCode = prompt("Введите 4-значный пин-код от сейфа:");

            if (inputCode !== null) {
                if (inputCode === "4813") {
                    alert("🔓 СЕЙФ ОТКРЫТ! Ключ упал на пол рядом с вами!");
                    safeOpened = true;

                    // Находим, где стоит игрок в сетке
                    let gridX = Math.floor(player.pixelX / tileSize);
                    let gridY = Math.floor(player.pixelY / tileSize);

                    // Спавним ключ (плитка 4) на соседнюю клетку справа от игрока.
                    // Если там стена, можно спавнить прямо под игрока: map[gridY][gridX] = 4;
                    if (map[gridY] && map[gridY][gridX + 1] === 0) {
                        map[gridY][gridX + 1] = 4; 
                    } else {
                        map[gridY][gridX] = 4; 
                    }
                    
                } else {
                    alert("❌ НЕВЕРНЫЙ КОД!");
                }
            }
        }

        // --- ВЗАИМОДЕЙСТВИЕ С КОДОВОЙ ДВЕРЬЮ (ПЛИТКА 9) ---
        else if (currentTileUnderPlayer === 9 && !doorOpened) {
            // Придумываем новый пароль для двери, например, 2509
            let inputDoorCode = prompt("Электронный замок двери. Введите код доступа:");

            if (inputDoorCode !== null) {
                if (inputDoorCode === "2509") { 
                    alert("🔓 Электронный замок отключен! Проход свободен.");
                    doorOpened = true;

                    // Удаляем дверь с карты (превращаем в пол 0), чтобы через неё можно было пройти
                    let gridX = Math.floor(player.pixelX / tileSize);
                    let gridY = Math.floor(player.pixelY / tileSize);
                    
                    // Перебираем соседние плитки, чтобы найти и стереть плитку двери 9
                    if (map[gridY][gridX] === 9) map[gridY][gridX] = 0;
                    if (map[gridY - 1] && map[gridY - 1][gridX] === 9) map[gridY - 1][gridX] = 0;
                    if (map[gridY + 1] && map[gridY + 1][gridX] === 9) map[gridY + 1][gridX] = 0;
                    if (map[gridY][gridX - 1] === 9) map[gridY][gridX - 1] = 0;
                    if (map[gridY][gridX + 1] === 9) map[gridY][gridX + 1] = 0;

                } else {
                    alert("❌ ДОСТУП ЗАПРЕЩЕН!");
                }
            }
        }
        return; // Прерываем ходьбу при нажатии E
    }

    // 3. СТАНДАРТНОЕ УПРАВЛЕНИЕ ДВИЖЕНИЕМ
    if (movement && movement.keys) {
        if (e.code === "KeyW" || e.code === "ArrowUp") movement.keys.up = true;
        if (e.code === "KeyS" || e.code === "ArrowDown") movement.keys.down = true;
        if (e.code === "KeyA" || e.code === "ArrowLeft") movement.keys.left = true;
        if (e.code === "KeyD" || e.code === "ArrowRight") movement.keys.right = true;
    }

    if (e.code === "KeyI" && inventorySystem) inventorySystem.isOpen = !inventorySystem.isOpen;
    if (e.code === "Escape" && pauseSystem) pauseSystem.isPaused = !pauseSystem.isPaused;
});

    window.addEventListener("click", (e) => {
    // Если сейф не открыт на экране, клики мышки по кнопкам ловить не нужно
    if (activePuzzle !== "safe" || safeOpened) return;

    // Получаем реальные координаты клика на холсте canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Сейф рисуется по центру экрана. Давай определим его координаты на canvas:
    const safeW = 200; // Ширина панели кнопок на экране (можно менять)
    const safeH = 200; // Высота панели кнопок
    const startX = (canvas.width - safeW) / 2;
    const startY = (canvas.height - safeH) / 2 + 50; // Смещаем чуть вниз под табло

    // Проверяем, попал ли клик вообще по блоку кнопок
    if (mouseX >= startX && mouseX <= startX + safeW && mouseY >= startY && mouseY <= startY + safeH) {
        
        // Так как кнопок 3 на 3, делим панель на 3 строки и 3 столбца
        const col = Math.floor((mouseX - startX) / (safeW / 3));
        const row = Math.floor((mouseY - startY) / (safeH / 3));

        // Массив кнопок, соответствующий твоей картинке pin-code.png
        const buttons = [
            ["1", "2", "3"],
            ["4", "5", "6"],
            ["7", "8", "9"]
        ];

        const clickedDigit = buttons[row][col];
        
        if (enteredPin.length < 4) {
            enteredPin += clickedDigit; // Добавляем цифру в память
            console.log("Введено:", enteredPin);

            // Если ввели 4 цифры — мгновенно проверяем код
            if (enteredPin.length === 4) {
                if (enteredPin === CORRECT_PIN) {
                    alert("🔓 СЕЙФ ОТКРЫТ! Вы получили ключ!");
                    hasKey = true; // Даем игроку ключ
                    safeOpened = true;
                    activePuzzle = null; // Закрываем интерфейс сейфа
                } else {
                    alert("❌ НЕВЕРНЫЙ КОД! Сброс...");
                    enteredPin = ""; // Сбрасываем ввод, если ошибся
                }
            }
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
            if (enemies && enemies.length > 0) {
                enemies.forEach(enemy => enemy.draw(ctx));
            }
            if (playerVisual) playerVisual.draw(ctx, player.pixelX, player.pixelY);
            if (fog) fog.draw(ctx, camera);
            camera.release(ctx);
        }
        ctx.restore();
        pauseSystem.draw(); 
        requestAnimationFrame(gameLoop); 
        return; 
    }

    // ====================================================================
    // --- ЛОГИКА ГОЛОВОЛОМОК (ЗАПИСКА И СЕЙФ) ---
    // ====================================================================
    if (activePuzzle) {
        // Очищаем экран и рисуем застывший мир на заднем плане
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        ctx.save();
        if (camera) {
            camera.apply(ctx);
            drawMap();
            if (enemies && enemies.length > 0) {
                enemies.forEach(enemy => enemy.draw(ctx));
            }
            if (playerVisual) playerVisual.draw(ctx, player.pixelX, player.pixelY);
            if (fog) fog.draw(ctx, camera);
            camera.release(ctx);
        }
        ctx.restore();
        drawUI(); // Оставляем интерфейс здоровья/времени

        // --- Рисуем БОЛЬШУЮ ЗАПИСКУ (open_list.png) ---
        if (activePuzzle === "note") {
            const w = 300; // Размер большой записки на экране
            const h = 300;
            const x = (canvas.width - w) / 2;
            const y = (canvas.height - h) / 2;
            
            if (noteUiImg.complete) {
                ctx.drawImage(noteUiImg, x, y, w, h);
            }
        }

        // --- Рисуем ИНТЕРФЕЙС СЕЙФА (open_safe.png) ---
        if (activePuzzle === "safe") {
            const w = 300; // Размер интерфейса сейфа на экране
            const h = 300;
            const x = (canvas.width - w) / 2;
            const y = (canvas.height - h) / 2;

            // Рисуем ОДНУ цельную картинку open_safe.png
            if (safeUiImg.complete) {
                ctx.drawImage(safeUiImg, x, y, w, h);
            }

            // Выводим цифры кода поверх табло
            ctx.fillStyle = "#ffffff"; // Белый цвет для цифр
            ctx.font = "24px monospace";
            ctx.textAlign = "center";
            
            // Координаты для цифр. Тебе нужно будет подогнать startX и textY, 
            // чтобы цифры встали ровно в рамочки табло на твоей картинке!
            const startX = x + 70;  // Позиция первой цифры по X
            const stepX = 35;       // Расстояние между цифрами
            const textY = y + 65;   // Высота табло от верхнего края картинки

            for (let i = 0; i < enteredPin.length; i++) {
                ctx.fillText(enteredPin[i], startX + (i * stepX), textY); 
            }
        }

        requestAnimationFrame(gameLoop);
        return; // Тормозим остальную логику игры, пока открыта головоломка
    }
    // ====================================================================

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

            // 1. Рисуем пол (база под всё)
            if (floorImg.complete) ctx.drawImage(floorImg, posX, posY, tileSize, tileSize);
            else { ctx.fillStyle = "white"; ctx.fillRect(posX, posY, tileSize, tileSize); }

            // 2. Рисуем стены и стандартные объекты
            if (tile === 1) {
                if (wallImg.complete) ctx.drawImage(wallImg, posX, posY, tileSize, tileSize);
                else { ctx.fillStyle = "black"; ctx.fillRect(posX, posY, tileSize, tileSize); }
            } else if (tile === 2) { 
                ctx.fillStyle = "rgba(0, 255, 0, 0.5)"; ctx.fillRect(posX, posY, tileSize, tileSize);
            } else if (tile === 4) {
                if (keyImg.complete) ctx.drawImage(keyImg, posX, posY, tileSize, tileSize);
            } else if (tile === 6 || tile === 5) {
                // Код твоего друга
                ctx.fillStyle = "rgba(255, 165, 0, 0.7)"; ctx.fillRect(posX, posY, tileSize, tileSize);
            } 
            
            // --- 3. НАШИ НОВЫЕ ГОЛОВОЛОМКИ И ОБЪЕКТЫ НА КАРТЕ ---
            
            // Плитка 7: Маленькая записка сейфа (list.png)
            else if (tile === 7) {
                if (noteImg.complete) {
                    ctx.drawImage(noteImg, posX, posY, tileSize, tileSize);
                } else {
                    // Запасной вариант: если картинка не загрузилась, рисуем синий квадрат
                    ctx.fillStyle = "blue"; ctx.fillRect(posX, posY, tileSize, tileSize);
                }
            } 
            
            // Плитка 8: Маленький сейф (safe.png)
            else if (tile === 8) {
                if (safeImg.complete) {
                    ctx.drawImage(safeImg, posX, posY, tileSize, tileSize);
                } else {
                    // Запасной вариант: серый квадрат
                    ctx.fillStyle = "gray"; ctx.fillRect(posX, posY, tileSize, tileSize);
                }
            }
            
            // Плитка 9: Закрытая кодовая дверь (door_close.png)
            else if (tile === 9) {
                if (doorCloseImg.complete) {
                    ctx.drawImage(doorCloseImg, posX, posY, tileSize, tileSize);
                } else {
                    // Запасной вариант: красный квадрат
                    ctx.fillStyle = "red"; ctx.fillRect(posX, posY, tileSize, tileSize);
                }
            }

            // Плитка 10: Записка от кодовой двери (тоже list.png)
            else if (tile === 10) {
                if (noteImg.complete) {
                    ctx.drawImage(noteImg, posX, posY, tileSize, tileSize);
                } else {
                    // Запасной вариант: фиолетовый квадрат
                    ctx.fillStyle = "purple"; ctx.fillRect(posX, posY, tileSize, tileSize);
                }
            }
            
        }
    }
}

loadLevel(currentLevel, currentFloor);
    
    // Инициализируем паузу, передавая канвас и контекст
    pauseSystem = new Pause(canvas, ctx); 
    
    gameLoop();
});
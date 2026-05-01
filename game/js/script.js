import { levels } from "./maps.js";
import { Camera } from "./camera.js"; // Импортируем камеру

window.addEventListener("DOMContentLoaded", () => {

  let gameOver = false;  //////  OKONCZANIE GRY

  let keys = {};

  const keyImg = new Image();
  keyImg.src = "./textures/key/key.png";  /////// TEXTURE KLUCZA

  // ПОЛУЧЕНИЕ ПАРАМЕТРОВ
  const params = new URLSearchParams(window.location.search);

  const rawMapName = params.get("map");
  const rawDifficulty = params.get("difficulty");

  const mapName = rawMapName
    ? rawMapName.charAt(0).toUpperCase() + rawMapName.slice(1).toLowerCase()
    : "Castle";

  const difficulty = rawDifficulty ? rawDifficulty.toLowerCase() : "easy";

  // CONFIG MAP
  const LEVEL_CONFIG = {
    Castle: {
      easy: 0, // 1
      normal: 1, // 2
      hard: 2, // 3
      expert: 3  // 4 
    },
    Jungle: {
      easy: 4,
      normal: 5,
      hard: 6,
      expert: 7
    },
    Desert: {
      easy: 8,
      normal: 9,
      hard: 10,
      expert: 11
    }
  };

  ////////////= WYBOR POZIOMU =\\\\\\\\\\\\\
  let currentLevel = LEVEL_CONFIG[mapName]?.[difficulty] ?? 0;

  function cloneLevel(levelIndex) {
    return levels[levelIndex].map(row => row.slice());
  }

  let map = cloneLevel(currentLevel);

  let hasKey = false; // klucz 

  const canvas = document.getElementById("game");
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("2D context not available");
    return;
  }

  
  const tileSize = 80;


  let player = { 
    x: 0, 
    y: 0, 
    pixelX: 0,
    pixelY: 0 
  };

  // Инициализация камеры
  let camera = new Camera(
    canvas.width, 
    canvas.height, 
    map[0].length * tileSize, 
    map.length * tileSize
  );

  let enemies = [];     ////////////////////////////// ENMEIES \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

function spawnEnemies() {
  enemies = [];

  enemies.push({
    x: 5,
    y: 5,
    path: [
      { x: 1, y: 5 },
      { x: 7, y: 5 },
      { x: 2, y: 5 },
      { x: 2, y: 10 }
    ],
    targetIndex: 1,
    delay: 0
  });

  enemies.push({
    x: 24,
    y: 24,
    path: [
      { x: 32, y: 48 },
      { x: 42, y: 42 },
      { x: 14, y: 45 },
      { x: 3, y: 49 },
      { x: 32, y: 48 }
    ],
    targetIndex: 1,
    delay: 0
  });
}

  function findStart() {
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        if (map[y][x] === 3) {
          player.x = x;
          player.y = y;
          // Устанавливаем начальную пиксельную позицию
          player.pixelX = x * tileSize;
          player.pixelY = y * tileSize;
          return;
        }
      }
    }
    console.warn("Spawn tile (3) not found");
  }

  function loadLevel(level) {
    if (!levels[level]) {
      alert("The end..");
      return;
    }

    map = cloneLevel(level);
    hasKey = false;
    findStart();
    spawnEnemies();


    if (camera) {
        camera.mapWidth = map[0].length * tileSize;
        camera.mapHeight = map.length * tileSize;
    }
  }

  findStart();
  spawnEnemies();

  function drawMap() {
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {

        if (map[y][x] === 1) ctx.fillStyle = "black";        // ściany

        else if (map[y][x] === 2) ctx.fillStyle = "green";   // koniec

        else if (map[y][x] === 3) ctx.fillStyle = "blue";    // spawn

        else if (map[y][x] === 4) {                          // klucz
          ctx.drawImage(
            keyImg,
              x * tileSize,
              y * tileSize,
              tileSize,
              tileSize
         );
          continue;
        }

        else if (map[y][x] === 5) ctx.fillStyle = "brown";    // drzwi
        else ctx.fillStyle = "white";

        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }

  document.addEventListener("keydown", (e) => {
    keys[e.code] = true;
  });

  document.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  let moveDelay = 0;

  function updateMovement() {
    moveDelay++;

    let interval = 8; // szybkosc gracza (wiecej = wolniej)

    if (keys["ShiftLeft"] || keys["ShiftRight"]) {
      interval = 6; // przyspieszenie
    }

    if (moveDelay >= interval) {
        moveDelay = 0;

        let newX = player.x;
        let newY = player.y;

        if (keys["KeyW"]) newY--;
        else if (keys["KeyS"]) newY++;
        else if (keys["KeyA"]) newX--;
        else if (keys["KeyD"]) newX++;

        if (newX !== player.x || newY !== player.y) {
          movePlayer(newX, newY);
        }
    }

    ///////////////////////////// LOGIKA PŁYNNOŚCI: przyciągamy pozycję pikseli do siatki ///////////////////////////////////

    let lerpSpeed = 0.25; /////// szybkosc plynnosci
    player.pixelX += (player.x * tileSize - player.pixelX) * lerpSpeed;
    player.pixelY += (player.y * tileSize - player.pixelY) * lerpSpeed;
  }

  function updateEnemies() {                  //////////////////// RUCH ENEMEIES ////////////////////
  for (let enemy of enemies) {

    enemy.delay++;
    if (enemy.delay < 7) continue; // szybkosc wroga (wiecej = wolniej)
    enemy.delay = 0;

    const target = enemy.path[enemy.targetIndex];

    let dx = target.x - enemy.x;
    let dy = target.y - enemy.y;

    let newX = enemy.x;
    let newY = enemy.y;

    if (dx !== 0) newX += Math.sign(dx);
    else if (dy !== 0) newY += Math.sign(dy);

    // проверка стены
    if (map[newY] && map[newY][newX] !== 1) {
      enemy.x = newX;
      enemy.y = newY;
    }

    // достиг точки → следующая
    if (enemy.x === target.x && enemy.y === target.y) {
      enemy.targetIndex++;

      if (enemy.targetIndex >= enemy.path.length) {
        enemy.targetIndex = 0; // cykl
      }
    }

    if (enemy.x === player.x && enemy.y === player.y) {   ///////// zderzenie z graczem ///////////
      alert("You died");
      location.reload();
    }
  }
}

  function movePlayer(x, y) {
    if (!map[y] || map[y][x] === undefined) return;

    const tile = map[y][x];

    // sciana
    if (tile === 1) return;

    // dzwi bez klucza
    if (tile === 5 && !hasKey) return;

    // ruch логический
    player.x = x;
    player.y = y;

    // podbieranie klucza
    if (tile === 4) {
      hasKey = true;
      map[y][x] = 0; // убрать ключ с карты
      console.log("You got a key");
    }

    // drzwi otwarte
    if (tile === 5 && hasKey) {
      console.log("Doors is open");
    }

    // wyjście
    if (tile === 2) {
      gameOver = true;
      showWinMessage();
    }
  }

  function drawPlayer() {
    ctx.fillStyle = "red";

    ctx.fillRect(
      player.pixelX,
      player.pixelY,
      tileSize,
      tileSize
    );
  }

  function drawEnemies() {
  ctx.fillStyle = "purple";

  for (let enemy of enemies) {
    ctx.fillRect(
      enemy.x * tileSize,
      enemy.y * tileSize,
      tileSize,
      tileSize
    );
  }
}

  function gameLoop() {
    if(gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height); ///////// Czyścimy całe płótno przed rysowaniem //////////

    updateMovement();
    updateEnemies();

    if (camera) {
       
        camera.update(player.pixelX, player.pixelY); /////////// kamera przesuwa sie za graczem //////////

        camera.apply(ctx);

        drawMap();
        drawPlayer();
        drawEnemies();

        // Отменяем трансформацию
        camera.release(ctx);
    }

    requestAnimationFrame(gameLoop);
  }

  function showWinMessage() {                                          ///////// POKAZUJE NAPIS O WYGRANIU
  const message = document.createElement("div");

  if(difficulty == "expert"){                /////////// JEZELI WYGRALES NA TRUDNOSCI EXPERT
     message.innerText = `Ma boy watafa`; 
  } else {
  message.innerText = `You passed ${mapName} on ${difficulty} congrats`;
  }

  const btn = document.createElement("button");
    btn.innerText = "В меню";
    btn.style.display = "block";
    btn.style.marginTop = "10px";

    btn.onclick = () => {
      window.location.href = "../index.html";
    };

  message.appendChild(btn);

  message.style.position = "absolute";
  message.style.top = "20px";
  message.style.left = "50%";
  message.style.transform = "translateX(-50%)";
  message.style.padding = "15px 25px";
  message.style.background = "black";
  message.style.color = "white";
  message.style.fontSize = "20px";
  message.style.borderRadius = "10px";
  message.style.zIndex = "999";

  document.body.appendChild(message);
}

  gameLoop();

});
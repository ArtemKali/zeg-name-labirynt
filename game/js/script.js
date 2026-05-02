import { levels } from "./maps.js";
import { Camera } from "./camera.js"; // import kamery i map
import { Movement } from "./movement.js"; //////// IMPORTUJEMY RUCH

window.addEventListener("DOMContentLoaded", () => { // Uruchamia po załadowaniu całego HTML

  let gameOver = false; // false = żyjesz, true = koniec gry

  let keys = {}; // Pamięć naciśniętych klawiszy

  const keyImg = new Image(); // tworzy obiekt obrazu
  keyImg.src = "./textures/key/key.png"; // ścieżka do pliku

  const params = new URLSearchParams(window.location.search); // Pobiera parametry z URL

  const rawMapName = params.get("map"); // Pobiera wartość map z adresu URL
  const rawDifficulty = params.get("difficulty"); // Pobiera poziom trudności

  const mapName = rawMapName
    ? rawMapName.charAt(0).toUpperCase() + rawMapName.slice(1).toLowerCase()
    : "Castle"; // Przywraca normalną nazwe mapy (z CASTLE - Castle)

  const difficulty = rawDifficulty ? rawDifficulty.toLowerCase() : "easy"; // poziom trudności

  // CONFIG MAP
  const LEVEL_CONFIG = { 
    Castle: {
      easy: 0,
      normal: 1,
      hard: 2,
      expert: 3 
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
  } // kopia level

  let map = cloneLevel(currentLevelIndex);

  let hasKey = false; // klucz 

  const canvas = document.getElementById("game");
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  } // sprawdzenie czy jest <canvas id="game">

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("2D context not available");
    return;

    
  } // pobiera kontekst rysowania
 
  const tileSize = 80; // rozmiar

  let player = { 
    pixelX: 0,
    pixelY: 0 
  }; // gracz


  // Inicjalizacja kamery
  let camera = new Camera(
    canvas.width, 
    canvas.height, 
    map[0].length * tileSize, 
    map.length * tileSize
  );
  
  let movement = new Movement(player, map, tileSize);

  let enemies = []; // przeciwnik
function spawnEnemies() { // spawn przeciwników
  enemies = [];

  enemies.push({ // logika wroga
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

  enemies.push({ // drugi wrog
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

  function findStart() { // start game
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        if (map[y][x] === 3) {

          player.x = x;
          player.y = y;
          // Ustawiamy początkową pozycję w pikselach
          player.pixelX = x * tileSize;
          player.pixelY = y * tileSize;
          return;
        }
      }
    }
    console.warn("Spawn tile (3) not found"); // jeżeli nie znajdzie spawn
  }


  function loadLevel(level) { // Ładowanie poziomu
    if (!levels[level]) {
      alert("The end..");
      return;
    }

    map = cloneLevel(level);
    hasKey = false; // reset klucz
    findStart(); // nowy start gry
    spawnEnemies(); // przeciwniki


    if (camera) {
        camera.mapWidth = map[0].length * tileSize;
        camera.mapHeight = map.length * tileSize;
    }
  }


  findStart();
  spawnEnemies();

  function drawMap() {
    for (let y = 0; y < map.length; y++) { // rysuje mape
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
    if (gameOver) return;

    // Вызываем плавное движение из класса Movement
    movement.update();

    // Проверка взаимодействия с объектами (ключ, финиш, двери)
    // Берем центр игрока для определения клетки
    let centerX = player.pixelX + tileSize / 2;
    let centerY = player.pixelY + tileSize / 2;
    let gridX = Math.floor(centerX / tileSize);
    let gridY = Math.floor(centerY / tileSize);

    if (map[gridY] && map[gridY][gridX] !== undefined) {
        const tile = map[gridY][gridX];

        // Подбирание ключа
        if (tile === 4) {
            hasKey = true;
            map[gridY][gridX] = 0; // убрать ключ
            console.log("You got a key");
        }

        // Дверь (если есть ключ, она исчезает при касании)
        if (tile === 5 && hasKey) {
            map[gridY][gridX] = 0;
            console.log("Doors is open");
        }

        // Финиш
        if (tile === 2) {
            gameOver = true;
            showWinMessage();
        }
    }


// Logika płyności: przyciągamy pozycję pikseli do siatki

    let lerpSpeed = 0.25; // szybkosc plynnosci
    player.pixelX += (player.x * tileSize - player.pixelX) * lerpSpeed;
    player.pixelY += (player.y * tileSize - player.pixelY) * lerpSpeed;

  }

  function updateEnemies() { // Ruch wrogów
  for (let enemy of enemies) {

    enemy.delay++;
    if (enemy.delay < 7) continue; // szybkosc wroga (wiecej = wolniej)
    enemy.delay = 0;

    const target = enemy.path[enemy.targetIndex];

    let dx = target.x - enemy.x; // Obliczanie kierunku
    let dy = target.y - enemy.y;

    let newX = enemy.x;
    let newY = enemy.y;

    if (dx !== 0) newX += Math.sign(dx);
    else if (dy !== 0) newY += Math.sign(dy);


    // sprawdzenie ściany
    if (map[newY] && map[newY][newX] !== 1) {
      enemy.x = newX;
      enemy.y = newY;
    }


    // dotarł do punktu - następny
    if (enemy.x === target.x && enemy.y === target.y) {
      enemy.targetIndex++;
      if (enemy.targetIndex >= enemy.path.length) {
        enemy.targetIndex = 0; // cykl
      }
    }


    let pGridX = Math.floor((player.pixelX + tileSize/2) / tileSize);
    let pGridY = Math.floor((player.pixelY + tileSize/2) / tileSize);
    
    if (enemy.x === pGridX && enemy.y === pGridY) {   ///////// zderzenie z graczem ///////////

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

    // ruch logiczny
    player.x = x;
    player.y = y;

    // podbieranie klucza
    if (tile === 4) {
      hasKey = true;
      map[y][x] = 0; // usunąć klucz z mapy
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

  function drawPlayer() { // rysuje gracza

    ctx.fillStyle = "red";
    // Рисуем игрока с небольшим отступом (как в кампании), чтобы он визуально не входил в стены
    const m = movement.margin;
    ctx.fillRect(
      player.pixelX + m,
      player.pixelY + m,
      tileSize - m * 2,
      tileSize - m * 2
    );
  }

  function drawEnemies() { // rysuje wroga
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

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Czyścimy całe płótno przed rysowaniem

    updateMovement();
    updateEnemies();

    if (camera) {
       
        camera.update(player.pixelX, player.pixelY); // kamera przesuwa sie za graczem
        camera.apply(ctx);

        drawMap();
        drawPlayer();
        drawEnemies();

        // Cofamy transformację
        camera.release(ctx);
    }

    requestAnimationFrame(gameLoop);
  }

  function showWinMessage() { // pokazuje napis o wygraniu
  const message = document.createElement("div");

  if(difficulty == "expert"){ // jeżeli wygrałesz na poziomu expert
     message.innerText = `You win on expert yo`; 
  } else {
  message.innerText = `You passed ${mapName} on ${difficulty} congrats`;
  }

  const btn = document.createElement("button");
    btn.innerText = "Exit";
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
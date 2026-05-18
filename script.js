const menu = document.getElementById("menu");
const screen = document.getElementById("screen");

const music = new Audio("sounds/aruarian.mp3"); // OBJEKT MUZYKI
// music.play(); // wlaczyc muzyke (ЗАКОММЕНТИРОВАНО: музыка включится только после интро)

const mapBackgrounds = {
        Castle: "videos/Castle.mp4",
        Desert: "videos/Desert.mp4",
        Jungle: "videos/Jungle.mp4"
    };


const difficultyData = {
  Peaceful: { desc: "Relax mode without enemies. Just chill gameplay." },

  Normal: { desc: "Balanced difficulty. Standard experience." },
  
  Hard: { desc: "Enemies are stronger. You will suffer." },

  Expert: { desc: "I wanna see how you will cry. Good luck." }
};


//=================================================================================================================================================
//=================================================================================================================================================


let selectedMap = null;

/////////* WSZYSTKIE MENU */////////
const menus = {
  main: [
    { text: "Campaign", action: startCampaign },
    { text: "Arcade", action: () => setMenu("map") },
    { text: "Settings", action: () => setMenu("settings") },
    { text: "Credits", action: () => setMenu("credits") }
  ],

  map: [
    { text: "Castle", action: () => { selectedMap = "Castle"; setMenu("difficulty"); } },
    { text: "Desert", action: () => { selectedMap = "Desert"; setMenu("difficulty"); } },
    { text: "Jungle", action: () => { selectedMap = "Jungle"; setMenu("difficulty"); } },
    { text: "Back", action: () => setMenu("main") }
  ],

  difficulty: [
    { text: "Peaceful", action: () => startGame("easy") },
    { text: "Normal", action: () => startGame("normal") },
    { text: "Hard", action: () => startGame("hard") },
    { text: "Expert", action: () => startGame("expert") },
    { text: "Back", action: () => setMenu("map") }
  ],

  settings: [
    { text: "Music volume", action: () => setSetting("volume") },
    { text: "Controls", action: () => setSetting("control") },
    { text: "Back", action: () => setMenu("main") }
  ],

  credits: [
    { text: "Show Credits", action: showCredits },
    { text: "Back", action: () => {
      screen.classList.remove("active");
      setMenu("main");
    }}
  ]
};

////////* MENU *////////
function setMenu(name) {
  screen.classList.remove("active");
  screen.innerHTML = "";   

  menu.innerHTML = "";

  const bgVideo = document.getElementById("bgVideo");

  menus[name].forEach(item => {
    const div = document.createElement("div");
    div.className = "menu-item";
    div.textContent = item.text;

    div.onclick = item.action;
    
/////////////* ОПИСАНИЕ СЛОЖНОСТИ (с картинками :) ) *//////////////
//====================================================================================================================
   if (name === "difficulty") {

  div.addEventListener("mouseenter", () => {
    const data = difficultyData[item.text];
    if (!data) return;

    screen.classList.add("active");
    screen.innerHTML = "";

    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.gap = "20px";

    const img = document.createElement("img");
    img.src = `pictures/emojies/${item.text}.png`;
    img.style.width = "60px";
    img.style.height = "60px";

    const text = document.createElement("div");

    const title = document.createElement("div");
    title.textContent = item.text;
    title.style.fontSize = "26px";

    const desc = document.createElement("div");
    desc.textContent = data.desc;
    desc.style.opacity = "0.8";
    desc.className = "description";

    text.appendChild(title);
    text.appendChild(desc);

    container.appendChild(img);
    container.appendChild(text);

    screen.appendChild(container);
  });

  div.addEventListener("mouseleave", () => {
    screen.classList.remove("active");
  });
}


//================================================================================================================

//////////////* ПРИ НАВЕДЕНИИ МЫШИ НА ЛОКАЦИЮ /////////////
    div.onmouseenter = () => {
      if (name === "map" && mapBackgrounds[item.text]) {
        bgVideo.src = mapBackgrounds[item.text];
      }
    };

///////////////* ПРИ ОТВЕДЕНИИ МЫШИ ////////////////
    div.onmouseleave = () => {
        if(name === "map") {
            bgVideo.src = "menu.mp4";
        }
    };

    menu.appendChild(div);
  });
}


///////* СТРАНИЦЫ НАСТРОЕК *////////
function setSetting(name) {
  menu.innerHTML = "";

  ///////////// МУЗЫКА /////////////////

  if (name === "volume") {
    // заголовок
    const label = document.createElement("div");
    label.className = "menu-item";
    label.textContent = "Music volume";

    // ползунок
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = 0;
    slider.max = 1;
    slider.step = 0.01;

    // загрузка сохранённой громкости
    const savedVolume = localStorage.getItem("gameVolume") || 0.5;
    slider.value = savedVolume;

    // изменение громкости
    slider.addEventListener("input", () => {
      setVolume(slider.value);
    });

    // кнопка назад
    const back = document.createElement("div");
    back.className = "menu-item";
    back.textContent = "Back";
    back.onclick = () => setMenu("settings");

    menu.appendChild(label);
    menu.appendChild(slider);
    menu.appendChild(back);
  }


  ///////////* УПРАВЛЕНИЕ *\\\\\\\\\\\\
  else if (name === "control") {

    // заголовок
    const label = document.createElement("div");
    label.className = "menu-item";
    label.textContent = "Controls";

    // text
    const text = document.createElement("div");
    text.className = "menu-item";
    text.textContent = "Bro its just WASD and SHIFT, idk what do you wanna switch :/";

    // кнопка назад
    const back = document.createElement("div");
    back.className = "menu-item";
    back.textContent = "Back";
    back.onclick = () => setMenu("settings");

    menu.appendChild(label);
    menu.appendChild(text);
    menu.appendChild(back);
  }
  
}

   ////////////* КРЕДИТЫ */////////////
 function showCredits() {
     screen.innerHTML = "";

    const title = document.createElement("div");
    title.className = "menu-item";

    const text = document.createElement("div");
    text.className = "menu-item";
    text.style.whiteSpace = "pre-line";
    text.textContent =
    `Name: Project Z

    Gameplay: ArtemKali, Toburetko

    Game designer: Toburetko

    JavaScript: ArtemKali, Toburetko
    Html: Toburetko, ArtemKali
    Canvas: blud its just 1 stroke in code
    Css: Toburetko, ArtemKali

    Music:

    Nujabes - Aruarian dance,
    
            Thx for playing!
    `;
    
    screen.appendChild(title);
    screen.appendChild(text);

    screen.classList.add("active");

}


///////////* ГРОМКОСТЬ МУЗЫКИ */////////////
function setVolume(volume) {
  volume = Math.max(0, Math.min(1, volume));

  localStorage.setItem("gameVolume", volume);  //ZAPISUJE

  music.volume = volume;
}

///////* МУЗЫКА ПРИ ЗАГРУЗКЕ *///////
window.addEventListener("load", () => {
  const savedVolume = localStorage.getItem("gameVolume") || 0.5;
  setVolume(savedVolume);
});

music.loop = true;


//////* START ARCADE *///////
function startGame(difficulty) {
  console.log("Map:", selectedMap);
  console.log("Difficulty:", difficulty);

  music.pause();
  window.location.href = `game/index.html?map=${selectedMap}&difficulty=${difficulty}`;
}

//////* START CAMPAIGN *///////
function startCampaign() {

  window.location.href = "campaign/index.html";

  music.pause();
}

//=================================================================================================================================================
//=========================================== LOGIKA INTRO I URUCHAMIANIA MENU ===================================================================

let introStarted = false;
let musicStarted = false;

////// POCZATKOWO UKRYWAMY MENU /////
menu.style.display = "none";

////// TWORZYMY CZARNY EKRAN "PRESS F11" //////
const f11Overlay = document.createElement("div");
f11Overlay.style.position = "fixed";
f11Overlay.style.top = "0";
f11Overlay.style.left = "0";
f11Overlay.style.width = "100vw";
f11Overlay.style.height = "100vh";
f11Overlay.style.backgroundColor = "black";
f11Overlay.style.color = "white";
f11Overlay.style.display = "flex";
f11Overlay.style.justifyContent = "center";
f11Overlay.style.alignItems = "center";
f11Overlay.style.fontSize = "40px";
f11Overlay.style.fontFamily = "Arial, sans-serif";
f11Overlay.style.zIndex = "10000"; // Wyżej niż wideo
f11Overlay.textContent = "Press F11 to start";
document.body.appendChild(f11Overlay);

////// TWORZYMY ELEMNT WIDEO DO INTRO ///////
const introVideo = document.createElement("video");
introVideo.src = "videos/intro.mp4";
introVideo.style.position = "fixed";
introVideo.style.top = "0";
introVideo.style.left = "0";
introVideo.style.width = "100vw";
introVideo.style.height = "100vh";
introVideo.style.objectFit = "cover"; 
introVideo.style.zIndex = "9999";
introVideo.style.backgroundColor = "black";
document.body.appendChild(introVideo);

////// OBSŁUGA NACIŚNIĘCIA F11 //////
window.addEventListener("keydown", (e) => {
    if (e.key === "F11") {
        if (f11Overlay) {
            f11Overlay.remove(); // Usuwamy czarny экран
            startIntroSequence();
        }
    }
});

function startIntroSequence() {
    if (!introStarted) {
        introStarted = true;
        introVideo.play().catch(() => {
            console.log("Autoplay blocked");
            finishIntro();
        });

        introVideo.onended = () => {
            finishIntro();
        };
    }
}

// =========================================== LOADING LOGIC  =================================================================== //

function finishIntro() {
  ////////// NAJPIERW URUCHAMIAMY POBIERANIE //////
  startLoadingProcess();
  
  /////// PRZYGOTOWUJEMY PRZYCISKI MENU W TLE //////
  menu.style.display = ""; 
  setMenu("main"); 
  
  //////X TYLKO PO TYM USUWAMY INTRO  ///////
  setTimeout(() => {
     if (introVideo) introVideo.remove();
  }, 100);
}

function startLoadingProcess(forceFastSpeed = false) {
    
    ////////// PROCENT SETINGS /////////
    const rarity = {
        fast: 60,    // wolna
        medium: 45,  // srednia
        slow: 5     // slow
    };

    let speedProfile;
    
    if (forceFastSpeed) {
        speedProfile = 1; ////// Принудительно включаем самый быстрый профиль /////
    } else {
        const roll = Math.random() * 100; ////// losuje od 0 do 100 //////

        if (roll <= rarity.fast) {
            speedProfile = 1; 
        } else if (roll <= (rarity.fast + rarity.medium)) {
            speedProfile = 2; 
        } else {
            speedProfile = 3; 
        }
    }

    const overlay = document.createElement("div");
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        display: flex; flex-direction: column;
        justify-content: center; align-items: center; z-index: 10001;
        cursor: default; overflow: hidden;
    `;

    /////////////// TWORZYMY OSOBNA WARSTWE DLA ROZMYTEGO TLA /////////////// (menu.png)
    const blurBackground = document.createElement("div");
    blurBackground.style.cssText = `
        position: absolute; top: -10%; left: -10%; width: 120%; height: 120%;
        background-image: url('pictures/menu.png');
        background-size: cover;
        background-position: center;
        filter: blur(20px);
        z-index: -1;
    `;

    overlay.appendChild(blurBackground);

    const text = document.createElement("div");
    text.style.cssText = `
        color: white; font-family: Arial, sans-serif; font-size: 18px;
        letter-spacing: 2px; margin-bottom: 12px; width: 320px; text-align: left;
        position: relative;
    `;
    text.textContent = "LOADING...";

    const barBorder = document.createElement("div");
    barBorder.style.cssText = `
        width: 320px; height: 30px; border: 3px solid white;
        padding: 4px; box-sizing: border-box; display: flex; 
        gap: 4px; background: rgba(0,0,0,0.8); align-items: center;
        overflow: hidden; box-shadow: 0 0 15px rgba(0,0,0,0.5);
        position: relative;
    `;

    overlay.appendChild(text);
    overlay.appendChild(barBorder);
    document.body.appendChild(overlay);

    let progress = 0;
    const maxBlocks = 18; 
    let blocksSpawned = 0;

    const interval = setInterval(() => {
        let step = 0;
        if (speedProfile === 1) step = Math.random() * 8;
        if (speedProfile === 2) step = Math.random() * 3;
        if (speedProfile === 3) step = progress > 80 ? Math.random() * 0.4 : Math.random() * 2.5;

        progress += step;
        if (progress > 100) progress = 100;

        const blocksNeeded = Math.floor((progress / 100) * maxBlocks);

        while (blocksSpawned < blocksNeeded) {
            const imgBlock = document.createElement("img");
            imgBlock.src = "pictures/1.png"; 
            imgBlock.style.cssText = "height: 100%; width: auto; display: block; object-fit: contain; image-rendering: pixelated;";
            barBorder.appendChild(imgBlock);
            blocksSpawned++;
        }

        if (progress >= 100) {
            clearInterval(interval);
            
            activateMusic();

            setTimeout(() => {
                overlay.style.transition = "opacity 0.6s ease";
                overlay.style.opacity = "0";
                
                setTimeout(() => {
                    overlay.remove();
                }, 600);
            }, 500);
        }
    }, 70);
}

function activateMusic() {
  if (!musicStarted) {
    music.loop = true;
    const savedVolume = localStorage.getItem("gameVolume") || 0.5;
    setVolume(savedVolume);
    music.play().catch(() => console.log("Autoplay blocked"));
    musicStarted = true;
  }
}

////// ПРОВЕРКА: ЕСЛИ МЫ ВЕРНУЛИСЬ ИЗ ИГРЫ — ПРОПУСКАЕМ ИНТРО //////
if (sessionStorage.getItem("skipIntro") === "true") {
    f11Overlay.remove();
    introVideo.remove();
    menu.style.display = ""; 
    setMenu("main");
    
    // Запускаем штатный экран загрузки с принудительно высокой скоростью (speedProfile = 1)
    startLoadingProcess(true);
    
    sessionStorage.removeItem("skipIntro"); // Сбрасываем флаг, чтобы при полном перезаходе интро снова работало
}
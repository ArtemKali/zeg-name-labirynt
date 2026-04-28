const menu = document.getElementById("menu");
const screen = document.getElementById("screen");

const music = new Audio("sounds/aruarian.mp3"); // OBJEKT MUZYKI
music.play(); // wlaczyc muzyke

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
    { text: "New Game", action: () => setMenu("map") },
    { text: "Continue", action: () => console.log("Continue") },
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


  ///////////* УПРАВЛЕНИЕ */////////////
  else if (name === "control") {

    // заголовок
    const label = document.createElement("div");
    label.className = "menu-item";
    label.textContent = "Controls";

    // текст
    const text = document.createElement("div");
    text.className = "menu-item";
    text.textContent = "Bro its just WASD and SHIFT, idk what are you wanna switch :/";

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

let musicStarted = false;

document.addEventListener("click", () => {
  if (!musicStarted) {
    music.loop = true;

    const savedVolume = localStorage.getItem("gameVolume") || 0.5;
    setVolume(savedVolume);

    music.play().catch(() => {
      console.log("Autoplay blocked");
    });

    musicStarted = true;
  }
});


///////* МУЗЫКА ПРИ ЗАГРУЗКЕ *///////
window.addEventListener("load", () => {
  const savedVolume = localStorage.getItem("gameVolume") || 0.5;
  setVolume(savedVolume);
});

music.loop = true;


//////* СТАРТ ИГРЫ *///////
function startGame(difficulty) {
  console.log("Map:", selectedMap);
  console.log("Difficulty:", difficulty);

  music.pause();

  window.location.href = `game/index.html?map=${selectedMap}&difficulty=${difficulty}`;
}

//////////* START *///////////
setMenu("main");
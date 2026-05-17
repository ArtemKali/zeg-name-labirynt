export class Pause {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.isPaused = false;

        ///////// SETTINGS RECTANGLE ///////
        this.panelLeft = 150;   // Отступ слева 
        this.panelWidth = 280;  // Ширина панели 
        this.panelTop = 0;    // Отступ сверху 
        this.panelBottom = 0; // Отступ снизу

        ////// Размеры панели строго по CSS menu //////
        this.panelW = this.panelWidth;
        this.panelX = this.panelLeft; // left: 150px
        this.panelY = this.panelTop;  // top: 40px
        
        /////// Размеры интерактивных элементов для hover-эффекта и рамок //////
        this.btnW = 180;
        this.btnH = 44;

        /////// Вертикальные позиции кнопок внутри панели ///////
        this.resumeBtnY = 0;
        this.menuBtnY = 0;

        ///// Трекинг наведения мыши ////
        this.hoveredBtn = null; // 'continue', 'menu' или null

        window.addEventListener("mousemove", (e) => {
            if (!this.isPaused) return;

            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const btnX = this.panelX + (this.panelW / 2 - this.btnW / 2);

            /////// НАВЕДЕНИЕ НА "Continue" ///////
            if (
                mouseX >= btnX && mouseX <= btnX + this.btnW &&
                mouseY >= this.resumeBtnY && mouseY <= this.resumeBtnY + this.btnH
            ) {
                if (this.hoveredBtn !== "continue") this.hoveredBtn = "continue";
            } 
            /////// НАВЕДЕНИЕ НА "Main Menu" //////
            else if (
                mouseX >= btnX && mouseX <= btnX + this.btnW &&
                mouseY >= this.menuBtnY && mouseY <= this.menuBtnY + this.btnH
            ) {
                if (this.hoveredBtn !== "menu") this.hoveredBtn = "menu";
            } 
            else {
                if (this.hoveredBtn !== null) this.hoveredBtn = null;
            }
        });

        window.addEventListener("click", (e) => {
            if (!this.isPaused) return;

            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const btnX = this.panelX + (this.panelW / 2 - this.btnW / 2);

            ////// КЛИК ПО "Continue" /////
            if (
                mouseX >= btnX &&
                mouseX <= btnX + this.btnW &&
                mouseY >= this.resumeBtnY &&
                mouseY <= this.resumeBtnY + this.btnH
            ) {
                this.toggle();
            }

            ///// КЛИК ПО "Main Menu" /////
            if (
                mouseX >= btnX &&
                mouseX <= btnX + this.btnW &&
                mouseY >= this.menuBtnY &&
                mouseY <= this.menuBtnY + this.btnH
            ) {
                window.location.href = "../index.html"; 
            }
        });
    }

    toggle() {
        this.isPaused = !this.isPaused;
        if (!this.isPaused) {
            this.hoveredBtn = null;
        }
    }

    draw() {
        if (!this.isPaused) return;

        /////// ZACIEMNIENIE GRY ///////
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ////// SETTINGS PAUSY ///
        ////// Высота рассчитывается ровно как calc(100vh - 80px) из оригинального CSS ////
        const winH = this.canvas.height - this.panelTop - this.panelBottom; 

        ////////// ИЗОЛИРУЕМ КОНТЕКСТ ДЛЯ РАЗМЫТИЯ ФОНА С ЧЁТКИМИ КРАЯМИ ПАНЕЛИ /////////
        this.ctx.save();

        this.ctx.beginPath();
        this.ctx.rect(this.panelX, this.panelY, this.panelW, winH);
        this.ctx.clip();

        //// Захватываем и размываем то что находится за панелью ////
        try {
            this.ctx.filter = "blur(8px)";
            this.ctx.drawImage(this.canvas, 0, 0);
            this.ctx.filter = "none";
        } catch (e) {
            this.ctx.filter = "none";
        }

        ////// KONTUR OKNA ////
        this.ctx.fillStyle = "rgba(120, 0, 0, 0.45)"; 
        this.ctx.fillRect(this.panelX, this.panelY, this.panelW, winH);

        this.ctx.restore();

        //////// TEKST ///////
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        
        const centerX = this.panelX + this.panelW / 2;

        ///// Название игры с учетом внутреннего отступа padding 50px ////
        this.ctx.font = "bold 25px 'Trebuchet MS', Gadget, sans-serif";
        ////// Можно менять число 60 ниже чтобы двигать "Zeg-Game" вверх или вниз /////
        this.ctx.fillText("Zeg-Game", centerX, this.panelY + 95);

        //////// Настройка пунктов меню //////////
        this.ctx.fillStyle = "white";
        this.ctx.font = "20px 'Trebuchet MS', Gadget, sans-serif";

        ////// Можно менять число 300 ниже, чтобы двигать ВЕСЬ block кнопок (обе кнопки сразу) вверх или вниз /////
        const startMenuY = this.panelY + 300; 
        this.resumeBtnY = startMenuY;
        this.menuBtnY = startMenuY + 69;

        const btnX = this.panelX + (this.panelW / 2 - this.btnW / 2);

        ///////// Отрисовка текста и рамки для "Continue" .////////
        this.ctx.fillStyle = "white";
        this.ctx.fillText("Continue", centerX, this.resumeBtnY + 28);
        if (this.hoveredBtn === "continue") {
            this.ctx.strokeStyle = "white";
            this.ctx.lineWidth = 1.5; // outline: 1.5px solid white
            this.ctx.strokeRect(btnX, this.resumeBtnY, this.btnW, this.btnH);
        }

        ///////// Отрисовка текста и рамки для "Main Menu" ////////
        this.ctx.fillStyle = "white";
        this.ctx.fillText("Main Menu", centerX, this.menuBtnY + 28);
        if (this.hoveredBtn === "menu") {
            this.ctx.strokeStyle = "white";
            this.ctx.lineWidth = 1.5; // outline: 1.5px solid white
            this.ctx.strokeRect(btnX, this.menuBtnY, this.btnW, this.btnH);
        }

        //// Подказка внизу панели ////
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        this.ctx.font = "bold 12px 'Trebuchet MS', Gadget, sans-serif";
        this.ctx.fillText("ESC to resume", centerX, this.panelY + winH - 30);
        
        this.ctx.textAlign = "left";
    }
}
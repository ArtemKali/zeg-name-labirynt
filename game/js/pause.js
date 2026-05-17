export class Pause {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.isPaused = false;

        // Размеры окна (из твоего метода draw)
        const winW = 300;
        const winH = 170; // Немного увеличил высоту со 150 до 170, чтобы кнопка влезла

        // Координаты окна
        this.x = this.canvas.width / 2 - winW / 2;
        this.y = this.canvas.height / 2 - winH / 2;

        // Размеры и координаты кнопки "В МЕНЮ"
        this.btnW = 140;
        this.btnH = 35;
        this.btnX = this.canvas.width / 2 - this.btnW / 2;
        this.btnY = this.y + 115; // Располагаем внизу окошка

        // Слушаем клики мыши по экрану
        window.addEventListener('click', (e) => this.handleClick(e));
    }

    toggle() {
        this.isPaused = !this.isPaused;
    }

    draw() {
        if (!this.isPaused) return;

        /////// ZACIEMNIENIE GRY ///////
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ////// SETTINGS PAUSY ///
        const winW = 300;
        const winH = 170; 
        const x = this.canvas.width / 2 - winW / 2;
        const y = this.canvas.height / 2 - winH / 2;

        ////// KONTUR OKNA ////
        this.ctx.fillStyle = "#333";
        this.ctx.strokeStyle = "white";
        this.ctx.lineWidth = 4;
        this.ctx.fillRect(x, y, winW, winH);
        this.ctx.strokeRect(x, y, winW, winH);

        //////// TEKST ///////
        this.ctx.fillStyle = "white";
        this.ctx.font = "bold 30px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("ПАУЗА", this.canvas.width / 2, y + 45);

        this.ctx.font = "14px Arial";
        this.ctx.fillText("Нажмите ESC, чтобы выйти", this.canvas.width / 2, y + 85);
        
        /////// КНОПКА "В МЕНЮ" ///////
        this.ctx.fillStyle = "#ff3333"; // Красный цвет кнопки
        this.ctx.fillRect(this.btnX, this.btnY, this.btnW, this.btnH);

        // Обводка кнопки
        this.ctx.strokeStyle = "white";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.btnX, this.btnY, this.btnW, this.btnH);

        // Текст кнопки
        this.ctx.fillStyle = "white";
        this.ctx.font = "bold 14px Arial";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText("В МЕНЮ", this.canvas.width / 2, this.btnY + this.btnH / 2);

        // Возвращаем настройки текста в дефолт
        this.ctx.textBaseline = "alphabetic";
        this.ctx.textAlign = "left";
    }

    handleClick(event) {
        // Если игра не на паузе, клики мимо
        if (!this.isPaused) return;

        // Рассчитываем точные координаты клика внутри канваса
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Проверяем попадание по кнопке "В МЕНЮ"
        if (mouseX >= this.btnX && mouseX <= this.btnX + this.btnW &&
            mouseY >= this.btnY && mouseY <= this.btnY + this.btnH) {
            
            this.isPaused = false;
            window.location.href = "../index.html"; // Переход в меню
        }
    }
}
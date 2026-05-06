export class Pause {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.isPaused = false;
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
        const winH = 150;
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
        this.ctx.fillText("ПАУЗА", this.canvas.width / 2, y + 60);

        this.ctx.font = "18px Arial";
        this.ctx.fillText("Нажмите ESC, чтобы выйти", this.canvas.width / 2, y + 110);
        
        this.ctx.textAlign = "left";
    }
}
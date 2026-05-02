export class Player {
    constructor(tileS) {
        this.tileS = tileS;
        this.img = new Image();
        this.img.src = './sSheet/char_a_p1_0bas_humn_v00.png'; 

        this.spriteW = 64; 
        this.spriteH = 64;
        
        this.frameX = 0; 
        this.frameY = 0; 
        this.frameTimer = 0; 
        this.frameSpeed = 8; 

        this.direction = "down"; 
        this.scale = 1.8; 
    }

    updateAnimation(keys) {
        if (!keys) return;
        let moving = false;
        let isRunning = keys["shift"]; // Проверяем бег

        // 1. Направление
        if (keys["w"] || keys["ц"] || keys["arrowup"]) { this.direction = "up"; moving = true; } 
        else if (keys["s"] || keys["ы"] || keys["arrowdown"]) { this.direction = "down"; moving = true; } 
        else if (keys["a"] || keys["ф"] || keys["arrowleft"]) { this.direction = "left"; moving = true; } 
        else if (keys["d"] || keys["в"] || keys["arrowright"]) { this.direction = "right"; moving = true; }

        if (moving) {
            // Используем стандартные ряды ходьбы 4-7, так как рядов бега в этом файле нет
            if (this.direction === "down") this.frameY = 4;
            if (this.direction === "up") this.frameY = 5;
            if (this.direction === "right") this.frameY = 6;
            if (this.direction === "left") this.frameY = 7;

            this.frameTimer++;
            // Если бежим, кадры меняются каждые 4 тика, если идем — каждые 8
            let speedLimit = isRunning ? 4 : 8; 

            if (this.frameTimer >= speedLimit) {
                this.frameX = (this.frameX + 1) % 6; 
                this.frameTimer = 0;
            }
        } else {
            // Стойка (Idle) ряды 0-3
            if (this.direction === "down") this.frameY = 0;
            if (this.direction === "up") this.frameY = 1;
            if (this.direction === "right") this.frameY = 2;
            if (this.direction === "left") this.frameY = 3;
            this.frameX = 0;
        }
    }

    draw(ctx, pixelX, pixelY) {
        if (!this.img.complete || this.img.naturalWidth === 0) {
            ctx.fillStyle = "red";
            ctx.fillRect(Math.floor(pixelX), Math.floor(pixelY), this.tileS, this.tileS);
            return;
        }

        let drawSize = this.tileS * this.scale;
        let offsetX = (this.tileS - drawSize) / 2;
        let offsetY = this.tileS - drawSize; 

        ctx.drawImage(
            this.img,
            this.frameX * this.spriteW, this.frameY * this.spriteH, 
            this.spriteW, this.spriteH,                            
            Math.floor(pixelX + offsetX), Math.floor(pixelY + offsetY),               
            drawSize, drawSize                                 
        );
    }
}
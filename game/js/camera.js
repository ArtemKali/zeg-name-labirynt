// camera.js

export class Camera {
    constructor(width, height, mapWidth, mapHeight) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;

        this.deadZone = {
            width: width * 0.3,
            height: height * 0.3
        };
    }

    update(playerX, playerY) {
        // 1. Логика слежения (Dead Zone)
        if (playerX - this.x > this.width / 2 + this.deadZone.width / 2) {
            this.x = playerX - (this.width / 2 + this.deadZone.width / 2);
        }
        else if (playerX - this.x < this.width / 2 - this.deadZone.width / 2) {
            this.x = playerX - (this.width / 2 - this.deadZone.width / 2);
        }

        if (playerY - this.y > this.height / 2 + this.deadZone.height / 2) {
            this.y = playerY - (this.height / 2 + this.deadZone.height / 2);
        }
        else if (playerY - this.y < this.height / 2 - this.deadZone.height / 2) {
            this.y = playerY - (this.height / 2 - this.deadZone.height / 2);
        }

        // 2. ВОТ СЮДА ВСТАВЛЯЕМ (Центрирование и ограничение краев)
        // Если карта меньше экрана, центрируем её по горизонтали
        if (this.mapWidth < this.width) {
            this.x = (this.mapWidth - this.width) / 2;
        } else {
            this.x = Math.max(0, Math.min(this.x, this.mapWidth - this.width));
        }

        // Если карта меньше экрана, центрируем её по вертикали
        if (this.mapHeight < this.height) {
            this.y = (this.mapHeight - this.height) / 2;
        } else {
            this.y = Math.max(0, Math.min(this.y, this.mapHeight - this.height));
        }
    }

    apply(ctx) {
        ctx.save();
        ctx.translate(-Math.floor(this.x), -Math.floor(this.y));
    }

    release(ctx) {
        ctx.restore();
    }
}
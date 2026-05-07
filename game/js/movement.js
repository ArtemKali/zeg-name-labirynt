export class Movement {
    constructor(player, map, tileSize) {
        this.player = player;
        this.map = map;
        this.tileS = tileSize;
        this.keys = {};
        
        this.speed = 6; 
        this.margin = 10; 

        this.stamina = 100;       // Текущая стамина
        this.maxStamina = 100;    // Максимум
        this.staminaConsum = 0.5; // Трата за кадр при беге
        this.staminaRegen = 0.3;  // Регенерация
        this.isExhausted = false; // Усталость (когда стамина 0)
        
        this.init();
    }

    init() {
        window.addEventListener("keydown", (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        window.addEventListener("keyup", (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    update() {
        // 1. Сначала определяем направление движения
        let moveX = 0;
        let moveY = 0;

        if (this.keys["w"] || this.keys["arrowup"] || this.keys["ц"]) moveY -= 1;
        if (this.keys["s"] || this.keys["arrowdown"] || this.keys["ы"]) moveY += 1;
        if (this.keys["a"] || this.keys["arrowleft"] || this.keys["ф"]) moveX -= 1;
        if (this.keys["d"] || this.keys["arrowright"] || this.keys["в"]) moveX += 1;

        // 2. Рассчитываем скорость и стамину
        let isMoving = moveX !== 0 || moveY !== 0;
        let isRunning = this.keys["shift"] && !this.isExhausted && isMoving;
        
        let currentSpeed = isRunning ? this.speed * 1.5 : this.speed;

        // Логика траты/регенерации стамины
        if (isRunning) {
            this.stamina -= this.staminaConsum;
            if (this.stamina <= 0) {
                this.stamina = 0;
                this.isExhausted = true; // Запыхался
            }
        } else {
            this.stamina += this.staminaRegen;
            if (this.stamina >= this.maxStamina) this.stamina = this.maxStamina;
            // Если отдохнул (больше 20%), можно снова бежать
            if (this.isExhausted && this.stamina > 20) this.isExhausted = false;
        }

        // 3. Применяем движение
        if (moveX !== 0) this.move(moveX * currentSpeed, 0);
        if (moveY !== 0) this.move(0, moveY * currentSpeed);
    }

    move(dx, dy) {
        let nextPixelX = this.player.pixelX + dx;
        let nextPixelY = this.player.pixelY + dy;

        let points = [
            { x: nextPixelX + this.margin, y: nextPixelY + this.margin },
            { x: nextPixelX + this.tileS - this.margin, y: nextPixelY + this.margin },
            { x: nextPixelX + this.margin, y: nextPixelY + this.tileS - this.margin },
            { x: nextPixelX + this.tileS - this.margin, y: nextPixelY + this.tileS - this.margin }
        ];

        let canMove = points.every(p => {
            let gx = Math.floor(p.x / this.tileS);
            let gy = Math.floor(p.y / this.tileS);
            return this.map[gy] && this.map[gy][gx] !== 1;
        });

        if (canMove) {
            this.player.pixelX = nextPixelX;
            this.player.pixelY = nextPixelY;
        }
    }
}
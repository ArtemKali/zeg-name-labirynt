export class Movement {
    constructor(player, map, tileSize) {
        this.player = player;
        this.map = map;
        this.tileS = tileSize;
        this.keys = {};
        
        this.speed = 4; 
        this.margin = 1; ////////////////// Чем меньше число, тем ближе он к стене /////////////////////

        ////////////////// SETTINGS ХИТБОКСА //////////////////
        this.hitboxL = 10;    // Отступ хитбокса от левого края тайла
        this.hitboxR = 10;    // Отступ хитбокса от правого края тайла
        this.hitboxT = 10;    // ОТСТУП ХИТБОКСА СВЕРХУ
        this.hitboxB = 10;    // ОТСТУП ХИТБОКСА СНИЗУ
        
        this.offsetY = 0;      // Общая корректировка позиции (можно оставить 0)
        this.wallMargin = 5;   // Запас при коллизии со стенами
        
        ///////////// STAMINA SETTINGS ///////////
        this.stamina = 200;          //////// AKTUALNA ILOSC ///////
        this.maxStamina = 200;       /////// MAKSYMALNA ILOSC //////
        this.staminaConsum = 0.3;    ///////// ZURZYCIE STAMINY NA KLATKE PRZY BIEGU /////////
        this.staminaRegen = 0.2;     //////// REGENERACJA STAMINY ///////
        this.isExhausted = false;    //////// FLAGA CALKOWITEGO ZMECZENIA (пока не реген до 20) //////

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

    update(enemies = []) {
        let moveX = 0;
        let moveY = 0;

        ////////// SPRAWDZENIAE NACISKANIA KLAWISZY RUCHU ///////////////
        let isMoving = this.keys["w"] || this.keys["s"] || this.keys["a"] || this.keys["d"] || 
                       this.keys["arrowup"] || this.keys["arrowdown"] || this.keys["arrowleft"] || this.keys["arrowright"] ||
                       this.keys["ц"] || this.keys["ы"] || this.keys["ф"] || this.keys["в"];

        ///////////// LOGIKA BIEGU I STAMINY //////////////
        let shiftPressed = this.keys["shift"];
        let isRunning = shiftPressed && isMoving && !this.isExhausted;
        
        if (isRunning) {
            this.stamina -= this.staminaConsum;
            if (this.stamina <= 0) {
                this.stamina = 0;
                this.isExhausted = true; /////// ZMECZYL SIE, BIEG BLOKUJE ///////
            }
        } else {
            /////////// REGENERUJE TYLKO WTEDY GDY 'SHIFT' NIE WCISNIETY ////////////
            if (!shiftPressed && this.stamina < this.maxStamina) {
                this.stamina += this.staminaRegen;
            }
            
            ////////// JESLI ODPOCZALES DO 20% MOZESZ BIEGNAC //////////
            if (this.isExhausted && this.stamina >= 20) {
                this.isExhausted = false;
            }
        }

        let currentSpeed = isRunning ? this.speed * 1.5 : this.speed;

        if (this.keys["w"] || this.keys["arrowup"] || this.keys["ц"]) moveY -= currentSpeed;
        if (this.keys["s"] || this.keys["arrowdown"] || this.keys["ы"]) moveY += currentSpeed;
        if (this.keys["a"] || this.keys["arrowleft"] || this.keys["ф"]) moveX -= currentSpeed;
        if (this.keys["d"] || this.keys["arrowright"] || this.keys["в"]) moveX += currentSpeed;

        if (moveX !== 0 || moveY !== 0) {
            this.move(moveX, moveY, enemies);
        }
    }

    drawStamina(ctx, canvas) {
        let width = 200;
        let height = 20;
        let x = canvas.width - width - 20;
        let y = 20;

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(x, y, width, height);

        ctx.fillStyle = this.isExhausted ? "red" : "yellow";
        let currentWidth = (this.stamina / this.maxStamina) * width;
        ctx.fillRect(x, y, currentWidth, height);

        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }

    canMove(nx, ny, enemies) {
        // Вычисляем границы аналогично ширине: отступ сверху и отступ снизу
        let x1 = nx + this.hitboxL;
        let x2 = nx + this.tileS - this.hitboxR;
        let y1 = ny + this.hitboxT + this.offsetY;
        let y2 = ny + this.tileS - this.hitboxB + this.offsetY;

        /////// SPRAWDZANIE SCIAN Z ZAPASEM ///////
        let wallPoints = [
            { x: x1 + this.wallMargin, y: y1 + this.wallMargin },
            { x: x2 - this.wallMargin, y: y1 + this.wallMargin },
            { x: x1 + this.wallMargin, y: y2 - this.wallMargin },
            { x: x2 - this.wallMargin, y: y2 - this.wallMargin }
        ];

        let canMoveMap = wallPoints.every(p => {
            let gx = Math.floor(p.x / this.tileS);
            let gy = Math.floor(p.y / this.tileS);
            return this.map[gy] && this.map[gy][gx] !== 1 && this.map[gy][gx] !== 9;
        });

        if (!canMoveMap) return false;

        ///////// SPRAWDZANIE KOLIZJI Z WROGAMI /////////
        let playerHitboxNext = {
            left: x1,
            right: x2,
            top: y1,
            bottom: y2,
            centerX: (x1 + x2) / 2,
            centerY: (y1 + y2) / 2
        };

        let currX1 = this.player.pixelX + this.hitboxL;
        let currX2 = this.player.pixelX + this.tileS - this.hitboxR;
        let currY1 = this.player.pixelY + this.hitboxT + this.offsetY;
        let currY2 = this.player.pixelY + this.tileS - this.hitboxB + this.offsetY;

        let playerHitboxCurrent = {
            left: currX1,
            right: currX2,
            top: currY1,
            bottom: currY2,
            centerX: (currX1 + currX2) / 2,
            centerY: (currY1 + currY2) / 2
        };

        let collidesWithEnemy = enemies.some(enemy => {
            let enemyBox = {
                left: enemy.pixelX,
                right: enemy.pixelX + enemy.size,
                top: enemy.pixelY,
                bottom: enemy.pixelY + enemy.size,
                centerX: enemy.pixelX + enemy.size / 2,
                centerY: enemy.pixelY + enemy.size / 2
            };

            let isIntersectingNext = playerHitboxNext.left < enemyBox.right &&
                                     playerHitboxNext.right > enemyBox.left &&
                                     playerHitboxNext.top < enemyBox.bottom &&
                                     playerHitboxNext.bottom > enemyBox.top;

            if (!isIntersectingNext) return false;

            let isIntersectingNow = playerHitboxCurrent.left < enemyBox.right &&
                                    playerHitboxCurrent.right > enemyBox.left &&
                                    playerHitboxCurrent.top < enemyBox.bottom &&
                                    playerHitboxCurrent.bottom > enemyBox.top;

            if (isIntersectingNow) {
                let distNow = Math.hypot(playerHitboxCurrent.centerX - enemyBox.centerX, playerHitboxCurrent.centerY - enemyBox.centerY);
                let distNext = Math.hypot(playerHitboxNext.centerX - enemyBox.centerX, playerHitboxNext.centerY - enemyBox.centerY);
                return distNext <= distNow; 
            }

            return true; 
        });

        return !collidesWithEnemy;
    }

    move(dx, dy, enemies = []) {
        if (this.canMove(this.player.pixelX + dx, this.player.pixelY, enemies)) {
            this.player.pixelX += dx;
        }

        if (this.canMove(this.player.pixelX, this.player.pixelY + dy, enemies)) {
            this.player.pixelY += dy;
        }

        this.player.x = Math.floor((this.player.pixelX + this.tileS / 2) / this.tileS);
        this.player.y = Math.floor((this.player.pixelY + this.tileS / 2) / this.tileS);
    }
}
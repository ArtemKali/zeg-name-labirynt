export class Movement {
    constructor(player, map, tileSize) {
        this.player = player;
        this.map = map;
        this.tileS = tileSize;
        this.keys = {};
        
        this.speed = 4; 
        this.margin = 1; ////////////////// Чем меньше число, тем ближе он к стене /////////////////////
        
        ///////////// STAMINA SETTINGS ///////////
        this.stamina = 100;          //////// AKTUALNA ILOSC ///////
        this.maxStamina = 100;       /////// MAKSYMALNA ILOSC //////
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

    //////////// METODA DLA RYSOWANIA KRESKI STAMINY //////////////
    drawStamina(ctx, canvas) {
        let width = 200;
        let height = 20;
        let x = canvas.width - width - 20;
        let y = 20;

        //// BACKGROUND KRESKI ////
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(x, y, width, height);

        ////// KOLOR ZMIENIA SIE PRZY ZMECZENIU //////
        ctx.fillStyle = this.isExhausted ? "red" : "yellow";
        let currentWidth = (this.stamina / this.maxStamina) * width;
        ctx.fillRect(x, y, currentWidth, height);

        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }

    /////////// FUNKCJA POMOCNICZA DO SPRAWDZANIA KOLIZJI W KONKRETNYM PUNKCIE /////////////
    canMoveTo(nx, ny, enemies) {
        let hitboxSize = 60; 
        let off = (this.tileS - hitboxSize) / 2; 

        /////// SPRAWDZANIE SCIAN Z ZAPASEM (zeby nie utknac w rogach) ///////
        let wallMargin = 6; //////// O ILE PIKSELI HITBOX BEDZIE 'BARDZEJ USTEPLIWY' WOBEC SCIAN /////////
        let wallPoints = [
            { x: nx + off + wallMargin, y: ny + off + wallMargin },
            { x: nx + off + hitboxSize - wallMargin, y: ny + off + wallMargin },
            { x: nx + off + wallMargin, y: ny + off + hitboxSize - wallMargin },
            { x: nx + off + hitboxSize - wallMargin, y: ny + off + hitboxSize - wallMargin }
        ];

        let canMoveMap = wallPoints.every(p => {
            let gx = Math.floor(p.x / this.tileS);
            let gy = Math.floor(p.y / this.tileS);
            return this.map[gy] && this.map[gy][gx] !== 1;
        });

        if (!canMoveMap) return false;

        ///////// SPRAWDZANIE KOLIZJI Z WROGAMI /////////
        let playerHitboxNext = {
            left: nx + off,
            right: nx + off + hitboxSize,
            top: ny + off,
            bottom: ny + off + hitboxSize,
            centerX: nx + off + hitboxSize / 2,
            centerY: ny + off + hitboxSize / 2
        };

        let playerHitboxCurrent = {
            centerX: this.player.pixelX + off + hitboxSize / 2,
            centerY: this.player.pixelY + off + hitboxSize / 2,
            left: this.player.pixelX + off,
            right: this.player.pixelX + off + hitboxSize,
            top: this.player.pixelY + off,
            bottom: this.player.pixelY + off + hitboxSize
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
        ////// PROBUJEMY PORUSZAC SIE OSOBNO WZDLUZ X, POTEM OSOBNO WZDLUZ Y
        
        //// PROBUJEMY ZASTOSOWAC RUCH PO X
        if (this.canMoveTo(this.player.pixelX + dx, this.player.pixelY, enemies)) {
            this.player.pixelX += dx;
        }

        //// PROBOJEMY ZASTOSOWAC RUCH PO Y
        if (this.canMoveTo(this.player.pixelX, this.player.pixelY + dy, enemies)) {
            this.player.pixelY += dy;
        }

        this.player.x = Math.floor((this.player.pixelX + this.tileS / 2) / this.tileS);
        this.player.y = Math.floor((this.player.pixelY + this.tileS / 2) / this.tileS);
    }
}
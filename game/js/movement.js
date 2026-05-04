export class Movement {
    constructor(player, map, tileSize) {
        this.player = player;
        this.map = map;
        this.tileS = tileSize;
        this.keys = {};
        
        this.speed = 6; 
        this.margin = 10; ////////////////// Чем меньше число, тем ближе он к стене /////////////////////
        
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
        let moveX = 0;
        let moveY = 0;

        let currentSpeed = this.keys["shift"] ? this.speed * 1.5 : this.speed;

        if (this.keys["w"] || this.keys["arrowup"] || this.keys["ц"]) moveY -= currentSpeed;
        if (this.keys["s"] || this.keys["arrowdown"] || this.keys["ы"]) moveY += currentSpeed;
        if (this.keys["a"] || this.keys["arrowleft"] || this.keys["ф"]) moveX -= currentSpeed;
        if (this.keys["d"] || this.keys["arrowright"] || this.keys["в"]) moveX += currentSpeed;

        /////////////////// Раздельное движение для плавного скольжения вдоль стен
        if (moveX !== 0) this.move(moveX, 0);
        if (moveY !== 0) this.move(0, moveY);
    }

    move(dx, dy) {
        let nextPixelX = this.player.pixelX + dx;
        let nextPixelY = this.player.pixelY + dy;

        /////////// 4 tochki hitboxa ///////////\
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
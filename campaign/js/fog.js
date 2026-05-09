export class Fog {
    constructor(mapWidth, mapHeight, tileSize) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.tileSize = tileSize;

        //////////// SETTINGS ///////////
        this.config = {
            revealRadius: 5,         
            fogColor: 'black',       
            opacity: 1.0,            
            smoothReveal: true       
        };

        ///// siatka odwiedzonych kafelkow (false - ujryte, tru - otwarte) /////
        this.visited = Array.from({ length: mapHeight }, () => new Array(mapWidth).fill(false));
    }

    update(playerX, playerY) {
        const gridX = Math.floor((playerX + this.tileSize / 2) / this.tileSize);
        const gridY = Math.floor((playerY + this.tileSize / 2) / this.tileSize);
        const r = this.config.revealRadius;

        for (let y = gridY - r; y <= gridY + r; y++) {
            for (let x = gridX - r; x <= gridX + r; x++) {
                if (y >= 0 && y < this.mapHeight && x >= 0 && x < this.mapWidth) {
                    const dx = x - gridX;
                    const dy = y - gridY;
                    if (dx * dx + dy * dy <= r * r) {
                        this.visited[y][x] = true; //// Oznaczamy komorke jako widziana ////
                    }
                }
            }
        }
    }

    draw(ctx, camera) {
        ctx.save();
        ctx.fillStyle = this.config.fogColor;
        ctx.globalAlpha = this.config.opacity;

        // Если в объекте camera нет width/height (из-за зума), используем размеры canvas
        const viewW = camera.width || ctx.canvas.width;
        const viewH = camera.height || ctx.canvas.height;

        const startX = Math.max(0, Math.floor(camera.x / this.tileSize));
        const startY = Math.max(0, Math.floor(camera.y / this.tileSize));
        
        // Добавляем запас +2, чтобы туман не обрезался по краям при движении
        const endX = Math.min(this.mapWidth, Math.ceil((camera.x + viewW) / this.tileSize) + 2);
        const endY = Math.min(this.mapHeight, Math.ceil((camera.y + viewH) / this.tileSize) + 2);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (!this.visited[y][x]) {
                    // Используем Math.floor для отрисовки, чтобы не было щелей между плитками
                    ctx.fillRect(
                        x * this.tileSize, 
                        y * this.tileSize, 
                        this.tileSize + 1, 
                        this.tileSize + 1
                    );
                }
            }
        }
        ctx.restore();
    }
}
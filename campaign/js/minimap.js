export class Minimap {
    constructor(canvas, ctx, tileSize) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.mapTileSize = 15; 
        this.fullMapTileSize = 30; ///// rozmiar kafelka dla duzej mapy /////
        this.margin = 20;
        this.isFullMap = false; ///// domyslnie zamkniete //
    }

    /// metoda dla otwarcia/zmkniecia //
    toggle() {
        this.isFullMap = !this.isFullMap;
    }

    draw(grid, visited, playerX, playerY, gameTileSize) {
        if (!this.isFullMap) return;

        const rows = grid.length;
        const cols = grid[0].length;

        const currentTileSize = this.fullMapTileSize;
        const mapW = cols * currentTileSize;
        const mapH = rows * currentTileSize;

        //// tlo na caly ekran
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        ////// center
        let startX = (this.canvas.width - mapW) / 2;
        let startY = (this.canvas.height - mapH) / 2;

        ////// title
        this.ctx.fillStyle = "white";
        this.ctx.font = "bold 40px Arial";
        this.ctx.textAlign = "center";
        // this.ctx.fillText("Mapa lokacji", this.canvas.width / 2, startY - 40);   '''tekst nad mapa jesli trzeba'''
        
        this.ctx.font = "20px Arial";
        this.ctx.fillText("Нажмите 'M', чтобы закрыть", this.canvas.width / 2, startY + mapH + 40);
        this.ctx.textAlign = "left";

        /////// Podklad samej mapy
        this.ctx.fillStyle = "rgba(20, 20, 20, 0.9)";
        this.ctx.fillRect(startX - 10, startY - 10, mapW + 20, mapH + 20);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (visited[y] && visited[y][x]) {
                    if (grid[y][x] === 1) {
                        this.ctx.fillStyle = "#555"; 
                    } else if (grid[y][x] >= 4 && grid[y][x] <= 8) {
                        this.ctx.fillStyle = "#00ffff"; 
                    } else if (grid[y][x] === 2) {
                        this.ctx.fillStyle = "orange";
                    } else if (grid[y][x] === 9) {
                        this.ctx.fillStyle = "#111"; 
                    } else {
                        this.ctx.fillStyle = "#222"; 
                    }
                    this.ctx.fillRect(
                        startX + x * currentTileSize,
                        startY + y * currentTileSize,
                        currentTileSize,
                        currentTileSize
                    );
                }
            }
        }

        //////// PLAYER ON MAP ////// 
        const pX = (playerX / gameTileSize) * currentTileSize + (currentTileSize / 2);
        const pY = (playerY / gameTileSize) * currentTileSize + (currentTileSize / 2);
        
        this.ctx.fillStyle = "red";
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = "red";
        this.ctx.beginPath();
        this.ctx.arc(startX + pX, startY + pY, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.ctx.strokeStyle = "white";
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(startX - 10, startY - 10, mapW + 20, mapH + 20);
    }
}
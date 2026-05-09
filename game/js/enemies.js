export class Enemy {
    constructor(startX, startY, waypoints, map, tileSize) {
        this.tileS = tileSize;
        this.size = 60; 
        this.offset = (this.tileS - this.size) / 2;
        
        //////// POZYCJA W PIXELACH ////////
        this.pixelX = startX * this.tileS + this.offset;
        this.pixelY = startY * this.tileS + this.offset;
        
        ////// WAYPOINTY ZOSTAWIONE (ZGODNOSC Z campaign.js) ////////
        this.map = map;
        this.speed = 5; 
        this.chaseSpeed = 5.5; 
        
        this.path = []; 
        
        ///////// STANY AI /////////
        this.state = 'PATROL';
        this.visionRange = 450; 
        this.lastPlayerGridPos = { x: -1, y: -1 }; 
        this.searchTimer = 0;
        this.lookAngle = 0; 
        this.searchDirections = [0, Math.PI/2, Math.PI, Math.PI*1.5]; 
        this.currentSearchStep = 0;

        ///////// LOSOWY PATROL /////////
        this.visitedPoints = [];
        this.currentTarget = null;

        ///////// FIELD OF VIEW /////////
        this.fov = Math.PI * 0.8; 

        ///////// DETEKCJA OD TYLU /////////
        this.suspicionRange = 120; /////// SLYSZY ///////
        this.panicRange = 70;      /////// WIDZI Z BLISKA ///////
    }

    //////////// SPRAWDZANIE WIDOCZNOSCI GRACZA (RAYCASTING) ////////////
    canSeePlayer(player) {
        let dx = (player.pixelX + this.tileS/2) - (this.pixelX + this.size/2);
        let dy = (player.pixelY + this.tileS/2) - (this.pixelY + this.size/2);
        let distance = Math.sqrt(dx * dx + dy * dy);

        ///////// POZA ZASIEGIEM /////////
        if (distance > this.visionRange) return false;

        ///////// FOV + SLUCH /////////
        if (this.state !== 'CHASE') {
            let angleToPlayer = Math.atan2(dy, dx);
            let diff = angleToPlayer - this.lookAngle;

            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;

            ///////// POZA KATEM WIDZENIA /////////
            if (Math.abs(diff) > this.fov / 2) {

                /////// W ZASIEGU PANIKI ///////
                if (distance < this.panicRange) return true;
                
                /////// PODEJRZENIE ///////
                if (distance < this.suspicionRange) {
                    if (this.state === 'PATROL') {
                        this.state = 'SEARCH';
                        this.searchTimer = 60;
                    }
                    return false;
                }
                return false;
            }
        }

        ///////// RAYCAST /////////
        let steps = Math.floor(distance / 10);
        for (let i = 1; i <= steps; i++) {
            let checkX = this.pixelX + this.size/2 + (dx / steps) * i;
            let checkY = this.pixelY + this.size/2 + (dy / steps) * i;

            let gx = Math.floor(checkX / this.tileS);
            let gy = Math.floor(checkY / this.tileS);

            ///////// SCIANA BLOKUJE WIDOK /////////
            if (this.map[gy] && (this.map[gy][gx] === 1 || this.map[gy][gx] === 9)) return false; 
        }

        return true;
    }

    //////////// PATHFINDING (A*) ////////////
    findPath(startX, startY, targetX, targetY) {

        ///////// CEL W SCIANIE /////////
        if (this.map[targetY] === undefined || 
            this.map[targetY][targetX] === undefined || 
            this.map[targetY][targetX] === 1 ||
            this.map[targetY][targetX] === 9) return [];

        let openSet = [{ x: startX, y: startY, g: 0, f: 0, parent: null }];
        let closedSet = new Set();

        let heuristic = (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2);

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.f - b.f);
            let current = openSet.shift();

            ///////// DOTARL DO CELU /////////
            if (current.x === targetX && current.y === targetY) {
                let path = [];
                let curr = current;

                while (curr !== null) {
                    path.push({ x: curr.x, y: curr.y });
                    curr = curr.parent;
                }

                return path.reverse();
            }

            closedSet.add(`${current.x},${current.y}`);

            ///////// RUCH KRZYZOWY /////////
            let neighbors = [
                { x: current.x, y: current.y - 1 },
                { x: current.x, y: current.y + 1 },
                { x: current.x - 1, y: current.y },
                { x: current.x + 1, y: current.y }
            ];

            for (let n of neighbors) {
                if (n.y < 0 || n.y >= this.map.length || n.x < 0 || n.x >= this.map[0].length) continue;
                if (this.map[n.y][n.x] === 1 || this.map[n.y][n.x] === 9) continue;
                if (closedSet.has(`${n.x},${n.y}`)) continue;

                let gScore = current.g + 1;
                let hScore = heuristic(n.x, n.y, targetX, targetY);
                let fScore = gScore + hScore;

                let existing = openSet.find(node => node.x === n.x && node.y === n.y);

                if (existing) {
                    if (gScore < existing.g) {
                        existing.g = gScore;
                        existing.f = fScore;
                        existing.parent = current;
                    }
                } else {
                    openSet.push({ x: n.x, y: n.y, g: gScore, f: fScore, parent: current });
                }
            }
        }

        return [];
    }

    //////////// LOSOWY CEL PATROLU ////////////
    getRandomPatrolTarget(currentX, currentY) {
        let validPoints = [];

        ///////// SZUKANIE WOLNYCH POL /////////
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {

                if (this.map[y][x] !== 1 && this.map[y][x] !== 9 && this.map[y][x] !== 2 && this.map[y][x] < 4) {
                    
                    let isCurrent = (x === currentX && y === currentY);
                    let inHistory = this.visitedPoints.some(p => p.x === x && p.y === y);

                    if (!isCurrent && !inHistory) {
                        validPoints.push({ x, y });
                    }
                }
            }
        }

        ///////// BRAK OPCJI -> RESET /////////
        if (validPoints.length === 0) {
            this.visitedPoints = [];
            return { x: currentX, y: currentY }; 
        }

        ///////// LOSOWANIE /////////
        let randomIndex = Math.floor(Math.random() * validPoints.length);
        let chosenPoint = validPoints[randomIndex];

        ///////// HISTORIA /////////
        this.visitedPoints.push(chosenPoint);
        if (this.visitedPoints.length > 7) {
            this.visitedPoints.shift();
        }

        return chosenPoint;
    }

    update(player) {
        let enemyGridX = Math.floor((this.pixelX + this.size/2) / this.tileS);
        let enemyGridY = Math.floor((this.pixelY + this.size/2) / this.tileS);
        
        let playerGridX = Math.floor((player.pixelX + this.tileS/2) / this.tileS);
        let playerGridY = Math.floor((player.pixelY + 45) / this.tileS);

        let seesPlayer = this.canSeePlayer(player);

        ///////// JESLI WIDZI GRACZA /////////
        if (seesPlayer) {
            this.state = 'CHASE';

            if (playerGridX !== this.lastPlayerGridPos.x || playerGridY !== this.lastPlayerGridPos.y) {
                this.lastPlayerGridPos = { x: playerGridX, y: playerGridY };

                this.path = this.findPath(enemyGridX, enemyGridY, playerGridX, playerGridY);

                if (this.path.length > 0 && this.path[0].x === enemyGridX && this.path[0].y === enemyGridY) {
                    this.path.shift();
                }
            }
        }

        ///////// ZGUBIL GRACZA /////////
        else if (this.state === 'CHASE') {
            if (this.path.length === 0) {
                this.state = 'SEARCH';
                this.searchTimer = 120;
                this.currentSearchStep = 0;
            }
        }

        ///////// LOGIKA RUCHU /////////
        if (this.state === 'CHASE') {
            this.followPath(this.chaseSpeed);
        } else if (this.state === 'SEARCH') {
            this.searchLogic(enemyGridX, enemyGridY);
        } else {

            ///////// PATROL /////////
            if (this.path.length === 0) {
                this.currentTarget = this.getRandomPatrolTarget(enemyGridX, enemyGridY);
                
                if (this.currentTarget) {
                    this.path = this.findPath(enemyGridX, enemyGridY, this.currentTarget.x, this.currentTarget.y);

                    if (this.path.length > 0 && this.path[0].x === enemyGridX && this.path[0].y === enemyGridY) {
                        this.path.shift();
                    }
                }
            }

            this.followPath(this.speed);
        }
    }

    followPath(currentSpeed) {
        if (this.path.length > 0) {
            let nextNode = this.path[0];

            let targetPX = nextNode.x * this.tileS + this.offset;
            let targetPY = nextNode.y * this.tileS + this.offset;

            let dx = targetPX - this.pixelX;
            let dy = targetPY - this.pixelY;
            let dist = Math.sqrt(dx * dx + dy * dy);

            ///////// DOTARL DO TILE /////////
            if (dist <= currentSpeed) {
                this.pixelX = targetPX;
                this.pixelY = targetPY;
                this.path.shift();
            } else {
                ///////// RUCH /////////
                this.pixelX += (dx / dist) * currentSpeed;
                this.pixelY += (dy / dist) * currentSpeed;
                this.lookAngle = Math.atan2(dy, dx);
            }
        }
    }

    searchLogic(gx, gy) {
        this.searchTimer--;

        ///////// ZMIANA KIERUNKU CO 15 KLATEK /////////
        if (this.searchTimer % 15 === 0) {
            const lookDirections = [
                0,
                Math.PI / 2,
                Math.PI,
                Math.PI * 1.5
            ];

            let nextDir = lookDirections[this.currentSearchStep % lookDirections.length];
            
            let lookX = gx + Math.round(Math.cos(nextDir));
            let lookY = gy + Math.round(Math.sin(nextDir));

            ///////// NIE PATRZY W SCIANE /////////
            if (this.map[lookY] && this.map[lookY][lookX] === 0) {
                this.lookAngle = nextDir;
            }
            
            this.currentSearchStep++;
        }

        ///////// KONIEC SEARCH /////////
        if (this.searchTimer <= 0) {
            this.state = 'PATROL';
            this.path = []; 
            this.lastPlayerPos = { x: -1, y: -1 };
            this.currentSearchStep = 0;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.state === 'CHASE' ? "red" : (this.state === 'SEARCH' ? "orange" : "purple");
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;

        ctx.fillRect(Math.floor(this.pixelX), Math.floor(this.pixelY), this.size, this.size);
        ctx.strokeRect(Math.floor(this.pixelX), Math.floor(this.pixelY), this.size, this.size);

        let dotDist = 25; 
        let dotX = (this.pixelX + this.size/2) + Math.cos(this.lookAngle) * dotDist;
        let dotY = (this.pixelY + this.size/2) + Math.sin(this.lookAngle) * dotDist;

        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
        ctx.fill();
    }
}
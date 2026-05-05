export class Inventory {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.items = []; ////////////////// INWENTARZ GRACZA /////////////////
        this.currentChest = null; ////////////////// AKTUALNIE OTWARTY SKRZYNIA /////////////////
        this.isOpen = false; ////////////////// CZY OTWARTY INVENTARZ (F) /////////////////

        ////////////////// USTAWIENIA OKIEN /////////////////
        this.winW = 400;
        this.winH = 400;
        this.gap = 40; ////////////////// ODSTEP MIEDZY OKNAMI /////////////////

        ////////////////// ZMIENNE DO DRAG & DROP /////////////////
        this.draggedItem = null;
        this.dragSource = null; ////////////////// 'inventory' LUB 'chest' /////////////////
        this.mouseX = 0;
        this.mouseY = 0;

        this.onDropItem = null; ////////// Callback для обработки выброса в campaign.js ///////

        this.initEvents();
    }

    initEvents() {
        window.addEventListener("mousedown", (e) => this.handleMouseDown(e.clientX, e.clientY));
        window.addEventListener("mousemove", (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        window.addEventListener("mouseup", (e) => this.handleMouseUp(e.clientX, e.clientY));
    }

    ////////////////// METODA DO CZYSZCZENIA INWENTARZA /////////////////
    clear() {
        this.items = [];
    }

    ////////////////// SPRAWDZAMY CZY UI AKTYWNE /////////////////
    isUIActive() {
        return this.isOpen || this.currentChest !== null;
    }

    handleMouseDown(mx, my) {
        if (!this.isUIActive()) return;

        const { invX, chestX, startY } = this.getLayout();

        ////////////////// KLIK W INVENTARZ /////////////////
        if (mx > invX && mx < invX + this.winW && my > startY && my < startY + this.winH) {
            const index = Math.floor((my - (startY + 80)) / 40);
            if (this.items[index]) {
                this.draggedItem = this.items.splice(index, 1)[0];
                this.dragSource = 'inventory';
            }
        }
        ////////////////// KLIK W SKRZYNIE /////////////////
        else if (this.currentChest && mx > chestX && mx < chestX + this.winW && my > startY && my < startY + this.winH) {
            const index = Math.floor((my - (startY + 80)) / 40);
            if (this.currentChest.items[index]) {
                this.draggedItem = this.currentChest.items.splice(index, 1)[0];
                this.dragSource = 'chest';
            }
        }
    }

    handleMouseUp(mx, my) {
        if (!this.draggedItem) return;

        const { invX, chestX, startY, dropZone } = this.getLayout();

        ////////////////// UPUSZCZENIE DO STREFY WYRZUCANIA /////////////////
        if (mx > dropZone.x && mx < dropZone.x + dropZone.w && my > dropZone.y && my < dropZone.y + dropZone.h) {
            // Если есть функция-обработчик, вызываем её
            if (this.onDropItem) {
                this.onDropItem(this.draggedItem);
            }
        }
        ////////////////// UPUSZCZENIE DO INVENTARZA /////////////////
        else if (mx > invX && mx < invX + this.winW && my > startY && my < startY + this.winH) {
            this.items.push(this.draggedItem);
        }
        ////////////////// UPUSZCZENIE DO SKRZYNI /////////////////
        else if (this.currentChest && mx > chestX && mx < chestX + this.winW && my > startY && my < startY + this.winH) {
            this.currentChest.items.push(this.draggedItem);
        }
        ////////////////// POWROT NA MIEJSCE JESLI NIE TRAFIONO /////////////////
        else {
            if (this.dragSource === 'inventory') this.items.push(this.draggedItem);
            else this.currentChest.items.push(this.draggedItem);
        }

        this.draggedItem = null;
        this.dragSource = null;
    }

    getLayout() {
        const startY = (this.canvas.height - this.winH) / 2;
        let invX, chestX;

        if (this.currentChest) {
            ////////////////// INVENTARZ LEWO, SKRZYNIA PRAWO /////////////////
            invX = this.canvas.width / 2 - this.winW - this.gap / 2;
            chestX = this.canvas.width / 2 + this.gap / 2;
        } else {
            ////////////////// INVENTARZ NA SRODKU /////////////////
            invX = (this.canvas.width - this.winW) / 2;
            chestX = -1000;
        }

        const dropZone = {
            x: 50,
            y: startY,
            w: 150,
            h: this.winH
        };

        return { invX, chestX, startY, dropZone };
    }

    draw() {
        if (!this.isUIActive()) return;

        ////////////////// CIEMNE TLO /////////////////
        this.ctx.fillStyle = "rgba(0,0,0,0.7)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const { invX, chestX, startY, dropZone } = this.getLayout();

        ////////////////// RYSOWANIE STREFY WYRZUCANIA /////////////////
        this.ctx.fillStyle = "rgba(200, 50, 50, 0.3)";
        this.ctx.strokeStyle = "red";
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        this.ctx.fillRect(dropZone.x, dropZone.y, dropZone.w, dropZone.h);
        this.ctx.strokeRect(dropZone.x, dropZone.y, dropZone.w, dropZone.h);
        this.ctx.setLineDash([]);

        this.ctx.fillStyle = "white";
        this.ctx.font = "bold 18px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("ВЫБРОСИТЬ", dropZone.x + dropZone.w / 2, dropZone.y + dropZone.h / 2);
        this.ctx.textAlign = "left";

        ////////////////// RYSOWANIE INVENTARZA /////////////////
        this.drawWindow("Ваш Инвентарь", this.items, invX, startY);

        ////////////////// RYSOWANIE SKRZYNI /////////////////
        if (this.currentChest) {
            this.drawWindow("Сундук", this.currentChest.items, chestX, startY);
        }

        ////////////////// RYSOWANIE PRZECIAGANEJ RZECzy///////////////
        if (this.draggedItem) {
            this.ctx.fillStyle = "yellow";
            this.ctx.font = "bold 20px Arial";
            this.ctx.fillText(this.draggedItem, this.mouseX - 20, this.mouseY);
        }
    }

    drawWindow(title, items, x, y) {
        this.ctx.fillStyle = "#444";
        this.ctx.strokeStyle = "white";
        this.ctx.lineWidth = 5;
        this.ctx.fillRect(x, y, this.winW, this.winH);
        this.ctx.strokeRect(x, y, this.winW, this.winH);

        this.ctx.fillStyle = "white";
        this.ctx.font = "bold 22px Arial";
        this.ctx.fillText(title, x + 20, y + 50);

        this.ctx.font = "18px Arial";
        if (items.length === 0) {
            ////////////////// PUSTY INVENTARZ /////////////////
            this.ctx.fillStyle = "#888";
            this.ctx.fillText("Пусто...", x + 20, y + 100);
        } else {
            ////////////////// LISTA ITEMS /////////////////
            items.forEach((item, i) => {
                this.ctx.fillStyle = "white";
                this.ctx.fillText(`${i + 1}. ${item}`, x + 20, y + 100 + (i * 40));
            });
        }
    }
}
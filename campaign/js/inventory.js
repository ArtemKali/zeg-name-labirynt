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
        this.dragIndex = null; // Позволяет фиксировать место предмета
        this.mouseX = 0;
        this.mouseY = 0;

        this.clickTime = 0; // Для определения клика/перетаскивания

        ////////////////// КОНТЕКСТНОЕ МЕНЮ (КНОПКА ИСПОЛЬЗОВАТЬ) /////////////////
        this.contextMenu = { visible: false, x: 0, y: 0, w: 140, h: 36, itemIndex: null };

        this.onDropItem = null; ////////// Callback dla obrabotki wybroca w campaign.js ///////
        this.onUseItem = null;  ////////// CALLBACK DO UZYWANIA PRZEDMIOTOW (np. KLUCZA) //////

        this.initEvents();
    }

    initEvents() {
        window.addEventListener("mousedown", (e) => this.handleMouseDown(e.clientX, e.clientY, e.button));
        window.addEventListener("mousemove", (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        window.addEventListener("mouseup", (e) => this.handleMouseUp(e.clientX, e.clientY, e.button));
        
        // Blokujemy standartowe menu brauzera, chtoby rabotal prawyj klik w igre
        window.addEventListener("contextmenu", (e) => e.preventDefault());
    }

    ////////////////// METODA DO CZYSZCZENIA INWENTARZA /////////////////
    clear() {
        this.items = [];
        this.contextMenu.visible = false;
    }

    ////////////////// SPRAWDZAMY CZY UI AKTYWNE /////////////////
    isUIActive() {
        return this.isOpen || this.currentChest !== null;
    }

    handleMouseDown(mx, my, button) {
        if (!this.isUIActive()) return;

        // Проверяем клик по контекстному меню (кнопке "Использовать")
        if (this.contextMenu.visible) {
            if (button === 0 && 
                mx >= this.contextMenu.x && mx <= this.contextMenu.x + this.contextMenu.w &&
                my >= this.contextMenu.y && my <= this.contextMenu.y + this.contextMenu.h) {
                
                this.useItemLogic(this.contextMenu.itemIndex);
                this.contextMenu.visible = false;
                return; // Прерываем дальнейшую обработку клика
            } else {
                // Если кликнули мимо кнопки — просто закрываем её
                this.contextMenu.visible = false;
            }
        }

        const { invX, chestX, startY } = this.getLayout();
        const now = Date.now();

        ////////////////// KLIK W INVENTARZ /////////////////
        if (mx > invX && mx < invX + this.winW && my > startY && my < startY + this.winH) {
            const index = Math.floor((my - (startY + 80)) / 40);
            
            if (this.items[index]) {
                if (button === 2) { 
                    ////////////////// PRAWY PRZYCISK - МЕНЮ "ИСПОЛЬЗОВАТЬ" /////////////////
                    this.contextMenu = {
                        visible: true,
                        x: invX + 150, // Позиция правее текста предмета
                        y: startY + 75 + (index * 40) - 20, // Позиция над предметом
                        w: 140,
                        h: 36,
                        itemIndex: index
                    };
                } else if (button === 0) {
                    this.clickTime = now;
                    // Запоминаем данные, но пока НЕ удаляем из массива (чтобы не прыгало)
                    this.draggedItem = this.items[index];
                    this.dragSource = 'inventory';
                    this.dragIndex = index;
                }
            }
        }
        ////////////////// KLIK W SKRZYNIE /////////////////
        else if (this.currentChest && mx > chestX && mx < chestX + this.winW && my > startY && my < startY + this.winH) {
            const index = Math.floor((my - (startY + 80)) / 40);
            if (this.currentChest.items[index]) {
                if (button === 0) {
                    this.draggedItem = this.currentChest.items[index];
                    this.dragSource = 'chest';
                    this.dragIndex = index;
                    this.clickTime = now;
                }
            }
        }
    }

    useItemLogic(index) {
        if (this.onUseItem) {
            const itemUsed = this.items[index];
            const wasConsumed = this.onUseItem(itemUsed, index);
        }
    }

    handleMouseUp(mx, my, button) {
        if (!this.draggedItem) return;

        const { invX, chestX, startY, dropZone } = this.getLayout();

        let item = this.draggedItem;
        let originalIndex = this.dragIndex;
        let originalSource = this.dragSource;

        // Если все-таки тянули, тогда производим перемещение
        // Сначала удаляем из источника
        if (originalSource === 'inventory') {
            this.items.splice(originalIndex, 1);
        } else {
            this.currentChest.items.splice(originalIndex, 1);
        }

        ////////////////// UPUSZCZENIE DO STREFY WYRZUCANIA /////////////////
        if (mx > dropZone.x && mx < dropZone.x + dropZone.w && my > dropZone.y && my < dropZone.y + dropZone.h) {
            if (this.onDropItem) {
                this.onDropItem(item);
            }
        }
        ////////////////// UPUSZCZENIE DO INVENTARZA /////////////////
        else if (mx > invX && mx < invX + this.winW && my > startY && my < startY + this.winH) {
            this.items.push(item);
        }
        ////////////////// UPUSZCZENIE DO SKRZYNI /////////////////
        else if (this.currentChest && mx > chestX && mx < chestX + this.winW && my > startY && my < startY + this.winH) {
            this.currentChest.items.push(item);
        }
        ////////////////// POWROT NA MIEJSCE /////////////////
        else {
            if (originalSource === 'inventory') {
                this.items.splice(originalIndex, 0, item);
            } else {
                this.currentChest.items.splice(originalIndex, 0, item);
            }
        }

        this.draggedItem = null;
        this.dragSource = null;
        this.dragIndex = null;
    }

    getLayout() {
        const startY = (this.canvas.height - this.winH) / 2;
        let invX, chestX;

        if (this.currentChest) {
            invX = this.canvas.width / 2 - this.winW - this.gap / 2;
            chestX = this.canvas.width / 2 + this.gap / 2;
        } else {
            invX = (this.canvas.width - this.winW) / 2;
            chestX = -1000;
        }

        const dropZone = { x: 50, y: startY, w: 150, h: this.winH };
        return { invX, chestX, startY, dropZone };
    }

    draw() {
        if (!this.isUIActive()) {
            this.contextMenu.visible = false; // Сбрасываем меню при закрытии инвентаря
            return;
        }

        this.ctx.fillStyle = "rgba(0,0,0,0.7)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const { invX, chestX, startY, dropZone } = this.getLayout();

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

        this.drawWindow("Ваш Инвентарь", this.items, invX, startY, 'inventory');
        if (this.currentChest) {
            this.drawWindow("Сундук", this.currentChest.items, chestX, startY, 'chest');
        }

        if (this.draggedItem) {
            this.ctx.fillStyle = "yellow";
            this.ctx.font = "bold 20px Arial";
            this.ctx.fillText(this.draggedItem, this.mouseX - 20, this.mouseY);
        }

        ////////////////// ОТРИСОВКА КНОПКИ "ИСПОЛЬЗОВАТЬ" ПОСЛЕ ВСЕГО /////////////////
        if (this.contextMenu.visible) {
            this.ctx.fillStyle = "#222";
            this.ctx.strokeStyle = "white";
            this.ctx.lineWidth = 2;
            this.ctx.fillRect(this.contextMenu.x, this.contextMenu.y, this.contextMenu.w, this.contextMenu.h);
            this.ctx.strokeRect(this.contextMenu.x, this.contextMenu.y, this.contextMenu.w, this.contextMenu.h);

            ///// Эффект наведения ///
            if (this.mouseX >= this.contextMenu.x && this.mouseX <= this.contextMenu.x + this.contextMenu.w &&
                this.mouseY >= this.contextMenu.y && this.mouseY <= this.contextMenu.y + this.contextMenu.h) {
                this.ctx.fillStyle = "#555";
                this.ctx.fillRect(this.contextMenu.x + 2, this.contextMenu.y + 2, this.contextMenu.w - 4, this.contextMenu.h - 4);
            }

            this.ctx.fillStyle = "white";
            this.ctx.font = "bold 16px Arial";
            this.ctx.textAlign = "center";
            this.ctx.fillText("Использовать", this.contextMenu.x + this.contextMenu.w / 2, this.contextMenu.y + 24);
            this.ctx.textAlign = "left";
        }
    }

    drawWindow(title, items, x, y, type) {
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
            this.ctx.fillStyle = "#888";
            this.ctx.fillText("Пусто...", x + 20, y + 100);
        } else {
            items.forEach((item, i) => {
                const isBeingDragged = this.draggedItem === item && 
                                     this.dragSource === type && 
                                     this.dragIndex === i;

                this.ctx.fillStyle = isBeingDragged ? "#666" : "white";
                this.ctx.fillText(`${i + 1}. ${item}`, x + 20, y + 100 + (i * 40));
            });
        }
    }
}
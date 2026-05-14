// keys.js
export class Keys {
    constructor(tileS, inventory) {
        this.tileS = tileS;
        this.inventory = inventory;
    }

    ////// SPRAWDZA CZY SA OBOK ZAMKNIETE DZWI //////
    getNearDoor(player, map) {
        let centerX = Math.floor((player.pixelX + this.tileS / 2) / this.tileS);
        let centerY = Math.floor((player.pixelY + this.tileS / 2) / this.tileS);

        ////// SPRAWDZAMY SASIEDZKIE KLATKI ///
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                let gridX = centerX + dx;
                let gridY = centerY + dy;

                if (map[gridY] && map[gridY][gridX] === 10) {
                    return { x: gridX, y: gridY };
                }
            }
        }
        return null;
    }

    /////// LOGIKA OTWIERANIA DRZZWI /////////
    OpenDoor(player, map) {
        const door = this.getNearDoor(player, map);
        if (!door) return false;

        //// Ищем любой предмет, содержащий слово "Key" или "Ключ" //
        const keyIndex = this.inventory.items.findIndex(item => 
            item.toLowerCase().includes("key") || item.toLowerCase().includes("ключ")
        );

        if (keyIndex !== -1) {
            ///// ZNALAZL KLUCZ ///
            const keyName = this.inventory.items[keyIndex];
            
            ////// USUWAMY KLUCZ Z INWENTARZA ///
            this.inventory.items.splice(keyIndex, 1);
            
            ////// ZMIENIAMY ID DRZWI NA MAPIE NA 11 (to otwarte drzwi) //////
            map[door.y][door.x] = 11;
            return true;
        } else {
            return false;
        }
    }
}
// doors.js
export class Doors {
    constructor(tileS) {
        this.tileS = tileS;
    }

    getNearDoor(player, map) {
        let centerX = Math.floor((player.pixelX + this.tileS / 2) / this.tileS);
        let centerY = Math.floor((player.pixelY + this.tileS / 2) / this.tileS);

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

    /////// NACISNIECIE E PRZED DRZWMI /////
    tryOpenDoor(player, map, inventory) {
        const door = this.getNearDoor(player, map);
        if (!door) return false;

        const keysInInventory = inventory.items.filter(item => 
            item.toLowerCase().includes("key") || item.toLowerCase().includes("ключ")
        );

        if (keysInInventory.length === 1) {
            const keyName = keysInInventory[0];
            const keyIndex = inventory.items.indexOf(keyName);
            
            ///////// USUWAMY TYLKO 1 KLUCZ /////
            inventory.items.splice(keyIndex, 1);
            map[door.y][door.x] = 11;
            return true;
        } else if (keysInInventory.length > 1) {
            ///// JEZELI KLUCZY DUZO TO OTWIERAMY INW. ///// 
            inventory.isOpen = true;
            return false;
        }
        return false;
    }

    ////// KIEDY NACISKAMY USE W INWENTARZU NA WYBRANY KLUCZ /////
    useKeyOnDoor(player, map, inventory, keyName) {
        const door = this.getNearDoor(player, map);
        if (!door) return false; 

        ///// SZUKAMY INDEKS KLUCZA KTORY WYKORZYSTUJEMY ////
        const keyIndex = inventory.items.indexOf(keyName);
        
        if (keyIndex > -1) {
            ////// USUWAMY KONKRETNY ELEMENT Z INW ////
            inventory.items.splice(keyIndex, 1);
            map[door.y][door.x] = 11;
            return true;
        }
        return false;
    }
}
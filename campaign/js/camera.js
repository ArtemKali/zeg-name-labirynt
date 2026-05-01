export class CampaignCamera {
    constructor(width, height, mapWidth, mapHeight) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;

        ///////////////////// DEAD ZONE CAMera ///////////////////////
        this.deadZone = {
            width: width * 0.2,
            height: height * 0.2
        };
    }

    update(playerX, playerY) {
        /////////////////////// SLEDZENIE W POZIOMIE ///////////////////////////
        if (playerX - this.x > this.width / 2 + this.deadZone.width / 2) {
            this.x = playerX - (this.width / 2 + this.deadZone.width / 2);
        } else if (playerX - this.x < this.width / 2 - this.deadZone.width / 2) {
            this.x = playerX - (this.width / 2 - this.deadZone.width / 2);
        }

        ////////////////////////// SLEDZENIE W PIONIE /////////////////////////
        if (playerY - this.y > this.height / 2 + this.deadZone.height / 2) {
            this.y = playerY - (this.height / 2 + this.deadZone.height / 2);
        } else if (playerY - this.y < this.height / 2 - this.deadZone.height / 2) {
            this.y = playerY - (this.height / 2 - this.deadZone.height / 2);
        }

        //////////////////////// OGRANICZAMY KAMERE KRAWEDZIAMY MAPY ////////////////////////
        this.x = Math.max(0, Math.min(this.x, this.mapWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, this.mapHeight - this.height));
    }

    apply(ctx) {
        ctx.save();
        ctx.translate(-this.x, -this.y);
    }

    release(ctx) {
        ctx.restore();
    }
}
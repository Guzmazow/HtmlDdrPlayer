export class Preferences {
    controls: {
        left: string,
        down: string,
        up: string,
        right: string,
        start: string,
        select: string,
        cancel: string,
        test: string
    } = {
            left: "ArrowLeft",
            down: "ArrowDown",
            up: "ArrowUp",
            right: "ArrowRight",
            start: "Space",
            select: "Enter",
            cancel: "Escape",
            test: "KeyT"
        }

    npsFilter: { from: number | null, to: number | null } = {
        from: null,
        to: null
    }

    display: { laneWidth: number } = {
        laneWidth: 700
    }

    play: {
        xMod: number,
        avgMod: number | null,
        minMod: number | null,
    } = {
            xMod: 1,
            avgMod: null,
            minMod: null,
        }

    constructor(preferences?: Preferences) {
        if (preferences) {
            Object.assign(this, preferences);
            var defaults = new Preferences();
            this.controls.left = this.controls.left || defaults.controls.left;
            this.controls.down = this.controls.down || defaults.controls.down;
            this.controls.up = this.controls.up || defaults.controls.up;
            this.controls.right = this.controls.right || defaults.controls.right;
            this.controls.start = this.controls.start || defaults.controls.start;
            this.controls.select = this.controls.select || defaults.controls.select;
            this.controls.cancel = this.controls.cancel || defaults.controls.cancel;
            this.controls.test = this.controls.test || defaults.controls.test;
            this.display.laneWidth = this.display.laneWidth || defaults.display.laneWidth;
            this.play.xMod = this.play.xMod || defaults.play.xMod;
        }
    }
}
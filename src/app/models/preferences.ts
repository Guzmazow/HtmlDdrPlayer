export class Preferences {
    npsFilter: { from: number | null, to: number | null } = {
        from: null,
        to: null
    }

    display: { laneWidth: number } = {
        laneWidth: 700
    }

    play: { xMod: number } = {
        xMod: 4
    }

    constructor(preferences?: Preferences){
        if(preferences)
            Object.assign(this, preferences);
    }
}
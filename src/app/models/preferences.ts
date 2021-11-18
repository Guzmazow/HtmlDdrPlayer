export class Preferences {
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

    constructor(preferences?: Preferences){
        if(preferences)
            Object.assign(this, preferences);
    }
}
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
        aMod: number | null
    } = {
        xMod: 4,
        aMod: null
    }

    constructor(preferences?: Preferences){
        if(preferences)
            Object.assign(this, preferences);
    }
}
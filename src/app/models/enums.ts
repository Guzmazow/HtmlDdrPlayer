//the ones that can be divided by 3 are reaallly broken ones
//they add a new color but make the color repeat every 3 notes instead of 4
export enum NoteQuantization {
    NONE = -1,
    Q4 = 4,
    Q8 = 8,
    Q12 = 12,
    Q16 = 16,
    Q24 = 24,
    Q32 = 32,
    Q48 = 48,
    Q64 = 64,
    Q96 = 96,
    Q128 = 128,
    Q192 = 192,
    Q256 = 256,
    Q384 = 384,
    Q512 = 512
}

//Only the ones that can't be divided by 3
export const GoodNoteQuantizations = [
    NoteQuantization.Q4, 
    NoteQuantization.Q8, 
    NoteQuantization.Q16, 
    NoteQuantization.Q32, 
    NoteQuantization.Q64, 
    NoteQuantization.Q128, 
    NoteQuantization.Q256, 
    NoteQuantization.Q512
];

export const BadNoteQuantizations = [
    NoteQuantization.Q12, 
    NoteQuantization.Q24, 
    NoteQuantization.Q48, 
    NoteQuantization.Q96, 
    NoteQuantization.Q192, 
    NoteQuantization.Q384
];

export const AllNoteQuantizations = [
    NoteQuantization.Q4, 
    NoteQuantization.Q8, 
    NoteQuantization.Q12, 
    NoteQuantization.Q16, 
    NoteQuantization.Q24, 
    NoteQuantization.Q32, 
    NoteQuantization.Q48, 
    NoteQuantization.Q64, 
    NoteQuantization.Q96, 
    NoteQuantization.Q128, 
    NoteQuantization.Q192, 
    NoteQuantization.Q256, 
    NoteQuantization.Q384,
    NoteQuantization.Q512
];

export const NoteQuantizationTitle: { [key in NoteQuantization]: string } = {
    [-1]: "None",
    4: "N",
    8: "H",
    12: "3rd",
    16: "4th",
    24: "6th",
    32: "8th",
    48: "12th",
    64: "16th",
    96: "24th",
    128: "32nd",
    192: "48th",
    256: "64th",
    384: "96th",
    512: "128th"
}

export enum SimfileNoteType {
    EMPTY = "0",
    NORMAL = "1",
    HOLD_HEAD = "2",
    TAIL = "3",
    ROLL_HEAD = "4",
    MINE = "M",
    LIFT = "L",
    KEYSOUND = "K",
    FAKE = "F"

}

export enum NoteType {
    NONE = -1,
    EMPTY = 0,
    NORMAL = 1,
    HOLD_HEAD = 2,
    //HOLD_BODY = 3,
    HOLD_TAIL = 4,
    ROLL_HEAD = 5,
    //ROLL_BODY = 6,
    ROLL_TAIL = 7,
    MINE = 8,
    LIFT = 9,
    KEYSOUND = 10,
    FAKE = 11
}

export const NoteTypeMap: { [key in SimfileNoteType]: NoteType } = {
    0: NoteType.EMPTY,
    1: NoteType.NORMAL,
    2: NoteType.HOLD_HEAD,
    3: NoteType.HOLD_TAIL | NoteType.ROLL_TAIL,
    4: NoteType.ROLL_HEAD,
    M: NoteType.MINE,
    L: NoteType.LIFT,
    K: NoteType.KEYSOUND,
    F: NoteType.FAKE
}

export enum Key {
    TEST = -2,
    NONE = -1, //has to correspond to Direction
    LEFT = 0, //has to correspond to Direction
    DOWN = 1, //has to correspond to Direction
    UP = 2, //has to correspond to Direction
    RIGHT = 3, //has to correspond to Direction
    SECONDLEFT = 4, //has to correspond to Direction % 4
    SECONDDOWN = 5, //has to correspond to Direction % 4
    SECONDUP = 6, //has to correspond to Direction % 4
    SECONDRIGHT = 7, //has to correspond to Direction % 4
    START = 8,
    SELECT = 9,
    CANCEL = 10
}

export enum Direction {
    NONE = -1,
    LEFT = 0,
    DOWN = 1,
    UP = 2,
    RIGHT = 3
}

export const AllDirections = [Direction.DOWN, Direction.LEFT, Direction.UP, Direction.RIGHT];

export enum Judgement {
    ALL = -8,
    ROLLFINISHED = -7,
    ROLLFAILED = -6,
    HOLDFINISHED = -5,
    HOLDFAILED = -4,
    MINEMISS = -3,
    MINEHIT = -2,
    NONE = -1,
    MARVELOUS = 0,
    PERFECT = 1,
    GREAT = 2,
    GOOD = 3,
    BAD = 4,
    MISS = 5
}

export const AllJudgements = [Judgement.MARVELOUS, Judgement.PERFECT, Judgement.GREAT, Judgement.GOOD, Judgement.BAD, Judgement.MISS]
export const SuccessfullStepJudgements = [Judgement.MARVELOUS, Judgement.PERFECT, Judgement.GREAT, Judgement.GOOD, Judgement.BAD, Judgement.ROLLFINISHED, Judgement.HOLDFINISHED]

export enum GameModeType {
    NONE = -1,
    SINGLE = 0,
    DOUBLE = 1
}

export enum GameMode {
    NONE = -1,
    DANCE = 0,
    PUMP = 1,
    KB7 = 2,
    KICKBOX = 3,
    LIGHT = 4,
    PARA = 5,
    BEAT = 6,
    POPN = 7,
    TECHNO = 8,
    DS3DDX = 9,
    KARAOKE = 10,
    MANIAX = 11,
    HORIZON = 12
}



export enum Difficulty {
    NONE = -1,
    BEGINNER = 1,
    EASY = 2,
    MEDIUM = 3,
    HARD = 4,
    CHALLENGE = 5,
    EDIT = 6
}

export enum DifficultyShort {
    NA = -1,
    BG = 1,
    EZ = 2,
    MD = 3,
    HD = 4,
    CH = 5,
    ED = 6
}


export enum DirectionFlag {
    NONE = 0,//0
    UP = 1 << 0,  //1
    DOWN = 1 << 1,  //2
    LEFT = 1 << 2,  //4
    RIGHT = 1 << 3,  //8
    START = 1 << 4, //16
    SELECT = 1 << 5 //32
};

export const AllDirectionFlags = [DirectionFlag.UP, DirectionFlag.DOWN, DirectionFlag.LEFT, DirectionFlag.RIGHT, DirectionFlag.START, DirectionFlag.SELECT];
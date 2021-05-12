export enum NoteType {
    NONE = "0",
    NORMAL = "1",
    HOLD_HEAD = "2",
    TAIL = "3",
    ROLL_HEAD = "4",
    MINE = "M",
}


export enum Key {
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
    ALL = -2,
    NONE = -1,
    MARVELOUS = 0,
    PERFECT = 1,
    GREAT = 2,
    GOOD = 3,
    BAD = 4,
    MISS = 5
}

export const AllJudgements = [Judgement.MARVELOUS, Judgement.PERFECT, Judgement.GREAT, Judgement.GOOD, Judgement.BAD, Judgement.MISS]

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
export enum NoteType {
    NONE = "0",
    NORMAL = "1",
    HOLD_HEAD = "2",
    TAIL = "3",
    ROLL_HEAD = "4",
    MINE = "M",
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
    NONE = -1,
    MARVELOUS = 0,
    PERFECT = 1,
    GREAT = 2,
    GOOD = 3,
    BAD = 4,
    MISS = 5
}

export const AllJudgements  = [Judgement.MARVELOUS, Judgement.PERFECT, Judgement.GREAT, Judgement.GOOD, Judgement.BAD, Judgement.MISS]
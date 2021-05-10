import { Difficulty, GameMode, GameModeType as GameModeType } from "./enums"

export class ParsedSimfileMode {
    gameMode: GameMode = GameMode.NONE;
    gameModeType: GameModeType = GameModeType.NONE;
    descAuthor: string = "";
    difficulty: Difficulty = Difficulty.NONE;
    meter: number = 0;
    radar: string = "";
    notes: string = "";
}

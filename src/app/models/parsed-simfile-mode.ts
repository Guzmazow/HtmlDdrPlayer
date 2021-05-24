import { Difficulty, GameMode, GameModeType as GameModeType } from "./enums"

export interface ParsedSimfileMode {
    gameMode: GameMode;
    gameModeType: GameModeType;
    descAuthor: string;
    difficulty: Difficulty;
    meter: number;
    radar: string;
    notes: string;
    stats: string;
    scores?: number[];
    displayScores?: string;
}

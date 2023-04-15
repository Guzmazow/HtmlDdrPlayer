import { ResultForPeak } from "./result-for-peak";

export interface ClassResult {
    timestampMs: number,
    classifications: {
      categories: {
        score: number,
        categoryName: string
      }[];
    }[]
  };

  export interface ClassResults extends ResultForPeak{
    data: ClassResult[]
  };
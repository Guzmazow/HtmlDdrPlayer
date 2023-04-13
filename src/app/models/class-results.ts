export interface ClassResult {
    timestampMs: number,
    classifications: {
      categories: {
        score: number,
        categoryName: string
      }[];
    }[]
  };

  export interface ClassResults extends Array<ClassResult> {};
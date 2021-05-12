import { Judgement } from "./enums";

export class JudgementStats {
  judgementCounts =  new Map<Judgement, number>();
  precisionSums = new Map<Judgement, number>(); 
}

import { Point, Segment } from "peaks.js";

export interface ResultForPeak {
  points?: Point[];
  segments?: Segment[];
  title: string;
  index: number;
  element?: HTMLElement
};
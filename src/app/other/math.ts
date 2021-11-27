/**
 * @description Checks overlap borrowed from https://stackoverflow.com/a/12888920/15874691
 */
export function is_overlapping(x1: number, x2: number, y1: number, y2: number) {
    return Math.max(x1, y1) <= Math.min(x2, y2)
}

/**
 * @description Checks overlap borrowed from https://stackoverflow.com/a/12888920/15874691 comment
 */
export function overlap_amount(x1: number, x2: number, y1: number, y2: number) {
    return Math.min(x2, y2) - Math.max(x1, y1)
}
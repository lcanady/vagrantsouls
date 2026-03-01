export class Dice {
  /**
   * Rolls a die with the specified number of sides.
   * @param d Number of sides (e.g., 6 for a d6).
   * @returns A random number between 1 and d (inclusive).
   */
  roll(d: number): number {
    return Math.floor(Math.random() * d) + 1;
  }

  /**
   * Rolls a d100 (1-100).
   * @returns A random number between 1 and 100 (inclusive).
   */
  rollD100(): number {
    return this.roll(100);
  }

  /**
   * Parses a dice notation like "1d6" or "2d4+1" and returns the result.
   */
  parseAndRoll(notation: string): number {
    const match = notation.match(/^(\d+)?d(\d+)([\+\-]\d+)?$/i);
    if (!match) {
        const fallback = parseInt(notation);
        return isNaN(fallback) ? 0 : fallback;
    }

    const num = match[1] ? parseInt(match[1]) : 1;
    const sides = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;

    let total = 0;
    for (let i = 0; i < num; i++) {
      total += this.roll(sides);
    }
    return total + modifier;
  }
}

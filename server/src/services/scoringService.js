export const BASE_POINTS_BY_DIFFICULTY = {
  easy: 100,
  medium: 150,
  hard: 200
};

export const CLUE_POINT_VALUE = 5;
export const HINT_PENALTY_VALUE = -10;

/**
 * Computes the final score breakdown upon accusation.
 *
 * @param {'easy'|'medium'|'hard'} difficulty
 * @param {boolean} correct
 * @param {number} cluesDiscovered
 * @param {number} hintsUsed
 * @returns {{ base: number, cluePoints: number, hintPenalty: number, total: number }}
 */
export function computeScore(difficulty, correct, cluesDiscovered = 0, hintsUsed = 0) {
  const base = correct ? (BASE_POINTS_BY_DIFFICULTY[difficulty] ?? 0) : 0;
  const cluePoints = CLUE_POINT_VALUE * Math.max(0, cluesDiscovered);
  const hintPenalty = HINT_PENALTY_VALUE * Math.max(0, hintsUsed);
  const total = Math.max(0, base + cluePoints + hintPenalty);

  return {
    base,
    cluePoints,
    hintPenalty,
    total
  };
}

/**
 * Computes score preview during investigation before accusation (no base points).
 *
 * @param {number} cluesDiscovered
 * @param {number} hintsUsed
 * @returns {number}
 */
export function computeScorePreview(cluesDiscovered = 0, hintsUsed = 0) {
  return Math.max(0, CLUE_POINT_VALUE * Math.max(0, cluesDiscovered) + HINT_PENALTY_VALUE * Math.max(0, hintsUsed));
}

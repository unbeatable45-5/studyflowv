/**
 * SM-2 Spaced Repetition Algorithm
 * quality: 0-5 (0=complete blackout, 5=perfect)
 */

export interface ReviewData {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
}

export function calculateNextReview(
  quality: number,
  current: ReviewData
): ReviewData {
  const { easeFactor, intervalDays, repetitions } = current;

  // quality < 3 means the answer was incorrect — reset
  if (quality < 3) {
    return {
      easeFactor,
      intervalDays: 0,
      repetitions: 0,
    };
  }

  let newInterval: number;
  let newRepetitions = repetitions + 1;

  if (repetitions === 0) {
    newInterval = 1;
  } else if (repetitions === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.round(intervalDays * easeFactor);
  }

  // Update ease factor
  const newEase = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  return {
    easeFactor: newEase,
    intervalDays: newInterval,
    repetitions: newRepetitions,
  };
}

export function qualityFromResult(correct: boolean): number {
  return correct ? 4 : 1;
}

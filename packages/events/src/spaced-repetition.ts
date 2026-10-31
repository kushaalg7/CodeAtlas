/**
 * Spaced Repetition Review Queue
 * Spec Section 13: Spaced-repetition review queue for concepts the learner is forgetting.
 * Implements simplified SM-2 memory retention algorithm.
 */

export interface ConceptReviewItem {
  conceptId: string;
  repetitionNumber: number; // consecutive correct reviews
  intervalDays: number;
  easeFactor: number; // standard SM-2 ease factor (default 2.5)
  nextReviewDate: string; // ISO date string
}

export class SpacedRepetitionScheduler {
  calculateNextReview(
    current: ConceptReviewItem,
    grade: 0 | 1 | 2 | 3 | 4 | 5 // 0-2 = failure, 3-5 = success
  ): ConceptReviewItem {
    let { repetitionNumber, intervalDays, easeFactor } = current;

    if (grade >= 3) {
      // Success
      if (repetitionNumber === 0) {
        intervalDays = 1;
      } else if (repetitionNumber === 1) {
        intervalDays = 3;
      } else {
        intervalDays = Math.round(intervalDays * easeFactor);
      }
      repetitionNumber++;
    } else {
      // Failure / forgetting
      repetitionNumber = 0;
      intervalDays = 1;
    }

    // Update ease factor: EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    easeFactor = Math.max(1.3, easeFactor);

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);

    return {
      conceptId: current.conceptId,
      repetitionNumber,
      intervalDays,
      easeFactor: Math.round(easeFactor * 100) / 100,
      nextReviewDate: nextDate.toISOString().split('T')[0],
    };
  }

  getDueReviews(items: ConceptReviewItem[], currentDate: string = new Date().toISOString().split('T')[0]): ConceptReviewItem[] {
    return items.filter((item) => item.nextReviewDate <= currentDate);
  }
}

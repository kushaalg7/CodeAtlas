/**
 * Evidence-Weighted Concept Mastery Update Rule
 * Spec Section 15.1 & Section 8.3
 *
 * DOCUMENTED MODEL ASSUMPTIONS:
 * 1. Mastery Score M is bounded in the continuous range [0.0, 1.0].
 * 2. Unprompted success (0 hints) provides strongest positive evidence (+0.25).
 * 3. Success with hints discounts evidence proportionally (1 hint: +0.15, 2+ hints: +0.08).
 * 4. Incorrect quiz answers discount confidence (-0.15), reflecting misconceptions.
 * 5. Practical exercise completion provides substantial evidence of code generation competency (+0.35).
 * 6. Node State Thresholds:
 *    - Available: M < 0.20 (and prerequisites mastered)
 *    - In Progress: 0.20 <= M < 0.80
 *    - Mastered: M >= 0.80
 */

export type ConceptState = 'locked' | 'available' | 'in_progress' | 'mastered';

export interface MasteryUpdateInput {
  currentScore: number;
  eventType: 'quiz_answered' | 'exercise_submitted';
  success: boolean;
  hintsUsed?: number;
}

export interface MasteryUpdateResult {
  newScore: number;
  delta: number;
  state: ConceptState;
}

export function computeMasteryUpdate(input: MasteryUpdateInput): MasteryUpdateResult {
  const { currentScore, eventType, success, hintsUsed = 0 } = input;
  let delta = 0;

  if (eventType === 'quiz_answered') {
    if (success) {
      if (hintsUsed === 0) {
        delta = 0.25;
      } else if (hintsUsed === 1) {
        delta = 0.15;
      } else {
        delta = 0.08;
      }
    } else {
      delta = -0.15;
    }
  } else if (eventType === 'exercise_submitted') {
    if (success) {
      delta = 0.35;
    } else {
      delta = -0.10;
    }
  }

  const rawScore = currentScore + delta;
  const newScore = Math.round(Math.max(0.0, Math.min(1.0, rawScore)) * 100) / 100;

  let state: ConceptState = 'available';
  if (newScore >= 0.80) {
    state = 'mastered';
  } else if (newScore >= 0.20) {
    state = 'in_progress';
  } else {
    state = 'available';
  }

  return {
    newScore,
    delta,
    state,
  };
}

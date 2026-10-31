import type { LearningContext } from '../../schemas/src/learning-context.ts';
import { ErrorMessageDecoder } from './error-decoder.ts';

export interface TutorResponse {
  message: string;
  pedagogicalNudge: string;
  suggestedAction: string;
  relatedLessonId: string;
  citations: string[];
}

export class AITutorBridge {
  private errorDecoder: ErrorMessageDecoder;

  constructor() {
    this.errorDecoder = new ErrorMessageDecoder();
  }

  /**
   * Responds to learner queries or errors with contextual awareness of their current lesson,
   * recent errors, and mastery snapshot.
   */
  respond(context: LearningContext, userMessage?: string): TutorResponse {
    // 1. If learner recently hit an error, explain the error first
    if (context.recent_errors && context.recent_errors.length > 0) {
      const latestError = context.recent_errors[context.recent_errors.length - 1];
      const decoded = this.errorDecoder.decode(latestError);

      return {
        message: `I noticed you encountered a ${decoded.errorType} in lesson ${context.current_lesson_id}. ${decoded.plainLanguageExplanation}`,
        pedagogicalNudge: decoded.howToFix,
        suggestedAction: `Review ${decoded.targetLessonTitle}`,
        relatedLessonId: decoded.targetLessonId,
        citations: [`CODE ATLAS Lesson: ${decoded.targetLessonId}`],
      };
    }

    // 2. Contextual lesson guidance
    const currentMastery = context.mastery_snapshot[context.current_lesson_id] || 0.0;
    const nudge =
      currentMastery < 0.5
        ? 'Try breaking down the code into smaller lines and checking variables one at a time.'
        : 'You have solid progress on this topic! Try the "Predict the output" challenges or exercises.';

    return {
      message: `You are currently studying ${context.current_lesson_id} (Python ${context.version}). What part would you like help with?`,
      pedagogicalNudge: nudge,
      suggestedAction: currentMastery >= 0.8 ? 'Ready to advance to next topic' : 'Practice lesson exercises',
      relatedLessonId: context.current_lesson_id,
      citations: [`CODE ATLAS Lesson: ${context.current_lesson_id}`],
    };
  }
}

import { z, type TypeOf } from './zod.ts';

/**
 * Section 15 Shared Learning-Context Object passed between CODEMIND modules.
 */
export const QuizResultSummarySchema = z.object({
  quiz_id: z.string().min(1),
  correct: z.boolean(),
  hints_used: z.number(),
  time_spent_ms: z.number(),
});

export const LearningContextSchema = z.object({
  user_id: z.string().min(1),
  language: z.string().min(1),
  version: z.string().min(1),
  current_lesson_id: z.string().min(1),
  current_concept_ids: z.array(z.string()),
  recent_errors: z.array(z.string()),
  quiz_results: z.array(QuizResultSummarySchema),
  mastery_snapshot: z.record(z.number()),
  trace_session_id: z.string().optional(),
});

export type QuizResultSummary = TypeOf<typeof QuizResultSummarySchema>;
export type LearningContext = TypeOf<typeof LearningContextSchema>;

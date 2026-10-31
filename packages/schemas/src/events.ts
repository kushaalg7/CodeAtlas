import { z, type TypeOf } from './zod.ts';

/**
 * Section 15.1 Learning DNA Event Schema
 * Event types:
 * - lesson_started
 * - lesson_completed
 * - quiz_answered
 * - exercise_submitted
 * - playground_run
 * - trace_opened
 * - search_performed
 * - roadmap_progress
 */

export const LearningDNAEventTypeSchema = z.enum([
  'lesson_started',
  'lesson_completed',
  'quiz_answered',
  'exercise_submitted',
  'playground_run',
  'trace_opened',
  'search_performed',
  'roadmap_progress',
] as const);

export const BaseLearningDNAEventSchema = z.object({
  event_id: z.string().min(1),
  user_id: z.string().min(1),
  language: z.string().min(1),
  timestamp: z.string().min(1), // ISO timestamp
  event_type: LearningDNAEventTypeSchema,
});

export const QuizAnsweredPayloadSchema = z.object({
  quiz_id: z.string().min(1),
  concept_tags: z.array(z.string()).min(1),
  correctness: z.boolean(),
  time_ms: z.number(),
  hints_used: z.number(),
  misconception_id: z.string().optional(),
});

export const ExerciseSubmittedPayloadSchema = z.object({
  exercise_id: z.string().min(1),
  passed: z.boolean(),
  tests_passed: z.number(),
  tests_total: z.number(),
  time_ms: z.number(),
  attempts: z.number(),
});

export const PlaygroundRunPayloadSchema = z.object({
  execution_time_ms: z.number(),
  success: z.boolean(),
  error_type: z.string().optional(),
  timeout_triggered: z.boolean().optional(),
});

export const SearchPerformedPayloadSchema = z.object({
  query: z.string().min(1),
  result_count: z.number(),
  filter_language: z.string().optional(),
  filter_level: z.string().optional(),
});

export const RoadmapProgressPayloadSchema = z.object({
  concept_id: z.string().min(1),
  old_state: z.string().min(1),
  new_state: z.string().min(1),
  mastery_score: z.number(),
});

export const LearningDNAEventSchema = BaseLearningDNAEventSchema.extend({
  payload: z.record(z.any()),
});

export type LearningDNAEventType = TypeOf<typeof LearningDNAEventTypeSchema>;
export type LearningDNAEvent = TypeOf<typeof LearningDNAEventSchema>;
export type QuizAnsweredPayload = TypeOf<typeof QuizAnsweredPayloadSchema>;
export type ExerciseSubmittedPayload = TypeOf<typeof ExerciseSubmittedPayloadSchema>;
export type PlaygroundRunPayload = TypeOf<typeof PlaygroundRunPayloadSchema>;

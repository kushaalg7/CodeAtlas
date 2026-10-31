import { z, type TypeOf } from './zod.ts';

/**
 * Section 3.3 Reference Source Types
 */
export const ReferenceSourceTypeSchema = z.enum([
  'official_spec',
  'official_docs',
  'educational_explanation',
  'ai_generated',
] as const);

export const DocReferenceSchema = z.object({
  url: z.string().min(1),
  title: z.string().min(1),
  source_type: ReferenceSourceTypeSchema,
  license: z.string().optional(),
});

/**
 * Section 3.1 Required metadata on every content item
 */
export const DeprecationStatusSchema = z.enum([
  'current',
  'deprecated',
  'removed',
  'experimental',
] as const);

export const ReviewStatusSchema = z.enum([
  'draft',
  'verified',
  'reviewed',
] as const);

export const LevelSchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
] as const);

export const BaseMetadataSchema = z.object({
  id: z.string().min(1),
  language: z.string().min(1),
  language_version_min: z.string().min(1),
  language_version_max: z.string().min(1), // e.g. "current" or semver string
  topic: z.string().min(1),
  level: LevelSchema,
  prerequisites: z.array(z.string()),
  related_concepts: z.array(z.string()),
  doc_references: z.array(DocReferenceSchema).min(1),
  deprecation_status: DeprecationStatusSchema,
  review_status: ReviewStatusSchema,
  last_verified_date: z.string().min(1),
  verified_with_toolchain_version: z.string().min(1),
});

export type BaseMetadata = TypeOf<typeof BaseMetadataSchema>;

/**
 * Language Package Manifest Schema (Spec Section 2 & 3)
 */
export const TierSchema = z.enum([
  'Tier A',
  'Tier B',
  'Tier C',
] as const);

export const ManifestSchema = z.object({
  language: z.string().min(1),
  versions_supported: z.array(z.string()).min(1),
  tier: TierSchema,
  doc_base_urls: z.array(z.string()).min(1),
  maintainers: z.array(z.string()).min(1),
});

export type Manifest = TypeOf<typeof ManifestSchema>;

/**
 * Section 3.2 Syntax Construct Schema
 */
export const ComponentParameterSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  is_optional: z.boolean().optional(),
});

export const SyntaxConstructSchema = BaseMetadataSchema.extend({
  name: z.string().min(1),
  official_syntax: z.string().min(1),
  explanation_simple: z.string().min(1),
  explanation_technical: z.string().min(1),
  components_or_parameters: z.array(ComponentParameterSchema),
  example: z.string().min(1),
  expected_output: z.string(),
  output_is_deterministic: z.boolean(),
  common_mistakes: z.array(z.string()),
  version_compatibility: z.string().min(1),
  use_cases: z.array(z.string()).min(1),
});

export type SyntaxConstruct = TypeOf<typeof SyntaxConstructSchema>;

/**
 * Section 10 Common Mistake Schema
 */
export const MistakeSeveritySchema = z.enum([
  'syntax',
  'semantic',
  'runtime',
  'conceptual_misconception',
] as const);

export const MistakeSchema = BaseMetadataSchema.extend({
  incorrect_code: z.string().min(1),
  actual_error: z.string().min(1),
  why_it_happens: z.string().min(1),
  corrected_code: z.string().min(1),
  expected_behaviour: z.string().min(1),
  severity: MistakeSeveritySchema,
  how_to_spot_it: z.string().min(1),
});

export type Mistake = TypeOf<typeof MistakeSchema>;

/**
 * Section 11 Code Pattern Schema
 */
export const PatternComplexitySchema = z.object({
  time: z.string().min(1),
  space: z.string().min(1),
  justification: z.string().min(1),
});

export const PatternSchema = BaseMetadataSchema.extend({
  pattern_id: z.string().min(1),
  name: z.string().min(1),
  problem_solved: z.string().min(1),
  when_to_recognize: z.array(z.string()).min(1),
  conceptual_explanation: z.string().min(1),
  complexity: PatternComplexitySchema,
  variants: z.array(z.string()),
  common_pitfalls: z.array(z.string()),
  exercise_links: z.array(z.string()),
  leetcode_links: z.array(z.string()),
});

export type Pattern = TypeOf<typeof PatternSchema>;

/**
 * Section 13 Exercise Schema
 */
export const TestCaseSchema = z.object({
  input: z.string(),
  expected_output: z.string(),
  is_hidden: z.boolean().optional(),
});

export const ExerciseHintSchema = z.object({
  level: z.number().min(1),
  text: z.string().min(1),
});

export const ExerciseSchema = BaseMetadataSchema.extend({
  exercise_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  starter_code: z.string().min(1),
  test_cases: z.array(TestCaseSchema).min(1),
  hints: z.array(ExerciseHintSchema),
});

export type Exercise = TypeOf<typeof ExerciseSchema>;

/**
 * Section 13 Quiz Schema
 */
export const QuestionTypeSchema = z.enum([
  'multiple_choice',
  'predict_the_output',
  'fix_the_bug',
  'fill_in_the_blank',
  'reorder_lines',
  'short_code_writing',
  'concept_matching',
] as const);

export const QuizSchema = BaseMetadataSchema.extend({
  quiz_id: z.string().min(1),
  question_type: QuestionTypeSchema,
  question: z.string().min(1),
  options: z.array(z.string()).optional(),
  correct_answer: z.string().min(1),
  explanation: z.string().min(1),
  concept_tags: z.array(z.string()).min(1),
  misconception_id: z.string().optional(),
  hints: z.array(z.string()).optional(),
});

export type Quiz = TypeOf<typeof QuizSchema>;

/**
 * Section 5.1 Lesson / Topic Schema (13-part template)
 */
export const PrerequisiteCheckItemSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
  correct_index: z.number(),
  explanation: z.string().min(1),
});

export const LineExplanationSchema = z.object({
  line: z.number().min(1),
  explanation: z.string().min(1),
});

export const WorkedExampleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  code: z.string().min(1),
  expected_output: z.string(),
  line_by_line: z.array(LineExplanationSchema),
  trace_ready: z.boolean().optional(),
});

export const DiagramSchema = z.object({
  type: z.string().min(1),
  source: z.string().min(1),
  alt_text: z.string().min(1),
  concept_tags: z.array(z.string()),
});

export const PredictOutputChallengeSchema = z.object({
  prompt: z.string().min(1),
  code: z.string().min(1),
  expected_output: z.string(),
  explanation: z.string().min(1),
});

export const TopicSchema = BaseMetadataSchema.extend({
  title: z.string().min(1),
  learning_objectives: z.array(z.string()).min(1),
  prerequisites_check: z.array(PrerequisiteCheckItemSchema),
  explanation_simple: z.string().min(1),
  explanation_technical: z.string().min(1),
  syntax: z.string().min(1),
  worked_examples: z.array(WorkedExampleSchema).min(1),
  diagram: DiagramSchema.optional(),
  predict_the_output: z.array(PredictOutputChallengeSchema),
  common_mistake_ids: z.array(z.string()),
  practice_exercise_ids: z.array(z.string()),
  quiz_ids: z.array(z.string()).min(1),
  summary: z.string().min(1),
  what_to_learn_next: z.array(z.string()).min(1),
});

export type Topic = TypeOf<typeof TopicSchema>;

/**
 * Section 12 Language-Neutral Concept Node Schema
 */
export const ConceptNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  prerequisites: z.array(z.string()),
  related_concepts: z.array(z.string()),
  contrasts_with: z.array(z.string()).optional(),
  commonly_confused_with: z.array(z.string()).optional(),
});

export type ConceptNode = TypeOf<typeof ConceptNodeSchema>;

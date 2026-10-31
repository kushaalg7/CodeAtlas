import { z, type TypeOf } from './zod.ts';

/**
 * Section 6.4 Language-Neutral Trace Event Schema
 * Used by Trace Studio bridge to visualize step execution, variable assignments,
 * function calls, loops, and stack/heap snapshots without language-specific logic.
 */

export const TraceEventTypeSchema = z.enum([
  'line_executed',
  'variable_assignment',
  'function_call',
  'function_return',
  'loop_iteration',
  'snapshot',
] as const);

export const StackFrameSchema = z.object({
  function_name: z.string().min(1),
  line: z.number().min(1),
  variables: z.record(z.string()),
});

export const TraceEventSchema = z.object({
  step: z.number().min(0),
  line: z.number().min(1),
  event_type: TraceEventTypeSchema,
  variable_name: z.string().optional(),
  value: z.string().optional(),
  function_name: z.string().optional(),
  return_value: z.string().optional(),
  loop_index: z.number().optional(),
  stack_depth: z.number().optional(),
  call_stack: z.array(StackFrameSchema).optional(),
  heap_snapshot: z.record(z.string()).optional(),
  stack_snapshot: z.record(z.string()).optional(),
});

export type TraceEventType = TypeOf<typeof TraceEventTypeSchema>;
export type StackFrame = TypeOf<typeof StackFrameSchema>;
export type TraceEvent = TypeOf<typeof TraceEventSchema>;

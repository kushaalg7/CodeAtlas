import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  ManifestSchema,
  SyntaxConstructSchema,
  TopicSchema,
  MistakeSchema,
  PatternSchema,
  ExerciseSchema,
  QuizSchema,
  ConceptNodeSchema,
  BaseMetadataSchema,
} from '../src/content.ts';
import { LearningContextSchema } from '../src/learning-context.ts';
import { LearningDNAEventSchema } from '../src/events.ts';
import { TraceEventSchema } from '../src/trace.ts';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (!condition) {
    failed++;
    console.error(`[FAIL] ${msg}`);
    throw new Error(msg);
  } else {
    passed++;
    console.log(`[PASS] ${msg}`);
  }
}

function testFixture(name: string, schema: any, validFile: string, invalidFile: string) {
  const fixturesDir = path.join(process.cwd(), 'packages', 'schemas', 'test', 'fixtures');
  
  // Valid test
  const validData = JSON.parse(fs.readFileSync(path.join(fixturesDir, validFile), 'utf-8'));
  const validResult = schema.safeParse(validData);
  assert(validResult.success === true, `${name} valid fixture passes validation`);

  // Invalid test
  const invalidData = JSON.parse(fs.readFileSync(path.join(fixturesDir, invalidFile), 'utf-8'));
  const invalidResult = schema.safeParse(invalidData);
  assert(invalidResult.success === false, `${name} invalid fixture fails validation`);
  assert(invalidResult.issues && invalidResult.issues.length > 0, `${name} invalid fixture provides clear issue messages`);
  assert(invalidResult.error && invalidResult.error.message.length > 0, `${name} invalid fixture error contains formatted message`);
}

function runAllTests() {
  console.log('=== Running Schema Fixture Tests ===');

  testFixture('Manifest', ManifestSchema, 'manifest.valid.json', 'manifest.invalid.json');
  testFixture('SyntaxConstruct', SyntaxConstructSchema, 'syntax.valid.json', 'syntax.invalid.json');
  testFixture('Topic (Lesson)', TopicSchema, 'topic.valid.json', 'topic.invalid.json');
  testFixture('Mistake', MistakeSchema, 'mistake.valid.json', 'mistake.invalid.json');
  testFixture('Pattern', PatternSchema, 'pattern.valid.json', 'pattern.invalid.json');
  testFixture('Exercise', ExerciseSchema, 'exercise.valid.json', 'exercise.invalid.json');
  testFixture('Quiz', QuizSchema, 'quiz.valid.json', 'quiz.invalid.json');
  testFixture('ConceptNode', ConceptNodeSchema, 'concept.valid.json', 'concept.invalid.json');
  testFixture('LearningContext', LearningContextSchema, 'learning_context.valid.json', 'learning_context.invalid.json');
  testFixture('LearningDNAEvent', LearningDNAEventSchema, 'learning_dna_event.valid.json', 'learning_dna_event.invalid.json');
  testFixture('TraceEvent', TraceEventSchema, 'trace_event.valid.json', 'trace_event.invalid.json');

  console.log('\n=== Verifying Spec 3.1 Base Metadata Fields ===');
  const requiredSpec31Fields = [
    'id',
    'language',
    'language_version_min',
    'language_version_max',
    'topic',
    'level',
    'prerequisites',
    'related_concepts',
    'doc_references',
    'deprecation_status',
    'review_status',
    'last_verified_date',
    'verified_with_toolchain_version',
  ];

  const baseShapeKeys = Object.keys(BaseMetadataSchema.shape);
  for (const field of requiredSpec31Fields) {
    assert(baseShapeKeys.includes(field), `Spec 3.1 field '${field}' exists in BaseMetadataSchema`);
  }

  console.log('\n=== Verifying Core Interfaces are Language-Neutral ===');
  const coreSrcDir = path.join(process.cwd(), 'packages', 'core', 'src');
  const coreFiles = fs.readdirSync(coreSrcDir);
  for (const file of coreFiles) {
    const content = fs.readFileSync(path.join(coreSrcDir, file), 'utf-8');
    const matches = content.match(/python|pyodide|cpython/i);
    assert(matches === null, `File packages/core/src/${file} has no Python-specific naming`);
  }

  console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);
}

runAllTests();

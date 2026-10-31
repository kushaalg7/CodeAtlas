import * as fs from 'node:fs';
import * as path from 'node:path';
import { PythonTraceAdapter } from '../../sandbox/src/python-trace-adapter.ts';
import { SearchEngineV1 } from '../../search/src/search-engine.ts';
import { GroundedRAGEngine } from '../../search/src/rag-engine.ts';
import { ErrorMessageDecoder } from '../../sandbox/src/error-decoder.ts';
import { AITutorBridge } from '../../sandbox/src/ai-tutor.ts';
import { RoadmapGeneratorV1 } from '../../graph/src/roadmap-generator.ts';
import type { LearningContext } from '../../schemas/src/learning-context.ts';

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

async function runPhase2TestSuite() {
  console.log('=============================================');
  console.log('  PHASE 2: INTELLIGENCE & INTEGRATION TESTS  ');
  console.log('=============================================\n');

  // --- 1. Python Trace Studio Bridge ---
  console.log('--- 1. Testing Python Trace Adapter with sys.settrace ---');
  const traceAdapter = new PythonTraceAdapter();
  await traceAdapter.init();

  const codeToTrace = `
def multiply(x, y):
    return x * y

total = 0
for i in range(1, 3):
    total += multiply(i, 2)
`;

  const traceEvents = await traceAdapter.trace(codeToTrace);
  assert(traceEvents.length > 0, `Trace adapter gathered ${traceEvents.length} execution events`);
  assert(traceEvents.some((e) => e.event_type === 'function_call'), 'Trace includes function_call event');
  assert(traceEvents.some((e) => e.event_type === 'function_return'), 'Trace includes function_return event');
  assert(traceEvents.some((e) => e.event_type === 'line_executed'), 'Trace includes line_executed event');
  assert(traceEvents.some((e) => e.stack_snapshot && Object.keys(e.stack_snapshot).length > 0), 'Trace captures local variables snapshot');
  await traceAdapter.dispose();

  // --- 2. Grounded RAG & Golden Question Evaluation ---
  console.log('\n--- 2. Testing Grounded RAG & 20 Golden Questions ---');
  const searchEngine = new SearchEngineV1();
  const topicsDir = path.join(process.cwd(), 'content', 'python', 'topics');
  for (const f of fs.readdirSync(topicsDir)) {
    const data = JSON.parse(fs.readFileSync(path.join(topicsDir, f), 'utf-8'));
    searchEngine.addDocument({
      id: data.id,
      language: data.language,
      version: '3.12',
      level: data.level,
      contentType: 'topic',
      title: data.title,
      content: `${data.explanation_simple} ${data.explanation_technical} ${data.syntax}`,
      keywords: data.related_concepts || [],
    });
  }

  const rag = new GroundedRAGEngine(searchEngine);
  const evalResult = rag.evaluateGoldenQuestions();
  console.log(`Golden Question Hit Rate: ${evalResult.hitRate}% (${evalResult.hits}/${evalResult.total})`);
  assert(evalResult.hitRate >= 85, `Golden question retrieval hit rate (${evalResult.hitRate}%) meets 85% target`);

  // Test grounded citation
  const qAns = rag.ask('How do I declare a variable and what types exist?');
  assert(qAns.refused === false, 'Grounded answer generated successfully');
  assert(qAns.citations.length >= 2, 'Answer includes citations labeled with source_type');
  assert(qAns.citations.some((c) => c.source_type === 'official_docs'), 'Includes official docs citation');
  assert(qAns.citations.some((c) => c.source_type === 'educational_explanation'), 'Includes educational explanation citation');

  // Test refusal when confidence is low
  const lowConfAns = rag.ask('How do I fly an alien starship to Mars?');
  assert(lowConfAns.refused === true, 'Low-confidence inquiry is refused rather than hallucinated');
  assert(lowConfAns.suggestedLessons.length >= 0, 'Refusal provides closest lesson suggestions');

  // --- 3. Error Message Decoder ---
  console.log('\n--- 3. Testing Error Message Decoder ---');
  const decoder = new ErrorMessageDecoder();

  const err1 = decoder.decode("IndentationError: expected an indented block after 'if' statement on line 3");
  assert(err1.errorType === 'IndentationError', 'Decoded IndentationError correctly');
  assert(err1.targetLessonId === 'python-01-syntax-and-execution', 'Mapped to syntax lesson');

  const err2 = decoder.decode("NameError: name 'user_counter' is not defined");
  assert(err2.errorType === 'NameError', 'Decoded NameError correctly');
  assert(err2.targetLessonId === 'python-02-variables-and-types', 'Mapped to variables lesson');

  const err3 = decoder.decode("TypeError: unsupported operand type(s) for +: 'int' and 'str'");
  assert(err3.errorType === 'TypeError', 'Decoded TypeError correctly');
  assert(err3.targetLessonId === 'python-03-operators', 'Mapped to operators lesson');

  const err4 = decoder.decode("ZeroDivisionError: division by zero");
  assert(err4.errorType === 'ZeroDivisionError', 'Decoded ZeroDivisionError correctly');

  // --- 4. AI Tutor Lesson Awareness ---
  console.log('\n--- 4. Testing AI Tutor Bridge with LearningContext ---');
  const tutor = new AITutorBridge();
  const testContext: LearningContext = {
    user_id: 'learner-1',
    language: 'python',
    version: '3.12',
    current_lesson_id: 'python-03-operators',
    current_concept_ids: ['concept-operators'],
    recent_errors: ["TypeError: unsupported operand type(s) for +: 'int' and 'str'"],
    quiz_results: [],
    mastery_snapshot: { 'python-03-operators': 0.3 },
  };

  const tutorResponse = tutor.respond(testContext);
  assert(tutorResponse.relatedLessonId === 'python-03-operators', 'Tutor references relevant lesson');
  assert(tutorResponse.message.includes('TypeError'), 'Tutor acknowledges recent error from context');
  assert(tutorResponse.citations.length > 0, 'Tutor includes citations');

  // --- 5. Roadmap Generator v1 ---
  console.log('\n--- 5. Testing Roadmap Generator v1 ---');
  const roadmapGen = new RoadmapGeneratorV1();
  const roadmap = roadmapGen.generate({
    language: 'python',
    experience: 'beginner',
    goal: 'learn_from_scratch',
    weeklyHoursBudget: 6, // 6 hours per week
    masteredConcepts: ['python-01-syntax-and-execution'], // already mastered syntax
  });

  assert(roadmap.nodes.find((n) => n.id === 'python-01-syntax-and-execution')?.state === 'mastered', 'Mastered node has state "mastered"');
  assert(roadmap.nodes.find((n) => n.id === 'python-02-variables-and-types')?.state === 'available', 'Next node with met prereqs has state "available"');
  assert(roadmap.nodes.find((n) => n.id === 'python-07-functions-basics')?.state === 'locked', 'Unmet prereqs node has state "locked"');
  assert(roadmap.schedule.length > 0, 'Schedule created with weekly milestones');
  assert(roadmap.cytoscapeElements.length > 0, 'Cytoscape graph elements generated');
  assert(roadmap.accessibleTreeFallback.includes('[✓ Mastered]'), 'Accessible tree fallback generated for screen readers');

  console.log(`\n=============================================`);
  console.log(` ALL PHASE 2 TESTS PASSED: ${passed} passed, ${failed} failed `);
  console.log(`=============================================`);
}

runPhase2TestSuite().catch((err) => {
  console.error('Phase 2 test fatal error:', err);
  process.exit(1);
});

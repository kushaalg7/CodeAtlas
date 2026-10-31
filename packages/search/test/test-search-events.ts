import * as fs from 'node:fs';
import * as path from 'node:path';
import { SearchEngineV1, type SearchDocument } from '../src/search-engine.ts';
import { computeMasteryUpdate } from '../../events/src/mastery.ts';
import { LearnerEventStore } from '../../events/src/learner-store.ts';
import type { LearningDNAEvent } from '../../schemas/src/events.ts';

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

function runStep6Tests() {
  console.log('=============================================');
  console.log(' STEP 6: SEARCH V1, QUIZZES & LEARNING DNA   ');
  console.log('=============================================\n');

  // --- 1. Populate Search Index from Generated Python Lessons ---
  console.log('--- 1. Testing Search v1 with Real Python Lessons ---');
  const searchEngine = new SearchEngineV1();
  const topicsDir = path.join(process.cwd(), 'content', 'python', 'topics');
  const topicFiles = fs.readdirSync(topicsDir);

  for (const f of topicFiles) {
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

  // Typical query: "variables"
  const varResults = searchEngine.search('variables');
  assert(varResults.length > 0, 'Search finds results for typical query "variables"');
  assert(varResults[0].doc.id === 'python-02-variables-and-types', 'Top result for "variables" is the variables lesson');

  // Typical query: "loops"
  const loopResults = searchEngine.search('loops');
  assert(loopResults.length > 0, 'Search finds results for "loops"');
  assert(loopResults[0].doc.id === 'python-06-loops', 'Top result for "loops" is the loops lesson');

  // Synonym query: "iteration" maps to loop
  const synResults = searchEngine.search('iteration');
  assert(synResults.some((r) => r.doc.id === 'python-06-loops'), 'Synonym expansion correctly matches "iteration" to loops');

  // Typo query: "funtions"
  const typoResults = searchEngine.search('funtions');
  assert(typoResults.some((r) => r.doc.id.includes('functions')), 'Typo tolerance finds functions lesson despite misspelling');

  // Filter test: level "beginner"
  const filterResults = searchEngine.search('Python', { level: 'beginner' });
  assert(filterResults.length > 0 && filterResults.every((r) => r.doc.level === 'beginner'), 'Level filter restricts search correctly');

  // Junk query: random string should fail gracefully
  const junkResults = searchEngine.search('asdkjhfasdf9834720934789234');
  assert(junkResults.length === 0, 'Search fails gracefully on junk query with zero results');

  // --- 2. Unit Tests for Evidence-Weighted Mastery Update Rule ---
  console.log('\n--- 2. Testing Evidence-Weighted Mastery Update Rule ---');
  
  // Starting from 0.0, quiz correct with 0 hints -> +0.25
  const u1 = computeMasteryUpdate({ currentScore: 0.0, eventType: 'quiz_answered', success: true, hintsUsed: 0 });
  assert(u1.newScore === 0.25, 'Unprompted quiz success increases score by +0.25');
  assert(u1.state === 'in_progress', 'Score 0.25 transitions state to "in_progress"');

  // Quiz correct with 1 hint -> +0.15
  const u2 = computeMasteryUpdate({ currentScore: 0.25, eventType: 'quiz_answered', success: true, hintsUsed: 1 });
  assert(u2.newScore === 0.40, 'Quiz success with 1 hint increases score by +0.15');

  // Quiz incorrect -> -0.15
  const u3 = computeMasteryUpdate({ currentScore: 0.40, eventType: 'quiz_answered', success: false });
  assert(u3.newScore === 0.25, 'Incorrect quiz decreases score by -0.15');

  // Exercise passed -> +0.35
  const u4 = computeMasteryUpdate({ currentScore: 0.25, eventType: 'exercise_submitted', success: true });
  assert(u4.newScore === 0.60, 'Passed exercise increases score by +0.35');

  // Progress to mastered (>= 0.80)
  const u5 = computeMasteryUpdate({ currentScore: 0.60, eventType: 'quiz_answered', success: true, hintsUsed: 0 });
  assert(u5.newScore === 0.85, 'Mastery reaches 0.85');
  assert(u5.state === 'mastered', 'Score >= 0.80 transitions state to "mastered"');

  // Bound checks: cannot exceed 1.0 or fall below 0.0
  const uMax = computeMasteryUpdate({ currentScore: 0.95, eventType: 'exercise_submitted', success: true });
  assert(uMax.newScore === 1.0, 'Score is clamped at upper bound 1.0');

  const uMin = computeMasteryUpdate({ currentScore: 0.05, eventType: 'quiz_answered', success: false });
  assert(uMin.newScore === 0.0, 'Score is clamped at lower bound 0.0');

  // --- 3. Learner Privacy, Data Export, and Deletion Tests ---
  console.log('\n--- 3. Testing Learner Privacy Data View, Export & Deletion ---');
  const store = new LearnerEventStore();
  const testUserId = 'student-771';

  const evt1: LearningDNAEvent = {
    event_id: 'evt-1',
    user_id: testUserId,
    language: 'python',
    timestamp: new Date().toISOString(),
    event_type: 'lesson_started',
    payload: { lesson_id: 'python-01-syntax-and-execution' },
  };

  const evt2: LearningDNAEvent = {
    event_id: 'evt-2',
    user_id: testUserId,
    language: 'python',
    timestamp: new Date().toISOString(),
    event_type: 'quiz_answered',
    payload: { quiz_id: 'quiz-01', correctness: true, hints_used: 0 },
  };

  store.recordEvent(evt1);
  store.recordEvent(evt2);

  const initialEvents = store.getEvents(testUserId);
  assert(initialEvents.length === 2, 'Learner data view accurately displays recorded events');

  // Export
  const exportedJson = store.exportData(testUserId);
  const parsedExport = JSON.parse(exportedJson);
  assert(parsedExport.user_id === testUserId, 'Export JSON contains correct user_id');
  assert(parsedExport.total_events === 2, 'Export JSON contains all recorded events');
  assert(parsedExport.events[1].event_id === 'evt-2', 'Export preserves event details');

  // Delete
  const deleteResult = store.deleteUserData(testUserId);
  assert(deleteResult === true, 'deleteUserData reports successful purge');
  const postDeleteEvents = store.getEvents(testUserId);
  assert(postDeleteEvents.length === 0, 'Export and delete actually removes all learner records (Rule 12)');

  console.log(`\n=============================================`);
  console.log(` ALL STEP 6 TESTS PASSED: ${passed} passed, ${failed} failed `);
  console.log(`=============================================`);
}

runStep6Tests();

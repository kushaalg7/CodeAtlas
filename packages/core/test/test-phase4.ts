import * as path from 'node:path';
import { SpacedRepetitionScheduler, type ConceptReviewItem } from '../../events/src/spaced-repetition.ts';
import { InterviewPrepHub } from '../../sandbox/src/interview-prep.ts';
import { runAccessibilityAudit } from '../../../tools/ci/accessibility-audit.ts';
import { PythonExecutionAdapter } from '../../sandbox/src/python-adapter.ts';

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

async function runPhase4TestSuite() {
  console.log('=============================================');
  console.log('     PHASE 4: DEPTH & POLISH TESTS           ');
  console.log('=============================================\n');

  // --- 1. Spaced Repetition Queue ---
  console.log('--- 1. Testing Spaced-Repetition SM-2 Queue ---');
  const scheduler = new SpacedRepetitionScheduler();

  const initialItem: ConceptReviewItem = {
    conceptId: 'concept-loops',
    repetitionNumber: 0,
    intervalDays: 0,
    easeFactor: 2.5,
    nextReviewDate: '2026-10-30',
  };

  // First successful review (Grade 4) -> 1 day interval
  const rev1 = scheduler.calculateNextReview(initialItem, 4);
  assert(rev1.repetitionNumber === 1, 'First success sets repetitionNumber to 1');
  assert(rev1.intervalDays === 1, 'First success sets interval to 1 day');

  // Second successful review (Grade 5) -> 3 days interval
  const rev2 = scheduler.calculateNextReview(rev1, 5);
  assert(rev2.repetitionNumber === 2, 'Second success sets repetitionNumber to 2');
  assert(rev2.intervalDays === 3, 'Second success sets interval to 3 days');

  // Third successful review -> 3 * 2.5 = 8 days
  const rev3 = scheduler.calculateNextReview(rev2, 4);
  assert(rev3.intervalDays >= 7, 'Subsequent success scales interval by ease factor');

  // Failure review (Grade 1 - forgotten) -> resets to 1 day
  const revFail = scheduler.calculateNextReview(rev3, 1);
  assert(revFail.repetitionNumber === 0, 'Forgotten review resets repetitionNumber to 0');
  assert(revFail.intervalDays === 1, 'Forgotten review resets interval to 1 day');

  // Due items
  const dueItems = scheduler.getDueReviews([initialItem, rev3], '2026-10-30');
  assert(dueItems.length === 1 && dueItems[0].conceptId === 'concept-loops', 'Due queue filters items correctly');

  // --- 2. Interview & Competitive Prep ---
  console.log('\n--- 2. Testing Interview Prep Templates & Execution ---');
  const prep = new InterviewPrepHub();
  const templates = prep.getTemplates('python');
  assert(templates.length >= 3, 'Interview prep has templates for Fast I/O, recursion, and edge cases');

  // Verify arbitrary precision bignum snippet runs on Python toolchain
  const py = new PythonExecutionAdapter();
  await py.init();
  const bignumRes = await py.execute('x = 2**64\nprint(x)');
  assert(bignumRes.exitCode === 0, 'Arbitrary precision calculation executes cleanly');
  assert(bignumRes.stdout.trim() === '18446744073709551616', 'Bignum output matches verified value without overflow');
  await py.dispose();

  // --- 3. Accessibility Audit ---
  console.log('\n--- 3. Testing Accessibility & Design Token Standards ---');
  const cssPath = path.join(process.cwd(), 'apps', 'web', 'styles', 'tokens.css');
  const htmlPath = path.join(process.cwd(), 'apps', 'web', 'index.html');
  const audit = runAccessibilityAudit(cssPath, htmlPath);

  assert(audit.pass === true, 'Accessibility audit passes all requirements');
  assert(audit.reducedMotionStylesVerified === true, 'prefers-reduced-motion media query verified');
  assert(audit.keyboardFocusTokensVerified === true, ':focus-visible accessible focus ring verified');
  assert(audit.contrastChecksPassed === true, 'High-contrast neon dark palette verified (AAA)');

  console.log(`\n=============================================`);
  console.log(` ALL PHASE 4 TESTS PASSED: ${passed} passed, ${failed} failed `);
  console.log(`=============================================`);
}

runPhase4TestSuite().catch((err) => {
  console.error('Phase 4 fatal error:', err);
  process.exit(1);
});

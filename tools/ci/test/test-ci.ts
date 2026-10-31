import * as path from 'node:path';
import * as fs from 'node:fs';
import { validateContentDirectory } from '../validate-schemas.ts';
import { runExamplesInDirectory } from '../run-examples.ts';
import { checkLinksInDirectory, type HttpHandler } from '../check-links.ts';
import { analyzeGraph } from '../check-graph.ts';
import { lintLearnerFacingContent } from '../lint-learner-views.ts';
import { runQualityPipeline } from '../pipeline.ts';

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

async function runCiTestSuite() {
  console.log('=============================================');
  console.log('       STEP 2: CI QUALITY PIPELINE TESTS     ');
  console.log('=============================================\n');

  const baseFixtures = path.join(process.cwd(), 'tools', 'ci', 'test', 'fixtures');
  const validDir = path.join(baseFixtures, 'valid');

  // Test 1: Valid content passes all checks
  console.log('--- 1. Testing Valid Content Set ---');
  const validRes = await runQualityPipeline({
    contentDir: validDir,
    language: 'python',
    coverageOutputPath: path.join(process.cwd(), 'coverage', 'python.json'),
    strictLearnerView: true,
  });
  assert(validRes.overallPass === true, 'Valid content passes the complete CI pipeline');
  assert(validRes.schemas.pass === true, 'Schema validation passes for valid content');
  assert(validRes.examples.pass === true, 'Example runner passes for valid content');
  assert(validRes.examples.verifiedExamples === 2, 'Example runner executes and verifies all 2 valid examples');
  assert(validRes.links.pass === true, 'Link checker passes for valid doc references');
  assert(validRes.graph.pass === true, 'Graph check passes with no broken prereqs or orphans');
  assert(validRes.learnerLint.pass === true, 'Learner lint passes (no draft items in valid content)');

  // Test 2: Check 1 Broken Schema
  console.log('\n--- 2. Testing Check 1: Schema Validator Failure ---');
  const brokenSchemaDir = path.join(baseFixtures, 'broken_schema');
  const schemaRes = validateContentDirectory(brokenSchemaDir);
  assert(schemaRes.pass === false, 'Schema validator fails on broken schema fixture');
  assert(schemaRes.errors.length > 0, 'Schema validator emits explicit error details');
  assert(
    schemaRes.errors.some((e) => e.includes('review_status') || e.includes('deprecation_status') || e.includes('failed validation')),
    'Schema validator failed for the right reason (missing required metadata fields)'
  );

  // Test 3: Check 2 Broken Example (Output mismatch)
  console.log('\n--- 3. Testing Check 2: Example Runner Failure ---');
  const brokenExampleDir = path.join(baseFixtures, 'broken_example');
  const exampleRes = runExamplesInDirectory(brokenExampleDir);
  assert(exampleRes.pass === false, 'Example runner fails on mismatched output fixture');
  assert(exampleRes.toolchainVersion.length > 0, `Example runner records toolchain version: ${exampleRes.toolchainVersion}`);
  assert(
    exampleRes.errors.some((e) => e.includes('Output mismatch')),
    'Example runner failed for the right reason (Output mismatch between expected and actual)'
  );

  // Test 4: Check 3 Broken Link (404 / Invalid URL)
  console.log('\n--- 4. Testing Check 3: Link Checker Failure ---');
  const brokenLinkDir = path.join(baseFixtures, 'broken_link');
  const linkRes = await checkLinksInDirectory(brokenLinkDir);
  assert(linkRes.pass === false, 'Link checker fails on non-existent documentation URL');
  assert(
    linkRes.errors.some((e) => e.includes('Broken link (404)')),
    'Link checker failed for the right reason (Broken link 404)'
  );

  // Test 5: Check 4 Broken Graph (Missing Prerequisite)
  console.log('\n--- 5. Testing Check 4: Broken Prerequisite Failure ---');
  const brokenPrereqDir = path.join(baseFixtures, 'broken_graph_prereq');
  const graphPrereqRes = analyzeGraph(brokenPrereqDir);
  assert(graphPrereqRes.pass === false, 'Graph checker fails when a prerequisite does not exist');
  assert(
    graphPrereqRes.brokenPrerequisites.some((p) => p.includes('nonexistent-concept-404')),
    'Graph checker failed for the right reason (Identified broken prerequisite nonexistent-concept-404)'
  );

  // Test 6: Check 4 Broken Graph (Orphan Concept)
  console.log('\n--- 6. Testing Check 4: Orphan Concept Failure ---');
  const brokenOrphanDir = path.join(baseFixtures, 'broken_graph_orphan');
  const graphOrphanRes = analyzeGraph(brokenOrphanDir);
  assert(graphOrphanRes.pass === false, 'Graph checker fails on isolated orphan concept node');
  assert(
    graphOrphanRes.orphanConcepts.some((o) => o.includes('concept-lonely-orphan')),
    'Graph checker failed for the right reason (Identified orphan concept concept-lonely-orphan)'
  );

  // Test 7: Check 5 Learner View Lint (Draft Item Blocked)
  console.log('\n--- 7. Testing Check 5: Learner-Facing Lint Failure ---');
  const brokenDraftDir = path.join(baseFixtures, 'broken_draft');
  const draftLintRes = lintLearnerFacingContent(brokenDraftDir);
  assert(draftLintRes.pass === false, 'Learner view lint fails when draft content appears in bundle');
  assert(
    draftLintRes.blockedItems.some((b) => b.reason.includes("review_status: 'draft'")),
    "Learner view lint failed for the right reason (review_status 'draft' blocked from student views)"
  );

  // Test 8: Coverage JSON Verification
  console.log('\n--- 8. Verifying Automated Coverage JSON Output ---');
  const coveragePath = path.join(process.cwd(), 'coverage', 'python.json');
  assert(fs.existsSync(coveragePath), 'Coverage JSON file exists and was written by pipeline');
  const cov = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
  assert(cov.language === 'python', 'Coverage JSON records correct language');
  assert(typeof cov.toolchain_version === 'string' && cov.toolchain_version.length > 0, `Coverage JSON records toolchain: ${cov.toolchain_version}`);
  assert(cov.topics_written === 1, `Coverage JSON calculated topics written: ${cov.topics_written}`);
  assert(cov.examples_verified === 2, `Coverage JSON calculated examples verified: ${cov.examples_verified}`);
  assert(cov.verification_rate === 100, `Coverage JSON calculated verification rate: ${cov.verification_rate}%`);

  console.log(`\n=============================================`);
  console.log(` ALL CHECKS PASSED: ${passed} passed, ${failed} failed `);
  console.log(`=============================================`);
}

runCiTestSuite().catch((err) => {
  console.error('Test Suite encountered fatal error:', err);
  process.exit(1);
});

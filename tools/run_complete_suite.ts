import * as child_process from 'node:child_process';
import * as fs from 'node:fs';

const agyPath = process.env.APPDATA ? `${process.env.APPDATA}\\Antigravity\\bin\\agy-node.cmd` : '';
const nodeCmd = (agyPath && fs.existsSync(agyPath)) ? agyPath : 'node';

function runStep(name: string, cmd: string, args: string[]) {
  console.log(`\n>>> Running: ${name} ...`);
  const res = child_process.spawnSync(cmd, args, { encoding: 'utf-8', shell: true });
  const out = (res.stdout || res.stderr || '').trim();
  if (res.status === 0) {
    console.log(`[PASS] ${name}`);
  } else {
    console.error(`[FAIL] ${name}:\n${out}`);
    process.exit(1);
  }
}

console.log('===============================================================');
console.log('       CODE ATLAS — COMPLETE MASTER TEST & CI SUITE            ');
console.log('===============================================================');

// Step 0
runStep('Step 0: ADR & Plan Verification', 'python', ['tools/verify_step_0.py']);

// Step 1
runStep('Step 1: Schemas & Core Contracts', nodeCmd, ['--experimental-strip-types', 'packages/schemas/test/test-schemas.ts']);

// Step 2
runStep('Step 2: CI Quality Pipeline & Broken Fixtures', nodeCmd, ['--experimental-strip-types', 'tools/ci/test/test-ci.ts']);

// Step 3
runStep('Step 3: App Shell, Design System, & Mermaid', nodeCmd, ['--experimental-strip-types', 'apps/web/test/test-web.ts']);

// Step 4
runStep('Step 4: Playground Sandbox & Abuse Watchdogs', nodeCmd, ['--experimental-strip-types', 'packages/sandbox/test/test-sandbox-abuse.ts']);

// Step 5
runStep('Step 5: Pinned Toolchain Run on Python Lessons', nodeCmd, ['--experimental-strip-types', 'tools/run_step_5.ts']);

// Step 6
runStep('Step 6: Search v1, Mastery Update Rule, & Privacy', nodeCmd, ['--experimental-strip-types', 'packages/search/test/test-search-events.ts']);

// Phase 2
runStep('Phase 2: Trace Studio, Grounded RAG, AI Tutor & Roadmap', nodeCmd, ['--experimental-strip-types', 'packages/core/test/test-phase2.ts']);

// Phase 3
runStep('Phase 3: Breadth Modularity, Comparisons & Patterns', nodeCmd, ['--experimental-strip-types', 'packages/core/test/test-phase3.ts']);

// Phase 4
runStep('Phase 4: Spaced Repetition, Interview Prep & Accessibility', nodeCmd, ['--experimental-strip-types', 'packages/core/test/test-phase4.ts']);

console.log('\n===============================================================');
console.log('  ALL 10 VERIFICATION SUITES PASSED! CODE ATLAS READY FOR 13:00 ');
console.log('===============================================================');

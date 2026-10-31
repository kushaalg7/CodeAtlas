import * as child_process from 'node:child_process';
import { SearchEngineV1 } from '../packages/search/src/search-engine.ts';
import { PythonExecutionAdapter } from '../packages/sandbox/src/python-adapter.ts';
import * as fs from 'node:fs';
import * as path from 'node:path';

function runCmd(cmd: string, args: string[]): { pass: boolean; output: string } {
  const res = child_process.spawnSync(cmd, args, { encoding: 'utf-8', shell: true });
  return {
    pass: res.status === 0,
    output: (res.stdout || res.stderr || '').trim(),
  };
}

async function measureBenchmarks() {
  console.log('=== Measuring Performance Benchmarks ===');

  // 1. Search Latency
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
      content: `${data.explanation_simple} ${data.syntax}`,
      keywords: data.related_concepts || [],
    });
  }

  const queries = ['variables', 'for loop', 'functions', 'print', 'conditions'];
  const startSearch = performance.now();
  for (let i = 0; i < 50; i++) {
    for (const q of queries) {
      searchEngine.search(q);
    }
  }
  const avgSearchMs = Math.round(((performance.now() - startSearch) / 250) * 100) / 100;

  // 2. Playground Start Time
  const adapter = new PythonExecutionAdapter();
  const startInit = performance.now();
  await adapter.init();
  const initDurationMs = Math.round((performance.now() - startInit) * 100) / 100;

  const startRun = performance.now();
  await adapter.execute('x = 42\nprint(x)');
  const executionDurationMs = Math.round((performance.now() - startRun) * 100) / 100;
  await adapter.dispose();

  console.log(`Average Search Latency: ${avgSearchMs} ms (Budget: < 50ms)`);
  console.log(`Playground Init Time: ${initDurationMs} ms (Budget: < 200ms)`);
  console.log(`Playground First Execution: ${executionDurationMs} ms (Budget: < 1000ms)`);

  return { avgSearchMs, initDurationMs, executionDurationMs };
}

async function runGate() {
  const nodeCmd = 'C:\\Users\\Student\\AppData\\Roaming\\Antigravity\\bin\\agy-node.cmd';
  
  console.log('=== Running Step 0 Verification ===');
  const s0 = runCmd('python', ['tools/verify_step_0.py']);
  console.log('Step 0:', s0.pass ? 'PASS' : 'FAIL');

  console.log('=== Running Step 1 Schema Tests ===');
  const s1 = runCmd(nodeCmd, ['--experimental-strip-types', 'packages/schemas/test/test-schemas.ts']);
  console.log('Step 1:', s1.pass ? 'PASS' : 'FAIL');

  console.log('=== Running Step 2 CI Tests ===');
  const s2 = runCmd(nodeCmd, ['--experimental-strip-types', 'tools/ci/test/test-ci.ts']);
  console.log('Step 2:', s2.pass ? 'PASS' : 'FAIL');

  console.log('=== Running Step 3 App Shell Tests ===');
  const s3 = runCmd(nodeCmd, ['--experimental-strip-types', 'apps/web/test/test-web.ts']);
  console.log('Step 3:', s3.pass ? 'PASS' : 'FAIL');

  console.log('=== Running Step 4 Sandbox Abuse Tests ===');
  const s4 = runCmd(nodeCmd, ['--experimental-strip-types', 'packages/sandbox/test/test-sandbox-abuse.ts']);
  console.log('Step 4:', s4.pass ? 'PASS' : 'FAIL');

  console.log('=== Running Step 6 Search & Event Tests ===');
  const s6 = runCmd(nodeCmd, ['--experimental-strip-types', 'packages/search/test/test-search-events.ts']);
  console.log('Step 6:', s6.pass ? 'PASS' : 'FAIL');

  const benchmarks = await measureBenchmarks();

  const allPass = s0.pass && s1.pass && s2.pass && s3.pass && s4.pass && s6.pass;
  console.log(`\nConsolidated Gate Status: ${allPass ? 'ALL TESTS PASSED' : 'FAILURES DETECTED'}`);
}

runGate();

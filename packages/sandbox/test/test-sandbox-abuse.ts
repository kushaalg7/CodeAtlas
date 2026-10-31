import * as fs from 'node:fs';
import * as path from 'node:path';
import { PythonExecutionAdapter } from '../src/python-adapter.ts';

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

async function runSandboxAbuseTests() {
  console.log('=============================================');
  console.log('   STEP 4: PYTHON PLAYGROUND & SANDBOX TESTS ');
  console.log('=============================================\n');

  const adapter = new PythonExecutionAdapter();
  await adapter.init();
  assert(adapter.isReady() === true, 'PythonExecutionAdapter initializes and reports ready');

  // Test 1: Normal Execution with Stdin Panel
  console.log('--- 1. Testing Normal Execution with Stdin Panel ---');
  const normalRes = await adapter.execute(
    'name = input()\nprint(f"Welcome, {name}!")',
    'LearnerAda\n'
  );
  assert(normalRes.exitCode === 0, 'Normal execution exits with code 0');
  assert(normalRes.stdout.trim() === 'Welcome, LearnerAda!', `Stdout received stdin properly: ${normalRes.stdout.trim()}`);
  assert(normalRes.timedOut === false, 'Normal execution did not time out');

  // Test 2: Abuse Test - Infinite Loop Termination
  console.log('\n--- 2. Abuse Test: Infinite Loop Watchdog Termination ---');
  const loopStartTime = Date.now();
  const loopRes = await adapter.execute('while True:\n    pass', '', { timeoutMs: 1500 });
  const loopDuration = Date.now() - loopStartTime;

  assert(loopRes.timedOut === true, 'Infinite loop was caught by timeout watchdog');
  assert(loopRes.exitCode === -1, 'Terminated loop exited with -1');
  assert(loopRes.errorType === 'timeout', 'Error type correctly classified as "timeout"');
  assert(loopDuration >= 1400 && loopDuration < 3500, `Execution halted promptly (${loopDuration}ms)`);

  // Verify system stays responsive after killing the run
  console.log('\n--- 3. Verifying System Responsiveness After Terminated Run ---');
  const followUpRes = await adapter.execute('print("Responsive after termination!")');
  assert(followUpRes.exitCode === 0, 'Follow-up code executes immediately after killed process');
  assert(followUpRes.stdout.trim() === 'Responsive after termination!', 'Correct stdout returned on recovery run');

  // Test 4: Abuse Test - Output Flooding / Buffer Cap
  console.log('\n--- 4. Abuse Test: Huge Output Cap ---');
  const floodRes = await adapter.execute(
    'for i in range(10000):\n    print("SPAM_OUTPUT_FLOOD_ATTEMPT_1234567890")',
    '',
    { timeoutMs: 3000, maxOutputBytes: 16 * 1024 } // 16KB limit
  );
  assert(floodRes.outputCapped === true, 'Excessive output was successfully capped');
  assert(floodRes.stdout.length <= 17 * 1024, `Buffer size stayed bounded (${floodRes.stdout.length} bytes)`);

  // Test 5: Abuse Test - Network Access Denial
  console.log('\n--- 5. Abuse Test: Network Access Denial ---');
  const netRes = await adapter.execute(
    'import socket\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\ns.connect(("1.1.1.1", 80))',
    '',
    { allowNetwork: false }
  );
  assert(netRes.exitCode !== 0, 'Network connection attempt failed');
  assert(
    netRes.stderr.includes('PermissionError') || netRes.stderr.includes('Network access is disabled'),
    'Network access was denied with PermissionError'
  );
  assert(netRes.errorType === 'security', 'Error classified as "security"');

  // Test 6: Verify Documentation of Sandbox Limits
  console.log('\n--- 6. Verifying Sandbox Limits Documentation ---');
  const limitsDocPath = path.join(process.cwd(), 'packages', 'sandbox', 'docs', 'BROWSER_SANDBOX_LIMITS.md');
  assert(fs.existsSync(limitsDocPath), 'BROWSER_SANDBOX_LIMITS.md exists');
  const docContent = fs.readFileSync(limitsDocPath, 'utf-8');
  assert(docContent.includes('What Browser-Side Sandboxing CANNOT Guarantee'), 'Doc lists what browser sandboxing cannot guarantee');
  assert(docContent.includes('What a Server-Side Fallback'), 'Doc lists what server-side fallback adds');

  // Clean up
  await adapter.dispose();
  assert(adapter.isReady() === false, 'Adapter cleanly disposed');

  console.log(`\n=============================================`);
  console.log(` ALL STEP 4 TESTS PASSED: ${passed} passed, ${failed} failed `);
  console.log(`=============================================`);
}

runSandboxAbuseTests().catch((err) => {
  console.error('Step 4 test fatal error:', err);
  process.exit(1);
});

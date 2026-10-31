import * as fs from 'node:fs';
import * as path from 'node:path';
import { CoverageMeterComponent, type CoverageData } from '../src/components/CoverageMeter.ts';
import { MermaidDiagramComponent, ATLAS_GLOW_MERMAID_CONFIG } from '../src/components/MermaidDiagram.ts';
import { LanguageHubShell, HUB_SECTIONS } from '../src/components/LanguageHub.ts';
import { VersionSelectorComponent } from '../src/components/VersionSelector.ts';
import { LessonRendererComponent } from '../src/components/LessonRenderer.ts';
import { SyntaxLibraryComponent } from '../src/components/SyntaxLibrary.ts';
import { lintDiagramSource } from '../src/lint-diagrams.ts';

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

function runWebTestSuite() {
  console.log('=============================================');
  console.log('    STEP 3: APP SHELL & DESIGN SYSTEM TESTS  ');
  console.log('=============================================\n');

  // Test 1: Language Hub Shell has Sections A to P
  console.log('--- 1. Testing Hub Shell Sections A to P ---');
  const hub = new LanguageHubShell();
  assert(HUB_SECTIONS.length === 16, 'Language hub contains exactly 16 sections (A to P)');
  assert(HUB_SECTIONS[0].letter === 'A' && HUB_SECTIONS[0].title === 'Overview', 'Section A is Overview');
  assert(HUB_SECTIONS[15].letter === 'P' && HUB_SECTIONS[15].title === 'Version & Deprecation Timeline', 'Section P is Version Timeline');
  const navHtml = hub.renderNavigation();
  assert(navHtml.includes('A.</strong> Overview') && navHtml.includes('P.</strong> Version & Deprecation Timeline'), 'Navigation renders all letters A to P');

  // Test 2: Coverage meter numbers change dynamically with CI data (nothing hard-coded)
  console.log('\n--- 2. Testing Dynamic Coverage Meter ---');
  const meter = new CoverageMeterComponent();
  
  const ciDataA: CoverageData = {
    language: 'python',
    toolchain_version: 'Python 3.14.10',
    topics_written: 3,
    topics_verified: 3,
    topics_reviewed: 1,
    examples_total: 6,
    examples_verified: 6,
    verification_rate: 100,
  };
  meter.setData(ciDataA);
  let htmlA = meter.renderHtml();
  assert(htmlA.includes('id="val-topics-written" style="font-size: 20px; font-weight: bold; color: #e6f1ff;">3</div>'), 'Meter renders initial topics: 3');
  assert(htmlA.includes('6 / 6'), 'Meter renders initial examples: 6 / 6');

  // Change data dynamically
  const ciDataB: CoverageData = {
    language: 'python',
    toolchain_version: 'Python 3.14.10',
    topics_written: 9,
    topics_verified: 8,
    topics_reviewed: 2,
    examples_total: 25,
    examples_verified: 24,
    verification_rate: 96.0,
  };
  meter.setData(ciDataB);
  let htmlB = meter.renderHtml();
  assert(htmlB.includes('id="val-topics-written" style="font-size: 20px; font-weight: bold; color: #e6f1ff;">9</div>'), 'Meter dynamically updates to topics: 9');
  assert(htmlB.includes('24 / 25'), 'Meter dynamically updates to examples: 24 / 25');
  assert(htmlA !== htmlB, 'Meter output changes dynamically with CI data; nothing hardcoded');

  // Test 3: Diagram works with keyboard only and with animations disabled
  console.log('\n--- 3. Testing Diagram Accessibility & Reduced Motion ---');
  const normalDiagram = new MermaidDiagramComponent({ glowIntensity: 8, reducedMotion: false });
  const reducedMotionDiagram = new MermaidDiagramComponent({ glowIntensity: 8, reducedMotion: true });

  const testDiagramProps = {
    source: 'flowchart LR\n A[Start] --> B[End]',
    altText: 'Flowchart showing execution from start to end',
    outlineView: '1. Start\n2. End (transition from Start)',
  };

  const normalHtml = normalDiagram.renderHtml(testDiagramProps);
  const reducedHtml = reducedMotionDiagram.renderHtml(testDiagramProps);

  assert(normalHtml.includes('tabindex="0"'), 'Diagram container is keyboard focusable via tabindex="0"');
  assert(normalHtml.includes('role="img"'), 'Diagram container carries semantic role="img"');
  assert(normalHtml.includes('aria-label="Flowchart showing execution from start to end"'), 'Diagram carries accessible alt text label');
  assert(normalHtml.includes('btn-toggle-outline'), 'Diagram provides keyboard accessible plain-text outline toggle');
  assert(normalHtml.includes('Plain-Text Outline:'), 'Diagram includes plain text outline fallback');

  // Animation / glow check
  assert(normalHtml.includes('drop-shadow(0 0 8px'), 'Active diagram applies neon drop-shadow glow');
  assert(reducedHtml.includes('filter: none'), 'Reduced motion diagram disables drop-shadow filter and animations');

  // Test 4: Colour is never the only signal
  console.log('\n--- 4. Testing Semantic Node Accessibility (Color Not Sole Signal) ---');
  const masteredLabel = MermaidDiagramComponent.formatSemanticNodeLabel('Variables', 'mastered');
  const progressLabel = MermaidDiagramComponent.formatSemanticNodeLabel('Loops', 'progress');
  const lockedLabel = MermaidDiagramComponent.formatSemanticNodeLabel('Recursion', 'locked');

  assert(masteredLabel.includes('[✓ Mastered]'), 'Mastered node includes checkmark icon and text label');
  assert(progressLabel.includes('[▶ In Progress]'), 'In Progress node includes play icon and text label');
  assert(lockedLabel.includes('[🔒 Locked]'), 'Locked node includes lock icon and text label');

  // Test 5: Mermaid security level is set deliberately and documented in an ADR
  console.log('\n--- 5. Verifying Mermaid Strict Security & ADR Documentation ---');
  assert(ATLAS_GLOW_MERMAID_CONFIG.securityLevel === 'strict', 'Mermaid securityLevel is set to "strict"');
  
  const adr4Path = path.join(process.cwd(), 'docs', 'adr', '0004-graph-storage.md');
  assert(fs.existsSync(adr4Path), 'ADR 0004 exists');
  const adr4Content = fs.readFileSync(adr4Path, 'utf-8');
  assert(
    adr4Content.includes("securityLevel: 'strict'"),
    'ADR 0004 explicitly documents the strict security level decision'
  );

  // Test 6: Lint rejecting content diagrams with inline colours
  console.log('\n--- 6. Testing Diagram Color Lint ---');
  const validMermaid = `
flowchart LR
 A[Variables]:::mastered --> B[Loops]:::progress
 classDef mastered fill:#0a0e1a,stroke:#39ff14
`;
  const invalidMermaid = `
flowchart LR
 A[Variables] --> B[Loops]
 style A fill:#ff0000,stroke:#333
`;
  const validLint = lintDiagramSource(validMermaid, 'valid-diagram');
  assert(validLint.valid === true, 'Diagram using semantic classes passes lint');

  const invalidLint = lintDiagramSource(invalidMermaid, 'invalid-diagram');
  assert(invalidLint.valid === false, 'Diagram with inline color styles fails lint');
  assert(invalidLint.errors[0].includes('Diagram uses inline color styles'), 'Lint error message identifies inline color violation');

  console.log(`\n=============================================`);
  console.log(` ALL STEP 3 TESTS PASSED: ${passed} passed, ${failed} failed `);
  console.log(`=============================================`);
}

runWebTestSuite();

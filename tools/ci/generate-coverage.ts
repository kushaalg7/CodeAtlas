import * as fs from 'node:fs';
import * as path from 'node:path';
import { runExamplesInDirectory, getPythonToolchainVersion } from './run-examples.ts';

export interface CoverageReport {
  language: string;
  toolchain_version: string;
  generated_at: string;
  topics_written: number;
  topics_verified: number;
  topics_reviewed: number;
  syntax_constructs_count: number;
  mistakes_count: number;
  exercises_count: number;
  quizzes_count: number;
  examples_total: number;
  examples_verified: number;
  verification_rate: number;
  ci_passed: boolean;
}

export function computeLanguageCoverage(contentDir: string, language: string = 'python'): CoverageReport {
  let topicsWritten = 0;
  let topicsVerified = 0;
  let topicsReviewed = 0;
  let syntaxCount = 0;
  let mistakesCount = 0;
  let exercisesCount = 0;
  let quizzesCount = 0;

  function countContent(current: string) {
    if (!fs.existsSync(current)) return;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = `${current}/${entry.name}`;
      if (entry.isDirectory()) {
        countContent(full);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          const data = JSON.parse(fs.readFileSync(full, 'utf-8'));
          if (full.includes('/topics/')) {
            topicsWritten++;
            if (data.review_status === 'verified') topicsVerified++;
            if (data.review_status === 'reviewed') topicsReviewed++;
          } else if (full.includes('/syntax/')) {
            syntaxCount++;
          } else if (full.includes('/mistakes/')) {
            mistakesCount++;
          } else if (full.includes('/exercises/')) {
            exercisesCount++;
          } else if (full.includes('/quizzes/')) {
            quizzesCount++;
          }
        } catch {
          // ignore here
        }
      }
    }
  }

  countContent(contentDir);

  const exampleRun = runExamplesInDirectory(contentDir);
  const toolchainVersion = exampleRun.toolchainVersion || getPythonToolchainVersion();

  const totalExamples = exampleRun.totalExamples;
  const verifiedExamples = exampleRun.verifiedExamples;
  const verificationRate = totalExamples > 0 ? (verifiedExamples / totalExamples) * 100 : 100;

  return {
    language,
    toolchain_version: toolchainVersion,
    generated_at: new Date().toISOString(),
    topics_written: topicsWritten,
    topics_verified: topicsVerified,
    topics_reviewed: topicsReviewed,
    syntax_constructs_count: syntaxCount,
    mistakes_count: mistakesCount,
    exercises_count: exercisesCount,
    quizzes_count: quizzesCount,
    examples_total: totalExamples,
    examples_verified: verifiedExamples,
    verification_rate: Math.round(verificationRate * 10) / 10,
    ci_passed: exampleRun.pass,
  };
}

export function saveCoverageReport(report: CoverageReport, outputPath: string) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
}

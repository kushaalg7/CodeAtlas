import { validateContentDirectory } from './validate-schemas.ts';
import { runExamplesInDirectory } from './run-examples.ts';
import { checkLinksInDirectory, defaultMockHttpHandler, type HttpHandler } from './check-links.ts';
import { analyzeGraph } from './check-graph.ts';
import { lintLearnerFacingContent } from './lint-learner-views.ts';
import { computeLanguageCoverage, saveCoverageReport, type CoverageReport } from './generate-coverage.ts';

export interface PipelineOptions {
  contentDir: string;
  language?: string;
  coverageOutputPath?: string;
  httpHandler?: HttpHandler;
  strictLearnerView?: boolean;
}

export interface PipelineResult {
  overallPass: boolean;
  schemas: ReturnType<typeof validateContentDirectory>;
  examples: ReturnType<typeof runExamplesInDirectory>;
  links: Awaited<ReturnType<typeof checkLinksInDirectory>>;
  graph: ReturnType<typeof analyzeGraph>;
  learnerLint: ReturnType<typeof lintLearnerFacingContent>;
  coverage?: CoverageReport;
}

export async function runQualityPipeline(options: PipelineOptions): Promise<PipelineResult> {
  const language = options.language || 'python';
  const httpHandler = options.httpHandler || defaultMockHttpHandler;

  console.log(`[CI Pipeline] Starting quality checks for language: ${language}`);
  console.log(`[CI Pipeline] Target directory: ${options.contentDir}`);

  // 1. Schema Validation
  console.log('[CI 1/5] Validating all content schemas...');
  const schemas = validateContentDirectory(options.contentDir);

  // 2. Example Execution on Pinned Toolchain
  console.log('[CI 2/5] Executing code examples against pinned toolchain...');
  const examples = runExamplesInDirectory(options.contentDir);

  // 3. Link Checker
  console.log('[CI 3/5] Checking documentation reference links (offline-compatible)...');
  const links = await checkLinksInDirectory(options.contentDir, httpHandler);

  // 4. Knowledge Graph Prerequisite & Orphan Checks
  console.log('[CI 4/5] Checking concept graph for broken prerequisites and orphans...');
  const graph = analyzeGraph(options.contentDir);

  // 5. Learner-Facing View Lint
  console.log('[CI 5/5] Linting learner-facing content for draft/unverified blocks...');
  const learnerLint = lintLearnerFacingContent(options.contentDir);

  const overallPass =
    schemas.pass &&
    examples.pass &&
    links.pass &&
    graph.pass &&
    (!options.strictLearnerView || learnerLint.pass);

  let coverage: CoverageReport | undefined;
  if (options.coverageOutputPath) {
    console.log('[CI Coverage] Generating machine-readable coverage JSON...');
    coverage = computeLanguageCoverage(options.contentDir, language);
    saveCoverageReport(coverage, options.coverageOutputPath);
    console.log(`[CI Coverage] Saved to ${options.coverageOutputPath}`);
  }

  return {
    overallPass,
    schemas,
    examples,
    links,
    graph,
    learnerLint,
    coverage,
  };
}

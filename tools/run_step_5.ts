import { runQualityPipeline } from './ci/pipeline.ts';

async function main() {
  const result = await runQualityPipeline({
    contentDir: './content',
    language: 'python',
    coverageOutputPath: './coverage/python.json',
    strictLearnerView: true,
  });

  if (!result.overallPass) {
    console.error('CI Pipeline failed on content');
    process.exit(1);
  }
  console.log(`[PASS] Pinned toolchain verified ${result.examples.verifiedExamples}/${result.examples.totalExamples} examples`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

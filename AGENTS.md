# CODE ATLAS agent rules
1. docs/CODE_ATLAS_SPEC.md is the source of truth. Read the sections relevant to the task before writing code.
2. Work ONLY on the step named in the task. Never start a later step.
3. Before coding, print a plan in 5 lines or fewer: what you will build, what you will stub, what is not feasible yet.
4. Never invent syntax, library behaviour, version facts or doc URLs. If a fact cannot be verified, set status: unverified and exclude it from learner-facing views.
5. Never state or imply complete language coverage. The coverage meter must be computed from CI output, never typed by hand.
6. Write original explanations. Do not copy official docs. Link to the official source and record its licence.
7. Every code example is executed by the CI runner on a pinned toolchain. Recorded output must match displayed output.
8. Treat all learner code as hostile. No network, no host filesystem, CPU/memory/time/output/process limits, rate limits.
9. Core code contains no per-language logic. Languages plug in via content package + ExecutionAdapter + TraceAdapter.
10. Write tests with the code. A task is not done until the test commands pass. Paste the real command output in your report.
11. Pin exact dependency versions. Record any new dependency and why in docs/adr/. Prefer well-known, maintained packages.
12. Never log or retain learner code beyond the configured retention setting.
13. End every task with a gate report: WORKS / STUBBED / NOT FEASIBLE / RISKS / NEXT STEP PLAN.
14. If something cannot be done as written, say so, explain why, and propose the closest honest alternative. Do not fake it.

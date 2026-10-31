/**
 * Coverage Meter Component
 * AGENTS.md Rule 5: Never type coverage by hand.
 * Reads CI coverage JSON and renders live progress bars and metrics.
 */

export interface CoverageData {
  language: string;
  toolchain_version: string;
  topics_written: number;
  topics_verified: number;
  topics_reviewed: number;
  examples_total: number;
  examples_verified: number;
  verification_rate: number;
}

export class CoverageMeterComponent {
  private data: CoverageData | null = null;

  setData(data: CoverageData) {
    this.data = data;
  }

  getData(): CoverageData | null {
    return this.data;
  }

  renderHtml(): string {
    if (!this.data) {
      return `<div class="coverage-meter panel" aria-live="polite">No CI coverage data loaded.</div>`;
    }

    const {
      language,
      toolchain_version,
      topics_written,
      topics_verified,
      topics_reviewed,
      examples_total,
      examples_verified,
      verification_rate,
    } = this.data;

    return `
<section class="coverage-meter panel" aria-labelledby="meter-heading">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
    <h3 id="meter-heading" style="margin: 0; color: var(--neon-cyan, #00f0ff); text-transform: uppercase;">
      ${language} Coverage Meter
    </h3>
    <span class="badge" style="padding: 2px 8px; border-radius: 4px; font-size: 12px; background: #1e294b; color: #39ff14;">
      Toolchain: ${toolchain_version}
    </span>
  </div>

  <div class="meter-bar-container" style="background: #0a0e1a; border-radius: 6px; height: 12px; overflow: hidden; margin-bottom: 16px; border: 1px solid #1e294b;">
    <div class="meter-progress-bar" role="progressbar" aria-valuenow="${verification_rate}" aria-valuemin="0" aria-valuemax="100"
         style="width: ${verification_rate}%; background: linear-gradient(90deg, #00f0ff, #39ff14); height: 100%; transition: width 0.3s ease;">
    </div>
  </div>

  <div class="meter-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px;">
    <div class="stat-card" style="background: #0a0e1a; padding: 8px; border-radius: 4px; text-align: center;">
      <div class="stat-value" id="val-topics-written" style="font-size: 20px; font-weight: bold; color: #e6f1ff;">${topics_written}</div>
      <div class="stat-label" style="font-size: 11px; color: #7a8ba8;">Topics Written</div>
    </div>
    <div class="stat-card" style="background: #0a0e1a; padding: 8px; border-radius: 4px; text-align: center;">
      <div class="stat-value" id="val-topics-verified" style="font-size: 20px; font-weight: bold; color: #00f0ff;">${topics_verified}</div>
      <div class="stat-label" style="font-size: 11px; color: #7a8ba8;">Topics Verified (CI)</div>
    </div>
    <div class="stat-card" style="background: #0a0e1a; padding: 8px; border-radius: 4px; text-align: center;">
      <div class="stat-value" id="val-topics-reviewed" style="font-size: 20px; font-weight: bold; color: #39ff14;">${topics_reviewed}</div>
      <div class="stat-label" style="font-size: 11px; color: #7a8ba8;">Topics Reviewed (Human)</div>
    </div>
    <div class="stat-card" style="background: #0a0e1a; padding: 8px; border-radius: 4px; text-align: center;">
      <div class="stat-value" id="val-examples-verified" style="font-size: 20px; font-weight: bold; color: #ffb300;">${examples_verified} / ${examples_total}</div>
      <div class="stat-label" style="font-size: 11px; color: #7a8ba8;">Examples Verified</div>
    </div>
  </div>
</section>
`.trim();
  }
}

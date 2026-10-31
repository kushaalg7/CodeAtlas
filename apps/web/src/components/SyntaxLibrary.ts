import type { SyntaxConstruct } from '../../packages/schemas/src/content.ts';

/**
 * Syntax Library UI
 * Spec Section 4 (Section C) & Spec Section 3.2
 */
export class SyntaxLibraryComponent {
  private constructs: SyntaxConstruct[] = [];
  private searchQuery: string = '';

  setConstructs(constructs: SyntaxConstruct[]) {
    this.constructs = constructs;
  }

  setSearchQuery(q: string) {
    this.searchQuery = q.toLowerCase();
  }

  getFilteredConstructs(): SyntaxConstruct[] {
    if (!this.searchQuery) return this.constructs;
    return this.constructs.filter((c) =>
      c.name.toLowerCase().includes(this.searchQuery) ||
      c.official_syntax.toLowerCase().includes(this.searchQuery) ||
      c.topic.toLowerCase().includes(this.searchQuery)
    );
  }

  renderHtml(): string {
    const filtered = this.getFilteredConstructs();

    const items = filtered.map((c) => `
<div class="syntax-card panel" style="margin-bottom: 16px; border-left: 3px solid #00f0ff;">
  <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px;">
    <h3 style="margin: 0; color: #00f0ff;">${c.name}</h3>
    <span class="compat-badge" style="font-size: 11px; padding: 2px 6px; background: #1e294b; color: #39ff14; border-radius: 4px;">
      ${c.version_compatibility}
    </span>
  </div>

  <div style="margin: 8px 0; font-family: monospace; background: #0a0e1a; padding: 8px; border-radius: 4px; color: #ffb300;">
    ${c.official_syntax}
  </div>

  <p style="color: #e6f1ff; font-size: 14px; margin: 8px 0;">${c.explanation_simple}</p>

  <details style="margin-top: 8px;">
    <summary style="cursor: pointer; color: #00f0ff; font-size: 13px;">View Parameters & Example</summary>
    <div style="padding: 8px 0;">
      <h5 style="margin: 4px 0; color: #7a8ba8;">Parameters:</h5>
      <ul style="margin: 4px 0; padding-left: 20px; font-size: 13px;">
        ${c.components_or_parameters.map((p) => `<li><code>${p.name}</code>: ${p.description}</li>`).join('')}
      </ul>
      <h5 style="margin: 8px 0 4px 0; color: #7a8ba8;">Example:</h5>
      <pre style="background: #0a0e1a; padding: 8px; border-radius: 4px; color: #39ff14; font-size: 13px;"><code>${c.example}</code></pre>
    </div>
  </details>
</div>
`).join('\n');

    return `
<section class="syntax-library" aria-label="Syntax Reference Library">
  <div class="search-bar" style="margin-bottom: 16px;">
    <input type="search" placeholder="Search syntax constructs..." value="${this.searchQuery}"
           style="width: 100%; max-width: 400px; padding: 8px 12px; background: #10162b; border: 1px solid #1e294b; border-radius: 4px; color: #e6f1ff;"
           aria-label="Filter syntax items">
  </div>
  <div class="syntax-grid">
    ${items.length > 0 ? items : '<p style="color: #7a8ba8;">No matching syntax constructs found.</p>'}
  </div>
</section>
`.trim();
  }
}

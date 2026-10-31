/**
 * Neon Mermaid Visual System ("ATLAS GLOW")
 * Spec Section 20.1 - 20.7
 */

export interface MermaidThemeConfig {
  theme: string;
  securityLevel: 'strict' | 'loose' | 'antiscript' | 'sandbox';
  themeVariables: Record<string, string>;
}

export const ATLAS_GLOW_MERMAID_CONFIG: MermaidThemeConfig = {
  theme: 'base',
  securityLevel: 'strict', // Strict security level prevents XSS injections (ADR 0004)
  themeVariables: {
    darkMode: 'true',
    background: '#0a0e1a',
    primaryColor: '#10162b',
    primaryTextColor: '#e6f1ff',
    primaryBorderColor: '#00f0ff',
    lineColor: '#00f0ff',
    secondaryColor: '#10162b',
    tertiaryColor: '#10162b',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
};

export interface DiagramProps {
  source: string;
  altText: string;
  outlineView: string;
  glowIntensity?: number; // 0 to 10 px
  reducedMotion?: boolean;
}

export class MermaidDiagramComponent {
  private config: MermaidThemeConfig;
  private glowIntensity: number;
  private reducedMotion: boolean;

  constructor(options: { glowIntensity?: number; reducedMotion?: boolean } = {}) {
    this.config = ATLAS_GLOW_MERMAID_CONFIG;
    this.glowIntensity = options.glowIntensity ?? 6;
    this.reducedMotion = options.reducedMotion ?? false;
  }

  getSecurityLevel(): string {
    return this.config.securityLevel;
  }

  setGlowIntensity(intensity: number) {
    this.glowIntensity = Math.max(0, Math.min(12, intensity));
  }

  setReducedMotion(enabled: boolean) {
    this.reducedMotion = enabled;
  }

  /**
   * Generates accessible semantic node labels ensuring color is never the only signal.
   * Pair colors with icons and explicit textual status labels.
   */
  static formatSemanticNodeLabel(label: string, state: 'mastered' | 'progress' | 'available' | 'locked'): string {
    switch (state) {
      case 'mastered':
        return `[✓ Mastered] ${label}`;
      case 'progress':
        return `[▶ In Progress] ${label}`;
      case 'available':
        return `[○ Available] ${label}`;
      case 'locked':
        return `[🔒 Locked] ${label}`;
    }
  }

  /**
   * Renders the accessible container with outline toggle, alt text, and SVG wrapper.
   */
  renderHtml(props: DiagramProps): string {
    const glowStyle = this.reducedMotion
      ? 'filter: none;'
      : `filter: drop-shadow(0 0 ${this.glowIntensity}px var(--neon-cyan, #00f0ff)); transition: filter 0.2s;`;

    return `
<div class="atlas-diagram-container panel" role="region" aria-label="${props.altText}">
  <div class="diagram-controls" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
    <span class="sr-only" style="position: absolute; left: -9999px;">${props.altText}</span>
    <button type="button" class="btn-toggle-outline" aria-expanded="false" style="cursor: pointer; padding: 4px 8px; background: #10162b; color: #00f0ff; border: 1px solid #00f0ff; border-radius: 4px;">
      Toggle Text Outline View
    </button>
    <span class="diagram-motion-badge" style="font-size: 12px; color: var(--muted, #7a8ba8);">
      ${this.reducedMotion ? 'Reduced Motion: ON' : 'Animation: Active'}
    </span>
  </div>

  <div class="diagram-svg-wrapper" style="${glowStyle}" tabindex="0" role="img" aria-label="${props.altText}">
    <pre class="mermaid" style="margin: 0;">${props.source}</pre>
  </div>

  <div class="diagram-outline-view" hidden style="margin-top: 12px; padding: 12px; background: #0a0e1a; border-left: 3px solid #00f0ff; font-family: monospace; white-space: pre-wrap;">
    <strong>Plain-Text Outline:</strong>\n${props.outlineView}
  </div>
</div>
`.trim();
  }
}

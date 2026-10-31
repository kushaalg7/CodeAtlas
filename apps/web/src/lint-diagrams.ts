/**
 * Lint rule rejecting diagrams with hard-coded inline colors.
 * Spec Section 20.2 & 20.7: All diagrams must use semantic classes
 * (e.g. :::mastered, :::progress, :::available, :::locked), never inline hex/rgb colors.
 */

export interface DiagramLintResult {
  valid: boolean;
  errors: string[];
}

export function lintDiagramSource(mermaidSource: string, contextName: string = 'diagram'): DiagramLintResult {
  const errors: string[] = [];
  const lines = mermaidSource.split('\n');

  // Regex detecting inline style directives with colors
  // e.g. style A fill:#123456 or node[label] style fill:red
  const inlineColorRegex = /(?:style\s+\w+\s+.*?(?:fill|stroke|color)\s*:\s*(?:#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|[a-zA-Z]+))|(?:fill\s*:\s*#[0-9a-fA-F]{3,8})/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Allow system-level classDef declarations from the theme config, reject author inline styling
    if (line.startsWith('style ') || (line.includes('style ') && inlineColorRegex.test(line))) {
      errors.push(
        `[${contextName}:${i + 1}] Diagram uses inline color styles: "${line}". Use semantic classDef classes (e.g. :::mastered, :::progress) instead.`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

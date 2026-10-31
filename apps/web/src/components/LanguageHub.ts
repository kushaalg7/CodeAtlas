/**
 * Language Hub Shell
 * Spec Section 4: Sections A to P
 * Accessible, keyboard-navigable hub structure.
 */

export interface HubSection {
  id: string;
  letter: string;
  title: string;
  description: string;
}

export const HUB_SECTIONS: HubSection[] = [
  { id: 'overview', letter: 'A', title: 'Overview', description: 'History, paradigm, typing, execution & memory models, strengths and limits' },
  { id: 'setup', letter: 'B', title: 'Installation & Environment Setup', description: 'OS setup, pinned versions, common environment failures' },
  { id: 'syntax', letter: 'C', title: 'Syntax Reference', description: 'Grammar definitions, parameters, and interactive examples' },
  { id: 'core-concepts', letter: 'D', title: 'Core Concepts', description: 'Essential foundations and mental models' },
  { id: 'advanced-concepts', letter: 'E', title: 'Advanced Concepts', description: 'Concurrency, memory internals, advanced structures' },
  { id: 'standard-libraries', letter: 'F', title: 'Standard Libraries & Important APIs', description: 'Curated core APIs and modules' },
  { id: 'practical-examples', letter: 'G', title: 'Practical Programming Examples', description: 'End-to-end real-world coding recipes' },
  { id: 'common-mistakes', letter: 'H', title: 'Common Mistakes', description: 'Toolchain error decoder and misconceptions' },
  { id: 'best-practices', letter: 'I', title: 'Best Practices', description: 'Style guides, idioms, and rationale' },
  { id: 'roadmap', letter: 'J', title: 'Learning Roadmap', description: 'Prerequisite DAG with interactive progress' },
  { id: 'exercises-quizzes', letter: 'K', title: 'Exercises and Quizzes', description: 'Graded challenges with automated tests' },
  { id: 'interview-prep', letter: 'L', title: 'Interview & Competitive Prep', description: 'I/O templates, idioms, edge cases' },
  { id: 'ecosystem', letter: 'M', title: 'Ecosystem', description: 'Package managers, build tools, linters' },
  { id: 'tooling-debugging', letter: 'N', title: 'Tooling & Debugging', description: 'Debuggers, reading stack traces, profiling' },
  { id: 'glossary-cheatsheet', letter: 'O', title: 'Glossary & Cheat Sheet', description: 'Printable reference cheat sheet' },
  { id: 'version-timeline', letter: 'P', title: 'Version & Deprecation Timeline', description: 'What changed across versions, what to avoid' },
];

export class LanguageHubShell {
  renderNavigation(activeSectionId: string = 'overview'): string {
    const items = HUB_SECTIONS.map((sec) => {
      const isActive = sec.id === activeSectionId;
      return `
<li class="nav-item" style="list-style: none; margin: 4px 0;">
  <a href="#${sec.id}" class="nav-link ${isActive ? 'active' : ''}" data-section="${sec.id}"
     style="display: block; padding: 6px 12px; border-radius: 4px; text-decoration: none; color: ${isActive ? '#00f0ff' : '#e6f1ff'}; background: ${isActive ? '#10162b' : 'transparent'}; border-left: ${isActive ? '3px solid #00f0ff' : '3px solid transparent'};">
    <strong style="color: #ffb300; margin-right: 6px;">${sec.letter}.</strong> ${sec.title}
  </a>
</li>
`.trim();
    }).join('\n');

    return `
<nav class="hub-sidebar" aria-label="Language Hub Sections" style="width: 280px; flex-shrink: 0;">
  <ul style="padding: 0; margin: 0;">
    ${items}
  </ul>
</nav>
`.trim();
  }

  renderSectionContent(sec: HubSection): string {
    return `
<section id="${sec.id}" class="hub-section panel" tabindex="-1" style="margin-bottom: 24px;">
  <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px;">
    <span class="section-letter" style="font-size: 24px; font-weight: bold; color: #ffb300;">${sec.letter}</span>
    <h2 style="margin: 0; color: #00f0ff;">${sec.title}</h2>
  </div>
  <p style="color: #7a8ba8; margin: 0 0 16px 0;">${sec.description}</p>
  <div class="section-body" id="body-${sec.id}">
    <!-- Dynamic section content loaded here -->
  </div>
</section>
`.trim();
  }
}

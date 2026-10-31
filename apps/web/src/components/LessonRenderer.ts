import type { Topic } from '../../packages/schemas/src/content.ts';

/**
 * Lesson Renderer with Level Toggle
 * Spec Section 5.1 (13-part template) & Section 5.2 (Simple / Standard / Deep toggle)
 */
export type ExplanationLevel = 'simple' | 'standard' | 'deep';

export class LessonRendererComponent {
  private level: ExplanationLevel = 'standard';

  setLevel(level: ExplanationLevel) {
    this.level = level;
  }

  getLevel(): ExplanationLevel {
    return this.level;
  }

  renderLesson(lesson: Topic): string {
    const isSimple = this.level === 'simple';
    const isDeep = this.level === 'deep';

    // Worked examples list
    const examplesHtml = (lesson.worked_examples || [])
      .map(
        (ex) => `
<div class="worked-example panel" style="margin: 12px 0;">
  <div style="display: flex; justify-content: space-between;">
    <h4 style="margin: 0 0 8px 0; color: #ffb300;">${ex.title}</h4>
    ${ex.trace_ready ? '<span class="trace-badge" style="color: #39ff14; font-size: 11px;">⚡ Trace Ready</span>' : ''}
  </div>
  <pre style="background: #0a0e1a; padding: 12px; border-radius: 4px; overflow-x: auto; color: #00f0ff;"><code>${ex.code}</code></pre>
  <div style="font-size: 12px; color: #7a8ba8; margin-top: 4px;">
    <strong>Expected Output:</strong>
    <pre style="background: #05070d; padding: 6px; border-radius: 4px; color: #e6f1ff;">${ex.expected_output}</pre>
  </div>
</div>
`
      )
      .join('\n');

    // Quizzes list
    const quizzesHtml = (lesson.quiz_ids || [])
      .map(
        (qid) => `
<div class="lesson-quiz-pill" style="padding: 6px 12px; background: #1e294b; border-radius: 4px; display: inline-block; margin: 4px;">
  📝 Quiz: ${qid}
</div>
`
      )
      .join('\n');

    return `
<article class="lesson-view panel" aria-label="Lesson: ${lesson.title}">
  <header style="border-bottom: 1px solid #1e294b; padding-bottom: 16px; margin-bottom: 20px;">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
      <h1 style="margin: 0; color: #00f0ff;">${lesson.title}</h1>
      <div class="level-toggle-group" role="radiogroup" aria-label="Explanation depth toggle">
        <button class="level-btn ${isSimple ? 'active' : ''}" data-level="simple" style="padding: 4px 8px; border-radius: 4px; background: ${isSimple ? '#00f0ff' : '#10162b'}; color: ${isSimple ? '#0a0e1a' : '#e6f1ff'}; border: 1px solid #00f0ff;">Simple</button>
        <button class="level-btn ${!isSimple && !isDeep ? 'active' : ''}" data-level="standard" style="padding: 4px 8px; border-radius: 4px; background: ${!isSimple && !isDeep ? '#00f0ff' : '#10162b'}; color: ${!isSimple && !isDeep ? '#0a0e1a' : '#e6f1ff'}; border: 1px solid #00f0ff;">Standard</button>
        <button class="level-btn ${isDeep ? 'active' : ''}" data-level="deep" style="padding: 4px 8px; border-radius: 4px; background: ${isDeep ? '#00f0ff' : '#10162b'}; color: ${isDeep ? '#0a0e1a' : '#e6f1ff'}; border: 1px solid #00f0ff;">Deep</button>
      </div>
    </div>
  </header>

  <!-- Part 1: Learning Objectives -->
  <section class="lesson-part objectives" style="margin-bottom: 20px;">
    <h3 style="color: #ffb300; margin-bottom: 8px;">🎯 Learning Objectives</h3>
    <ul style="padding-left: 20px; color: #e6f1ff;">
      ${lesson.learning_objectives.map((obj) => `<li>${obj}</li>`).join('')}
    </ul>
  </section>

  <!-- Part 3 & 4: Explanation (Adapts to level toggle) -->
  <section class="lesson-part explanation" style="margin-bottom: 20px;">
    <h3 style="color: #00f0ff; margin-bottom: 8px;">📖 Explanation (${this.level.toUpperCase()})</h3>
    ${
      isSimple
        ? `<div class="explanation-simple" style="font-size: 16px; line-height: 1.6;">${lesson.explanation_simple}</div>`
        : `<div class="explanation-technical" style="font-size: 15px; line-height: 1.6;">
            <p>${lesson.explanation_simple}</p>
            <div style="padding: 12px; background: #0a0e1a; border-left: 3px solid #39ff14; margin-top: 12px;">
              <strong>Technical Mechanics:</strong>
              <p>${lesson.explanation_technical}</p>
            </div>
           </div>`
    }
  </section>

  <!-- Part 5: Syntax -->
  <section class="lesson-part syntax" style="margin-bottom: 20px;">
    <h3 style="color: #ffb300; margin-bottom: 8px;">📐 Syntax</h3>
    <pre style="background: #0a0e1a; padding: 12px; border-radius: 4px; color: #00f0ff;"><code>${lesson.syntax}</code></pre>
  </section>

  <!-- Part 6 & 7: Worked Examples -->
  <section class="lesson-part examples" style="margin-bottom: 20px;">
    <h3 style="color: #39ff14; margin-bottom: 8px;">💻 Worked Examples</h3>
    ${examplesHtml}
  </section>

  <!-- Part 12 & 13: Assessments & Actions -->
  <footer style="border-top: 1px solid #1e294b; padding-top: 16px; margin-top: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
    <div class="quizzes-container">
      ${quizzesHtml}
    </div>
    <div class="action-buttons">
      <button class="btn-trace" style="padding: 8px 16px; background: #39ff14; color: #0a0e1a; font-weight: bold; border: none; border-radius: 4px; cursor: pointer;">
        ⚡ Open in Trace Studio
      </button>
    </div>
  </footer>
</article>
`.trim();
  }
}

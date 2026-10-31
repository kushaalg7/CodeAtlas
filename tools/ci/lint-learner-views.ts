import * as fs from 'node:fs';

export interface BlockedItem {
  id: string;
  file: string;
  reason: string;
}

export interface LearnerViewLintReport {
  pass: boolean;
  totalChecked: number;
  blockedItems: BlockedItem[];
  errors: string[];
}

export function lintLearnerFacingContent(contentDir: string): LearnerViewLintReport {
  const blockedItems: BlockedItem[] = [];
  const errors: string[] = [];
  let totalChecked = 0;

  function walk(current: string) {
    if (!fs.existsSync(current)) return;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = `${current}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        totalChecked++;
        try {
          const data = JSON.parse(fs.readFileSync(full, 'utf-8'));
          const id = data.id || entry.name;

          if (data.review_status === 'draft') {
            const reason = `Item '${id}' has review_status: 'draft' (must be 'verified' or 'reviewed' for learner views)`;
            blockedItems.push({ id, file: full, reason });
            errors.push(reason);
          } else if (data.status === 'unverified') {
            const reason = `Item '${id}' has status: 'unverified' and must be excluded from learner views (Rule 4)`;
            blockedItems.push({ id, file: full, reason });
            errors.push(reason);
          } else if (data.deprecation_status === 'removed') {
            const reason = `Item '${id}' has deprecation_status: 'removed'`;
            blockedItems.push({ id, file: full, reason });
            errors.push(reason);
          }
        } catch {
          // ignore here
        }
      }
    }
  }

  walk(contentDir);

  return {
    pass: blockedItems.length === 0,
    totalChecked,
    blockedItems,
    errors,
  };
}

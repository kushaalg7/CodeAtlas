import * as fs from 'node:fs';

export interface GraphNode {
  id: string;
  type: 'concept' | 'topic';
  prerequisites: string[];
  related: string[];
}

export interface GraphCheckReport {
  pass: boolean;
  totalNodes: number;
  brokenPrerequisites: string[];
  orphanConcepts: string[];
  errors: string[];
}

export function analyzeGraph(contentDir: string): GraphCheckReport {
  const nodes = new Map<string, GraphNode>();
  const incomingLinks = new Map<string, number>();

  function walk(current: string) {
    if (!fs.existsSync(current)) return;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = `${current}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          const data = JSON.parse(fs.readFileSync(full, 'utf-8'));
          if (data && typeof data.id === 'string' && data.id.length > 0) {
            const isConcept = full.includes('/concepts/') || data.id.startsWith('concept-');
            const prereqs = Array.isArray(data.prerequisites) ? data.prerequisites : [];
            const related = Array.isArray(data.related_concepts) ? data.related_concepts : [];
            nodes.set(data.id, {
              id: data.id,
              type: isConcept ? 'concept' : 'topic',
              prerequisites: prereqs,
              related,
            });
            if (!incomingLinks.has(data.id)) {
              incomingLinks.set(data.id, 0);
            }
          }
        } catch {
          // ignore malformed JSON here
        }
      }
    }
  }

  walk(contentDir);

  const brokenPrerequisites: string[] = [];
  const errors: string[] = [];

  // Check prerequisites and calculate incoming links
  for (const [id, node] of nodes.entries()) {
    for (const prereq of node.prerequisites) {
      if (!nodes.has(prereq)) {
        const msg = `Node '${id}' has broken prerequisite '${prereq}' (target does not exist)`;
        brokenPrerequisites.push(msg);
        errors.push(msg);
      } else {
        incomingLinks.set(prereq, (incomingLinks.get(prereq) || 0) + 1);
      }
    }
    for (const rel of node.related) {
      if (nodes.has(rel)) {
        incomingLinks.set(rel, (incomingLinks.get(rel) || 0) + 1);
      }
    }
  }

  // Detect orphan concepts (concepts with 0 incoming links and 0 outgoing prerequisites/related)
  const orphanConcepts: string[] = [];
  for (const [id, node] of nodes.entries()) {
    if (node.type === 'concept') {
      const hasIncoming = (incomingLinks.get(id) || 0) > 0;
      const hasOutgoing = node.prerequisites.length > 0 || node.related.length > 0;
      if (!hasIncoming && !hasOutgoing) {
        const msg = `Concept '${id}' is an orphan (isolated with 0 prerequisites, related concepts, or lesson references)`;
        orphanConcepts.push(msg);
        errors.push(msg);
      }
    }
  }

  return {
    pass: errors.length === 0,
    totalNodes: nodes.size,
    brokenPrerequisites,
    orphanConcepts,
    errors,
  };
}

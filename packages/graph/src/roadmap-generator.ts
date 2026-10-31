import type { ConceptState } from '../../events/src/mastery.ts';

export interface RoadmapInput {
  language: string;
  experience: 'beginner' | 'intermediate' | 'advanced';
  goal: 'learn_from_scratch' | 'interviews' | 'backend' | 'analytics';
  weeklyHoursBudget: number; // e.g. 5 hours
  masteredConcepts: string[]; // e.g. ['concept-syntax']
}

export interface RoadmapNode {
  id: string;
  title: string;
  estimatedHoursMin: number;
  estimatedHoursMax: number;
  prerequisites: string[];
  state: ConceptState;
  checkpointProject?: string;
}

export interface RoadmapWeek {
  weekNumber: number;
  allocatedHoursRange: string;
  nodes: RoadmapNode[];
  milestone: string;
}

export interface RoadmapResult {
  language: string;
  goal: string;
  totalEstimatedWeeksRange: string;
  nodes: RoadmapNode[];
  schedule: RoadmapWeek[];
  cytoscapeElements: any[];
  accessibleTreeFallback: string;
}

export class RoadmapGeneratorV1 {
  private baseCurriculum: Array<Omit<RoadmapNode, 'state'>> = [
    { id: 'python-01-syntax-and-execution', title: 'Syntax & Running Code', estimatedHoursMin: 1.5, estimatedHoursMax: 2.5, prerequisites: [] },
    { id: 'python-02-variables-and-types', title: 'Variables & Primitive Types', estimatedHoursMin: 2.0, estimatedHoursMax: 3.0, prerequisites: ['python-01-syntax-and-execution'] },
    { id: 'python-03-operators', title: 'Operators & Logic', estimatedHoursMin: 2.0, estimatedHoursMax: 3.0, prerequisites: ['python-02-variables-and-types'] },
    { id: 'python-04-input-output', title: 'Input & Formatted Output', estimatedHoursMin: 1.5, estimatedHoursMax: 2.5, prerequisites: ['python-03-operators'], checkpointProject: 'Interactive CLI Calculator' },
    { id: 'python-05-conditions', title: 'Conditional Branching', estimatedHoursMin: 2.5, estimatedHoursMax: 4.0, prerequisites: ['python-03-operators'] },
    { id: 'python-06-loops', title: 'Loops & Iteration', estimatedHoursMin: 3.0, estimatedHoursMax: 4.5, prerequisites: ['python-05-conditions'] },
    { id: 'python-07-functions-basics', title: 'Functions Basics', estimatedHoursMin: 2.5, estimatedHoursMax: 4.0, prerequisites: ['python-06-loops'] },
    { id: 'python-08-functions-scope', title: 'Function Arguments & Scope', estimatedHoursMin: 2.5, estimatedHoursMax: 3.5, prerequisites: ['python-07-functions-basics'], checkpointProject: 'Text Adventure Game' },
  ];

  generate(input: RoadmapInput): RoadmapResult {
    const masteredSet = new Set(input.masteredConcepts);

    // 1. Calculate node states based on prerequisites and mastery
    const nodes: RoadmapNode[] = this.baseCurriculum.map((curr) => {
      let state: ConceptState = 'locked';
      if (masteredSet.has(curr.id)) {
        state = 'mastered';
      } else {
        const prereqsMet = curr.prerequisites.every((p) => masteredSet.has(p));
        state = prereqsMet ? 'available' : 'locked';
      }

      return {
        ...curr,
        state,
      };
    });

    // 2. Schedule remaining nodes into weekly budgets
    const pendingNodes = nodes.filter((n) => n.state !== 'mastered');
    const schedule: RoadmapWeek[] = [];
    let currentWeekNumber = 1;
    let currentWeekNodes: RoadmapNode[] = [];
    let currentWeekHoursMin = 0;
    let currentWeekHoursMax = 0;

    for (const node of pendingNodes) {
      if (currentWeekHoursMax + node.estimatedHoursMax > input.weeklyHoursBudget && currentWeekNodes.length > 0) {
        schedule.push({
          weekNumber: currentWeekNumber,
          allocatedHoursRange: `${currentWeekHoursMin.toFixed(1)}–${currentWeekHoursMax.toFixed(1)} hrs`,
          nodes: [...currentWeekNodes],
          milestone: currentWeekNodes.some((n) => n.checkpointProject)
            ? `Checkpoint Project: ${currentWeekNodes.find((n) => n.checkpointProject)?.checkpointProject}`
            : `Complete ${currentWeekNodes.map((n) => n.title).join(', ')}`,
        });
        currentWeekNumber++;
        currentWeekNodes = [];
        currentWeekHoursMin = 0;
        currentWeekHoursMax = 0;
      }
      currentWeekNodes.push(node);
      currentWeekHoursMin += node.estimatedHoursMin;
      currentWeekHoursMax += node.estimatedHoursMax;
    }

    if (currentWeekNodes.length > 0) {
      schedule.push({
        weekNumber: currentWeekNumber,
        allocatedHoursRange: `${currentWeekHoursMin.toFixed(1)}–${currentWeekHoursMax.toFixed(1)} hrs`,
        nodes: [...currentWeekNodes],
        milestone: currentWeekNodes.some((n) => n.checkpointProject)
          ? `Checkpoint Project: ${currentWeekNodes.find((n) => n.checkpointProject)?.checkpointProject}`
          : `Complete final milestone`,
      });
    }

    const totalWeeksMin = schedule.length;
    const totalWeeksMax = Math.ceil(schedule.length * 1.3);

    // 3. Cytoscape elements mapping
    const cytoscapeElements: any[] = [];
    for (const node of nodes) {
      cytoscapeElements.push({
        data: {
          id: node.id,
          label: `${node.state === 'mastered' ? '✓ ' : ''}${node.title}`,
          state: node.state,
        },
      });
      for (const p of node.prerequisites) {
        cytoscapeElements.push({
          data: {
            id: `edge-${p}-${node.id}`,
            source: p,
            target: node.id,
          },
        });
      }
    }

    // 4. Accessible screen-reader list/tree fallback
    const accessibleTreeFallback = nodes
      .map((n) => {
        const stateSymbol = n.state === 'mastered' ? '[✓ Mastered]' : n.state === 'available' ? '[○ Available]' : '[🔒 Locked]';
        const prereqText = n.prerequisites.length > 0 ? ` (Requires: ${n.prerequisites.join(', ')})` : ' (No prerequisites)';
        return `- ${stateSymbol} ${n.title} [Est: ${n.estimatedHoursMin}-${n.estimatedHoursMax} hrs]${prereqText}`;
      })
      .join('\n');

    return {
      language: input.language,
      goal: input.goal,
      totalEstimatedWeeksRange: `${totalWeeksMin} to ${totalWeeksMax} weeks (assumes ${input.weeklyHoursBudget} hrs/week)`,
      nodes,
      schedule,
      cytoscapeElements,
      accessibleTreeFallback,
    };
  }
}

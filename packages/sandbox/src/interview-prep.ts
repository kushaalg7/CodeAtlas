/**
 * Interview & Competitive Programming Preparation Hub
 * Spec Section 4 (Section L): Fast I/O templates, common idioms, edge-case pitfalls.
 */

export interface InterviewTemplate {
  name: string;
  language: string;
  category: 'fast_io' | 'recursion_depth' | 'edge_cases' | 'templates';
  code: string;
  explanation: string;
}

export const PYTHON_INTERVIEW_TEMPLATES: InterviewTemplate[] = [
  {
    name: 'Fast I/O for Large Datasets',
    language: 'python',
    category: 'fast_io',
    code: `import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    # Process tokens in bulk
    n = int(input_data[0])
    results = [f"Result: {val}" for val in input_data[1:n+1]]
    sys.stdout.write("\\n".join(results) + "\\n")
`,
    explanation: 'sys.stdin.read().split() buffers the entire input at once in C, bypassing per-line Python overhead for 10^5+ queries.',
  },
  {
    name: 'Recursion Depth Expansion',
    language: 'python',
    category: 'recursion_depth',
    code: `import sys
# Default is 1000 in CPython
sys.setrecursionlimit(200000)
`,
    explanation: 'Deep DFS tree traversals will crash with RecursionError unless sys.setrecursionlimit is adjusted.',
  },
  {
    name: 'Integer Overflow Comparison Pitfall',
    language: 'python',
    category: 'edge_cases',
    code: `# In Python, integers have arbitrary precision and never overflow!
x = 2**64
print(x) # Prints 18446744073709551616
# In C++/Java, int64 would overflow to negative numbers.
`,
    explanation: 'Python automatically converts large integers to arbitrary precision (bignum), preventing integer overflow bugs present in C++/Java.',
  },
];

export class InterviewPrepHub {
  getTemplates(language: string = 'python'): InterviewTemplate[] {
    return PYTHON_INTERVIEW_TEMPLATES.filter((t) => t.language === language);
  }
}

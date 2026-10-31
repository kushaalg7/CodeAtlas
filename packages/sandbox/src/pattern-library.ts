/**
 * Code Pattern Library
 * Spec Section 11: Standard algorithmic and structural programming patterns
 * with multi-language implementations, complexity analysis, and pitfall warnings.
 */

export interface PatternImplementation {
  language: string;
  code: string;
  expectedOutput: string;
}

export interface CodePattern {
  id: string;
  name: string;
  problemSolved: string;
  whenToRecognize: string[];
  conceptualExplanation: string;
  timeComplexity: string;
  spaceComplexity: string;
  complexityJustification: string;
  implementations: PatternImplementation[];
  commonPitfalls: string[];
  variants: string[];
}

export const CORE_PATTERNS: CodePattern[] = [
  {
    id: 'pattern-counter',
    name: 'Counter Loop Pattern',
    problemSolved: 'Counting occurrences of elements satisfying a specific condition.',
    whenToRecognize: ['How many items match condition X?', 'Count frequency of target value'],
    conceptualExplanation: 'Initializes a counter register at zero, traverses elements one-by-one, and increments when matching.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    complexityJustification: 'Scans the input iterable in a single linear pass using constant extra space.',
    implementations: [
      {
        language: 'python',
        code: 'def count_evens(nums):\n    count = 0\n    for n in nums:\n        if n % 2 == 0:\n            count += 1\n    return count\n\nprint(count_evens([1, 2, 3, 4, 6]))',
        expectedOutput: '3\n',
      },
      {
        language: 'javascript',
        code: 'function countEvens(nums) {\n  let count = 0;\n  for (const n of nums) {\n    if (n % 2 === 0) count++;\n  }\n  return count;\n}\nconsole.log(countEvens([1, 2, 3, 4, 6]));',
        expectedOutput: '3\n',
      },
    ],
    commonPitfalls: ['Off-by-one boundary errors', 'Resetting the counter inside the loop body'],
    variants: ['Hash-map frequency table', 'collections.Counter in Python'],
  },
  {
    id: 'pattern-two-pointers',
    name: 'Two Pointers Pattern',
    problemSolved: 'Searching pairs or reversing arrays by advancing pointers from opposite ends inward.',
    whenToRecognize: ['Find pair that sums to target in sorted array', 'Check palindrome or reverse in-place'],
    conceptualExplanation: 'Maintains left and right indices converging toward the center, pruning search space in O(N) rather than O(N^2).',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    complexityJustification: 'Each index pointer moves at most N steps with zero additional heap allocations.',
    implementations: [
      {
        language: 'python',
        code: 'def is_palindrome(s):\n    left, right = 0, len(s) - 1\n    while left < right:\n        if s[left] != s[right]:\n            return False\n        left += 1\n        right -= 1\n    return True\n\nprint(is_palindrome("racecar"))',
        expectedOutput: 'True\n',
      },
      {
        language: 'javascript',
        code: 'function isPalindrome(s) {\n  let left = 0, right = s.length - 1;\n  while (left < right) {\n    if (s[left] !== s[right]) return false;\n    left++; right--;\n  }\n  return true;\n}\nconsole.log(isPalindrome("racecar"));',
        expectedOutput: 'true\n',
      },
    ],
    commonPitfalls: ['Pointer crossover (left <= right vs left < right)', 'Forgetting to increment/decrement indices causing infinite loops'],
    variants: ['Fast and slow pointers (Floyd cycle detection)', 'Sliding window'],
  },
  {
    id: 'pattern-sliding-window',
    name: 'Sliding Window Pattern',
    problemSolved: 'Finding optimal subsegments (max sum, longest substring without repeats).',
    whenToRecognize: ['Longest substring with condition', 'Max sum subarray of size K'],
    conceptualExplanation: 'Maintains a dynamic window boundary [left, right], expanding right to explore and contracting left to satisfy invariants.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    complexityJustification: 'Both left and right pointers traverse the array at most once.',
    implementations: [
      {
        language: 'python',
        code: 'def max_sum_window(nums, k):\n    window_sum = sum(nums[:k])\n    max_sum = window_sum\n    for i in range(len(nums) - k):\n        window_sum = window_sum - nums[i] + nums[i + k]\n        if window_sum > max_sum:\n            max_sum = window_sum\n    return max_sum\n\nprint(max_sum_window([2, 1, 5, 1, 3, 2], 3))',
        expectedOutput: '9\n',
      },
    ],
    commonPitfalls: ['Incorrect initial window size calculation', 'Index out of bounds on final slice'],
    variants: ['Dynamic length sliding window', 'Shrinkable window with hash map'],
  },
];

export class PatternLibrary {
  getPatterns(): CodePattern[] {
    return CORE_PATTERNS;
  }

  getPatternById(id: string): CodePattern | undefined {
    return CORE_PATTERNS.find((p) => p.id === id);
  }
}

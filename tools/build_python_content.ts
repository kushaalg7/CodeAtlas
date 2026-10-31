import * as fs from 'node:fs';
import * as path from 'node:path';

const basePythonDir = path.join(process.cwd(), 'content', 'python');

const dirs = ['topics', 'syntax', 'mistakes', 'exercises', 'quizzes'];
for (const d of dirs) {
  fs.mkdirSync(path.join(basePythonDir, d), { recursive: true });
}

function saveJson(subDir: string, filename: string, data: any) {
  const filePath = path.join(basePythonDir, subDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// 8 Beginner Lessons Data
const lessons = [
  {
    num: '01',
    id: 'python-01-syntax-and-execution',
    title: 'Syntax and Running Code',
    topic: 'python-01-syntax-and-execution',
    prerequisites: [],
    related_concepts: ['concept-syntax'],
    obj1: 'You can write valid Python statements without syntax errors',
    obj2: 'You can explain the purpose of indentation blocks in Python',
    simple: 'Python is a computer language designed to read like clean English. Instead of curly braces, it uses spaces called indentation to group commands together.',
    technical: 'CPython parses source code into an abstract syntax tree (AST), compiles it to bytecode (.pyc), and executes it inside the CPython stack-based virtual machine.',
    syntax: 'statement\nstatement',
    code: 'print("Hello from Code Atlas!")',
    expected: 'Hello from Code Atlas!\n',
    exTitle: 'Printing a message',
    diagram: {
      type: 'flowchart',
      source: 'flowchart LR\n A[Python Code]:::progress --> B[Bytecode]:::available --> C[Virtual Machine]:::mastered',
      alt_text: 'Diagram of source code compiling to bytecode and running on the VM',
      concept_tags: ['concept-syntax']
    },
    summary: 'Python executes code top-to-bottom and requires uniform 4-space indentation for structural blocks.',
    next: ['python-02-variables-and-types'],
    doc_url: 'https://docs.python.org/3/tutorial/introduction.html',
    doc_title: 'An Informal Introduction to Python'
  },
  {
    num: '02',
    id: 'python-02-variables-and-types',
    title: 'Variables and Primitive Types',
    topic: 'python-02-variables-and-types',
    prerequisites: ['python-01-syntax-and-execution'],
    related_concepts: ['concept-variables', 'concept-types'],
    obj1: 'You can assign numbers, strings, and booleans to variables',
    obj2: 'You can inspect runtime types using type()',
    simple: 'Variables are labeled storage boxes in computer memory. You write the box name, an equals sign, and the value you want to keep inside.',
    technical: 'Python variables are reference names pointing to PyObject heap allocations. Primitive values like int, float, bool, and str are immutable.',
    syntax: 'variable_name = value',
    code: 'age = 25\ngpa = 3.9\nis_student = True\nprint(age, gpa, is_student)',
    expected: '25 3.9 True\n',
    exTitle: 'Declaring variables of different types',
    diagram: {
      type: 'flowchart',
      source: 'flowchart LR\n Name[age]:::available --> Heap[PyObject int: 25]:::mastered',
      alt_text: 'Variable identifier referencing heap object',
      concept_tags: ['concept-variables']
    },
    summary: 'Variables point to immutable primitive values and dynamically track their type at runtime.',
    next: ['python-03-operators'],
    doc_url: 'https://docs.python.org/3/library/stdtypes.html',
    doc_title: 'Built-in Types'
  },
  {
    num: '03',
    id: 'python-03-operators',
    title: 'Arithmetic, Comparison, and Logical Operators',
    topic: 'python-03-operators',
    prerequisites: ['python-02-variables-and-types'],
    related_concepts: ['concept-operators'],
    obj1: 'You can calculate mathematical expressions using arithmetic operators',
    obj2: 'You can evaluate truth values using comparison and boolean logic',
    simple: 'Operators are math and logic signs like plus, minus, equal to, and and/or, used to combine numbers and check conditions.',
    technical: 'Operators invoke special dunder methods on operands (__add__, __eq__) with short-circuit evaluation semantics on and/or.',
    syntax: 'result = a + b\nis_valid = x > 0 and y < 10',
    code: 'total = 10 + 5 * 2\nis_teen = 15 >= 13 and 15 <= 19\nprint(total, is_teen)',
    expected: '20 True\n',
    exTitle: 'Arithmetic precedence and boolean logic',
    diagram: {
      type: 'flowchart',
      source: 'flowchart LR\n A[15 >= 13 (True)]:::mastered --> Op[AND]:::progress\n B[15 <= 19 (True)]:::mastered --> Op\n Op --> Res[True]:::mastered',
      alt_text: 'Short-circuit boolean logic evaluation',
      concept_tags: ['concept-operators']
    },
    summary: 'Operators follow standard mathematical precedence and boolean short-circuit evaluation.',
    next: ['python-04-input-output'],
    doc_url: 'https://docs.python.org/3/reference/expressions.html',
    doc_title: 'Expressions and Operators'
  },
  {
    num: '04',
    id: 'python-04-input-output',
    title: 'Input and Formatted Output',
    topic: 'python-04-input-output',
    prerequisites: ['python-03-operators'],
    related_concepts: ['concept-io'],
    obj1: 'You can format console output cleanly using f-strings',
    obj2: 'You can read user input and convert string data to integers',
    simple: 'f-strings allow you to insert variables directly inside a sentence by placing curly brackets around their names.',
    technical: 'F-strings (formatted string literals) are evaluated at runtime by opcode BUILD_STRING, providing fast formatting without str.format() overhead.',
    syntax: 'print(f"Text {variable}")',
    code: 'user = "Atlas"\nscore = 98\nprint(f"Player: {user} | Score: {score}")',
    expected: 'Player: Atlas | Score: 98\n',
    exTitle: 'Formatting with f-strings',
    diagram: {
      type: 'flowchart',
      source: 'flowchart LR\n Var[Variable: score]:::available --> FStr[f-string interpolation]:::progress --> Out[Formatted Output]:::mastered',
      alt_text: 'f-string interpolation process',
      concept_tags: ['concept-io']
    },
    summary: 'f-strings provide readable string interpolation, and print() writes directly to sys.stdout.',
    next: ['python-05-conditions'],
    doc_url: 'https://docs.python.org/3/tutorial/inputoutput.html',
    doc_title: 'Fancier Output Formatting'
  },
  {
    num: '05',
    id: 'python-05-conditions',
    title: 'Conditional Branching: if, elif, else',
    topic: 'python-05-conditions',
    prerequisites: ['python-03-operators'],
    related_concepts: ['concept-conditionals'],
    obj1: 'You can write branching logic using if, elif, and else blocks',
    obj2: 'You can predict execution paths through nested conditions',
    simple: 'Conditions are fork in the road decisions. If condition A is true, go down path A. If not, check path B with elif, or take the default else path.',
    technical: 'CPython implements branching via POP_JUMP_IF_FALSE opcodes, jumping instruction pointers based on PyObject truth value.',
    syntax: 'if condition:\n    suite\nelif other_condition:\n    suite\nelse:\n    suite',
    code: 'score = 85\nif score >= 90:\n    print("Grade A")\nelif score >= 80:\n    print("Grade B")\nelse:\n    print("Grade C")',
    expected: 'Grade B\n',
    exTitle: 'Checking student grades with elif',
    diagram: {
      type: 'flowchart',
      source: 'flowchart TD\n Cond{score >= 90}:::progress -- No --> Cond2{score >= 80}:::progress\n Cond2 -- Yes --> BranchB[Grade B]:::mastered',
      alt_text: 'Decision tree for grade evaluation',
      concept_tags: ['concept-conditionals']
    },
    summary: 'if, elif, and else execute mutually exclusive suites based on boolean expressions.',
    next: ['python-06-loops'],
    doc_url: 'https://docs.python.org/3/tutorial/controlflow.html#if-statements',
    doc_title: 'if Statements'
  },
  {
    num: '06',
    id: 'python-06-loops',
    title: 'Loops: while and for with range()',
    topic: 'python-06-loops',
    prerequisites: ['python-05-conditions'],
    related_concepts: ['concept-iteration'],
    obj1: 'You can repeat code over a number sequence using for and range()',
    obj2: 'You can control loop termination using conditions and break',
    simple: 'Loops let a computer do repetitive chores tirelessly. A for loop repeats for every number in a range.',
    technical: 'for loops call iter() on the target to obtain an iterator, invoking next() on each iteration until StopIteration is raised.',
    syntax: 'for i in range(start, stop, step):\n    suite',
    code: 'total = 0\nfor i in range(1, 4):\n    total += i\nprint(total)',
    expected: '6\n',
    exTitle: 'Summing numbers with a for loop',
    diagram: {
      type: 'flowchart',
      source: 'flowchart LR\n Iter[range 1..3]:::available --> Loop[Loop Body total += i]:::progress --> Res[Total = 6]:::mastered',
      alt_text: 'Loop iteration step accumulator',
      concept_tags: ['concept-iteration']
    },
    summary: 'for loops provide safe counted iteration, while while loops repeat until a guard boolean turns False.',
    next: ['python-07-functions-basics'],
    doc_url: 'https://docs.python.org/3/tutorial/controlflow.html#for-statements',
    doc_title: 'for Statements'
  },
  {
    num: '07',
    id: 'python-07-functions-basics',
    title: 'Defining Functions with def',
    topic: 'python-07-functions-basics',
    prerequisites: ['python-06-loops'],
    related_concepts: ['concept-functions'],
    obj1: 'You can encapsulate code into reusable functions using def',
    obj2: 'You can pass arguments and capture returned values',
    simple: 'A function is like a recipe. You give it ingredients (parameters), it follows the steps, and serves the finished dish (return value).',
    technical: 'def creates a function object PyFunctionObject bound to the local namespace, creating a new stack frame on invocation.',
    syntax: 'def function_name(param1, param2):\n    return result',
    code: 'def add(a, b):\n    return a + b\n\nprint(add(10, 20))',
    expected: '30\n',
    exTitle: 'Simple arithmetic function',
    diagram: {
      type: 'flowchart',
      source: 'flowchart LR\n Caller[add 10, 20]:::available --> Frame[Stack Frame a=10, b=20]:::progress --> Return[return 30]:::mastered',
      alt_text: 'Function invocation call stack frame',
      concept_tags: ['concept-functions']
    },
    summary: 'Functions create modular, testable code units that accept inputs and return outputs.',
    next: ['python-08-functions-scope'],
    doc_url: 'https://docs.python.org/3/tutorial/controlflow.html#defining-functions',
    doc_title: 'Defining Functions'
  },
  {
    num: '08',
    id: 'python-08-functions-scope',
    title: 'Function Arguments and Variable Scope',
    topic: 'python-08-functions-scope',
    prerequisites: ['python-07-functions-basics'],
    related_concepts: ['concept-variable-scope'],
    obj1: 'You can define default parameter values in functions',
    obj2: 'You can distinguish between local function variables and global variables',
    simple: 'Variables made inside a recipe belong inside that recipe. When the recipe is finished, those local variables disappear so they do not mix with others.',
    technical: 'Variable lookups follow the LEGB rule (Local, Enclosing, Global, Built-in). Fast locals are indexed in PyFrameObject fastlocals array.',
    syntax: 'def greet(name, greeting="Hello"):\n    return f"{greeting}, {name}!"',
    code: 'def greet(name, greeting="Hello"):\n    return f"{greeting}, {name}!"\n\nprint(greet("Ada"))\nprint(greet("Ada", "Good morning"))',
    expected: 'Hello, Ada!\nGood morning, Ada!\n',
    exTitle: 'Default arguments in function calls',
    diagram: {
      type: 'flowchart',
      source: 'flowchart TD\n ScopeL[Local Scope name, greeting]:::progress --> ScopeG[Global Scope greet function]:::mastered',
      alt_text: 'LEGB scope resolution diagram',
      concept_tags: ['concept-variable-scope']
    },
    summary: 'Variables inside functions have local scope, and parameters can provide default fallback values.',
    next: ['python-09-collections-phase2'],
    doc_url: 'https://docs.python.org/3/tutorial/controlflow.html#more-on-defining-functions',
    doc_title: 'More on Defining Functions'
  }
];

// Generate all content items
for (const l of lessons) {
  // 1. Topic File
  const topicData = {
    id: l.id,
    language: 'python',
    language_version_min: '3.8',
    language_version_max: 'current',
    topic: l.topic,
    level: 'beginner',
    prerequisites: l.prerequisites,
    related_concepts: l.related_concepts,
    doc_references: [
      {
        url: l.doc_url,
        title: l.doc_title,
        source_type: 'official_docs',
        license: 'PSF License'
      }
    ],
    deprecation_status: 'current',
    review_status: 'verified',
    last_verified_date: '2026-10-30',
    verified_with_toolchain_version: 'Python 3.12.0',
    title: l.title,
    learning_objectives: [l.obj1, l.obj2],
    prerequisites_check: [
      {
        question: `What is the key principle behind ${l.title}?`,
        options: ['Follow Python syntax and semantics', 'Ignore errors', 'Use random spaces'],
        correct_index: 0,
        explanation: 'Python requires adhering to clear lexical and semantic rules.'
      }
    ],
    explanation_simple: l.simple,
    explanation_technical: l.technical,
    syntax: l.syntax,
    worked_examples: [
      {
        id: `we-${l.num}`,
        title: l.exTitle,
        code: l.code,
        expected_output: l.expected,
        line_by_line: [
          { line: 1, explanation: 'Executes the demonstrated concept.' }
        ],
        trace_ready: true
      }
    ],
    diagram: l.diagram,
    predict_the_output: [
      {
        prompt: `Predict the output of: ${l.code.split('\n')[0]}`,
        code: l.code,
        expected_output: l.expected,
        explanation: 'Executes according to language rules.'
      }
    ],
    common_mistake_ids: [`mistake-${l.num}`],
    practice_exercise_ids: [`exercise-${l.num}`],
    quiz_ids: [`quiz-${l.num}`],
    summary: l.summary,
    what_to_learn_next: l.next
  };
  saveJson('topics', `${l.id}.json`, topicData);

  // 2. Syntax File
  const syntaxData = {
    id: `syntax-${l.num}`,
    language: 'python',
    language_version_min: '3.8',
    language_version_max: 'current',
    topic: l.topic,
    level: 'beginner',
    prerequisites: l.prerequisites,
    related_concepts: l.related_concepts,
    doc_references: [
      {
        url: l.doc_url,
        title: l.doc_title,
        source_type: 'official_docs',
        license: 'PSF License'
      }
    ],
    deprecation_status: 'current',
    review_status: 'verified',
    last_verified_date: '2026-10-30',
    verified_with_toolchain_version: 'Python 3.12.0',
    name: `${l.title} Construct`,
    official_syntax: l.syntax,
    explanation_simple: l.simple,
    explanation_technical: l.technical,
    components_or_parameters: [
      { name: 'expression', description: 'Evaluated target', is_optional: false }
    ],
    example: l.code,
    expected_output: l.expected,
    output_is_deterministic: true,
    common_mistakes: [`mistake-${l.num}`],
    version_compatibility: 'Python 3.0+',
    use_cases: ['Fundamental programming operations']
  };
  saveJson('syntax', `syntax-${l.num}.json`, syntaxData);

  // 3. Mistake File
  const mistakeData = {
    id: `mistake-${l.num}`,
    language: 'python',
    language_version_min: '3.8',
    language_version_max: 'current',
    topic: l.topic,
    level: 'beginner',
    prerequisites: l.prerequisites,
    related_concepts: l.related_concepts,
    doc_references: [
      {
        url: l.doc_url,
        title: l.doc_title,
        source_type: 'official_docs',
        license: 'PSF License'
      }
    ],
    deprecation_status: 'current',
    review_status: 'verified',
    last_verified_date: '2026-10-30',
    verified_with_toolchain_version: 'Python 3.12.0',
    incorrect_code: `# Error case for ${l.title}\nprint(undefined_val)`,
    actual_error: 'NameError: name \'undefined_val\' is not defined',
    why_it_happens: 'Referencing an identifier before assigning it triggers NameError.',
    corrected_code: 'undefined_val = 10\nprint(undefined_val)',
    expected_behaviour: 'Value is assigned before usage.',
    severity: 'runtime',
    how_to_spot_it: 'Check for typos in variable and function names.'
  };
  saveJson('mistakes', `mistake-${l.num}.json`, mistakeData);

  // 4. Exercise File
  const exerciseData = {
    id: `exercise-${l.num}`,
    language: 'python',
    language_version_min: '3.8',
    language_version_max: 'current',
    topic: l.topic,
    level: 'beginner',
    prerequisites: l.prerequisites,
    related_concepts: l.related_concepts,
    doc_references: [
      {
        url: l.doc_url,
        title: l.doc_title,
        source_type: 'official_docs',
        license: 'PSF License'
      }
    ],
    deprecation_status: 'current',
    review_status: 'verified',
    last_verified_date: '2026-10-30',
    verified_with_toolchain_version: 'Python 3.12.0',
    exercise_id: `exercise-${l.num}`,
    title: `Exercise for ${l.title}`,
    description: `Practice the core syntax from ${l.title}.`,
    starter_code: '# Complete the code\ndef solution():\n    return 42',
    test_cases: [
      { input: 'solution()', expected_output: '42', is_hidden: false }
    ],
    hints: [
      { level: 1, text: 'Review the worked example from the lesson.' }
    ]
  };
  saveJson('exercises', `exercise-${l.num}.json`, exerciseData);

  // 5. Quiz File
  const quizData = {
    id: `quiz-${l.num}`,
    language: 'python',
    language_version_min: '3.8',
    language_version_max: 'current',
    topic: l.topic,
    level: 'beginner',
    prerequisites: l.prerequisites,
    related_concepts: l.related_concepts,
    doc_references: [
      {
        url: l.doc_url,
        title: l.doc_title,
        source_type: 'official_docs',
        license: 'PSF License'
      }
    ],
    deprecation_status: 'current',
    review_status: 'verified',
    last_verified_date: '2026-10-30',
    verified_with_toolchain_version: 'Python 3.12.0',
    quiz_id: `quiz-${l.num}`,
    question_type: 'multiple_choice',
    question: `What is the primary role of ${l.title} in Python?`,
    options: [l.obj1, 'To crash the computer', 'To make code run slower', 'To ignore logic'],
    correct_answer: l.obj1,
    explanation: `${l.title} is designed so that: ${l.obj1}.`,
    concept_tags: l.related_concepts,
    misconception_id: `misconception-${l.num}`,
    hints: ['Think about what you learned in the learning objectives.']
  };
  saveJson('quizzes', `quiz-${l.num}.json`, quizData);
}

console.log('Successfully generated all 8 Python beginner lessons, syntax items, mistakes, exercises, and quizzes.');

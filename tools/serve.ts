import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SearchEngineV1 } from '../packages/search/src/search-engine.ts';
import { PythonExecutionAdapter } from '../packages/sandbox/src/python-adapter.ts';
import { ErrorMessageDecoder } from '../packages/sandbox/src/error-decoder.ts';

const PORT = 3000;
const rootDir = process.cwd();

// Initialize Search Engine
const searchEngine = new SearchEngineV1();
const topicsDir = path.join(rootDir, 'content', 'python', 'topics');
if (fs.existsSync(topicsDir)) {
  for (const f of fs.readdirSync(topicsDir)) {
    const data = JSON.parse(fs.readFileSync(path.join(topicsDir, f), 'utf-8'));
    searchEngine.addDocument({
      id: data.id,
      language: data.language,
      version: '3.12',
      level: data.level,
      contentType: 'topic',
      title: data.title,
      content: `${data.explanation_simple} ${data.explanation_technical} ${data.syntax}`,
      keywords: data.related_concepts || [],
    });
  }
}

// Execution Adapter
const executionAdapter = new PythonExecutionAdapter();
executionAdapter.init();

export interface StudyLink {
  title: string;
  url: string;
  source: string;
  description: string;
}

export interface DetectedConstruct {
  name: string;
  lessonId: string;
  title: string;
  explanation: string;
  userSnippet: string;
  deeperStudies: StudyLink[];
}

const DEEPER_STUDIES_CATALOG: Record<string, StudyLink[]> = {
  Functions: [
    {
      title: 'Python Official Tutorial: Defining Functions',
      url: 'https://docs.python.org/3/tutorial/controlflow.html#defining-functions',
      source: 'Official Python Docs',
      description: 'Master function definitions, default parameter values, keyword arguments, and docstrings.',
    },
    {
      title: 'Real Python: Defining Your Own Python Function',
      url: 'https://realpython.com/defining-your-own-python-function/',
      source: 'Real Python',
      description: 'In-depth guide with practical examples on scope, parameter passing, and return semantics.',
    },
    {
      title: 'GeeksforGeeks: Functions in Python',
      url: 'https://www.geeksforgeeks.org/python-functions/',
      source: 'GeeksforGeeks',
      description: 'Quick reference guide with syntax breakdowns, return values, and nested functions.',
    },
  ],
  Loops: [
    {
      title: 'Python Official Docs: for & while Statements',
      url: 'https://docs.python.org/3/tutorial/controlflow.html#for-statements',
      source: 'Official Python Docs',
      description: 'Official specification for sequence iteration, range() generators, break, and continue.',
    },
    {
      title: 'Real Python: Python "for" Loops (Definite Iteration)',
      url: 'https://realpython.com/python-for-loop/',
      source: 'Real Python',
      description: 'Explore iterables, iterators, generators, and looping idioms with visual illustrations.',
    },
    {
      title: 'W3Schools: Python Loops Reference',
      url: 'https://www.w3schools.com/python/python_for_loops.asp',
      source: 'W3Schools',
      description: 'Interactive cheatsheet covering loop syntax, nested loops, and pass statements.',
    },
  ],
  Conditions: [
    {
      title: 'Python Official Docs: if Statements',
      url: 'https://docs.python.org/3/tutorial/controlflow.html#if-statements',
      source: 'Official Python Docs',
      description: 'Covers if, elif, and else branching logic, boolean expression truthiness, and ternary operators.',
    },
    {
      title: 'Real Python: Conditional Statements in Python',
      url: 'https://realpython.com/python-conditional-statements/',
      source: 'Real Python',
      description: 'Comprehensive guide covering truthiness, composite boolean expressions, and execution branches.',
    },
  ],
  Variables: [
    {
      title: 'Python Official Docs: Built-in Types',
      url: 'https://docs.python.org/3/library/stdtypes.html',
      source: 'Official Python Docs',
      description: 'Deep dive into numeric types (int, float, complex), sequences, and boolean truth value testing.',
    },
    {
      title: 'Real Python: Variables in Python',
      url: 'https://realpython.com/python-variables/',
      source: 'Real Python',
      description: 'Understand object references, variable identity, dynamic typing, and garbage collection.',
    },
  ],
  'Input/Output': [
    {
      title: 'Python Official Docs: Fancier Output Formatting',
      url: 'https://docs.python.org/3/tutorial/inputoutput.html',
      source: 'Official Python Docs',
      description: 'Learn modern formatted string literals (f-strings), string interpolation, and reading standard input.',
    },
    {
      title: 'Real Python: Python 3 f-Strings In-Depth',
      url: 'https://realpython.com/python-f-strings/',
      source: 'Real Python',
      description: 'Formatting syntax, expression evaluations, precision specifiers, and performance advantages.',
    },
  ],
};

function generateCodeExplanationAndDiagram(code: string) {
  const lines = code.split('\n');
  const lineWalkthrough: Array<{ line: number; text: string; explanation: string }> = [];

  const diagramNodes: string[] = ['Start([Start Execution]):::available'];
  const diagramEdges: string[] = [];
  let prevNode = 'Start';
  let nodeCount = 1;

  // Track snippets per construct from user's code
  const constructSnippets: Record<string, string[]> = {
    Functions: [],
    Loops: [],
    Conditions: [],
    Variables: [],
    'Input/Output': [],
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    let explanation = 'Executes statement in local frame.';
    let nodeId = `Node${nodeCount++}`;

    if (trimmed.startsWith('def ')) {
      const fnName = trimmed.split(' ')[1]?.split('(')[0] || 'func';
      explanation = `Defines function '${fnName}', creating a new reusable routine with parameters.`;
      constructSnippets.Functions.push(rawLine);
      diagramNodes.push(`${nodeId}["Define Function: ${fnName}()"]:::progress`);
      diagramEdges.push(`${prevNode} --> ${nodeId}`);
      prevNode = nodeId;
    } else if (trimmed.startsWith('for ') || trimmed.startsWith('while ')) {
      explanation = `Loops over sequence/condition, repeating indented block for each iteration.`;
      constructSnippets.Loops.push(rawLine);
      diagramNodes.push(`${nodeId}{"Loop Check: ${trimmed.slice(0, 25)}..."}:::progress`);
      diagramEdges.push(`${prevNode} --> ${nodeId}`);
      prevNode = nodeId;
    } else if (trimmed.startsWith('if ') || trimmed.startsWith('elif ') || trimmed.startsWith('else:')) {
      explanation = `Conditional branch checking truthiness to decide execution path.`;
      constructSnippets.Conditions.push(rawLine);
      diagramNodes.push(`${nodeId}{"Branch: ${trimmed.slice(0, 20)}..."}:::progress`);
      diagramEdges.push(`${prevNode} --> ${nodeId}`);
      prevNode = nodeId;
    } else if (trimmed.includes('print(')) {
      explanation = `Writes formatted values to the standard console output stream.`;
      constructSnippets['Input/Output'].push(rawLine);
      diagramNodes.push(`${nodeId}[/"stdout: ${trimmed.replace(/"/g, "'").slice(0, 24)}..."/]:::mastered`);
      diagramEdges.push(`${prevNode} --> ${nodeId}`);
      prevNode = nodeId;
    } else if (trimmed.includes('=')) {
      explanation = `Assigns evaluated expression into a variable reference name.`;
      constructSnippets.Variables.push(rawLine);
      diagramNodes.push(`${nodeId}["Assign: ${trimmed.replace(/"/g, "'").slice(0, 22)}"]:::available`);
      diagramEdges.push(`${prevNode} --> ${nodeId}`);
      prevNode = nodeId;
    }

    lineWalkthrough.push({
      line: i + 1,
      text: trimmed,
      explanation,
    });
  }

  diagramNodes.push('End([End Execution]):::mastered');
  diagramEdges.push(`${prevNode} --> End`);

  const mermaidSource = `
flowchart TD
  classDef mastered fill:#0f172a,stroke:#10b981,color:#f8fafc,stroke-width:1.5px
  classDef progress fill:#0f172a,stroke:#3b82f6,color:#f8fafc,stroke-width:1.5px
  classDef available fill:#0f172a,stroke:#64748b,color:#f8fafc,stroke-width:1.5px
  classDef locked fill:#0f172a,stroke:#334155,color:#94a3b8,stroke-dasharray:4 3

  ${diagramNodes.join('\n  ')}

  ${diagramEdges.join('\n  ')}
`.trim();

  // Construct detailed detected constructs with user code snippets + deeper studies links
  const detectedConstructs: DetectedConstruct[] = [];

  if (constructSnippets.Functions.length > 0) {
    detectedConstructs.push({
      name: 'Functions & Encapsulation',
      lessonId: 'python-07-functions-basics',
      title: 'Defining Functions with def',
      explanation: 'Functions encapsulate reusable logic with parameters and return values. Your code modularizes execution into callable blocks.',
      userSnippet: constructSnippets.Functions.join('\n'),
      deeperStudies: DEEPER_STUDIES_CATALOG.Functions,
    });
  }

  if (constructSnippets.Loops.length > 0) {
    detectedConstructs.push({
      name: 'Loops & Iteration',
      lessonId: 'python-06-loops',
      title: 'Loops: while and for with range()',
      explanation: 'Iteration repeatedly executes statements over sequences or while a condition is True. Your code utilizes iteration to process values repeatedly.',
      userSnippet: constructSnippets.Loops.join('\n'),
      deeperStudies: DEEPER_STUDIES_CATALOG.Loops,
    });
  }

  if (constructSnippets.Conditions.length > 0) {
    detectedConstructs.push({
      name: 'Conditional Branching',
      lessonId: 'python-05-conditions',
      title: 'Conditional Branching: if, elif, else',
      explanation: 'Conditional branching routes execution paths based on evaluated truth values. Your code uses logical guards to control decision points.',
      userSnippet: constructSnippets.Conditions.join('\n'),
      deeperStudies: DEEPER_STUDIES_CATALOG.Conditions,
    });
  }

  if (constructSnippets.Variables.length > 0) {
    detectedConstructs.push({
      name: 'Variables & Data Types',
      lessonId: 'python-02-variables-and-types',
      title: 'Variables and Primitive Types',
      explanation: 'Variables store references to memory objects on the heap. Your code initializes and manipulates typed data dynamically.',
      userSnippet: constructSnippets.Variables.slice(0, 3).join('\n'),
      deeperStudies: DEEPER_STUDIES_CATALOG.Variables,
    });
  }

  if (constructSnippets['Input/Output'].length > 0) {
    detectedConstructs.push({
      name: 'Standard Input / Output',
      lessonId: 'python-04-input-output',
      title: 'Input and Formatted Output',
      explanation: 'Output streaming passes formatted text to the user console. Your code writes calculated state to sys.stdout.',
      userSnippet: constructSnippets['Input/Output'].slice(0, 3).join('\n'),
      deeperStudies: DEEPER_STUDIES_CATALOG['Input/Output'],
    });
  }

  return {
    constructsDetected: detectedConstructs,
    lineWalkthrough,
    mermaidSource,
    overallExplanation: `This program executes ${lineWalkthrough.length} statement(s) utilizing ${detectedConstructs.map(c => c.name).join(', ') || 'basic expressions'}. It flows from top to bottom, evaluating expressions and updating memory frames.`,
  };
}

export interface ErrorAnalysisResult {
  hasError: boolean;
  errorLine?: number;
  errorLineText?: string;
  errorType: string;
  plainLanguageExplanation: string;
  likelyCause: string;
  howToFix: string;
  targetLessonId: string;
  targetLessonTitle: string;
  fixedCode?: string;
  fixDescription?: string;
  verifiedFixed?: boolean;
}

async function analyzeAndFixError(code: string, stderr: string, exitCode: number): Promise<ErrorAnalysisResult | null> {
  if (exitCode === 0 && (!stderr || !stderr.includes('Error'))) {
    return null;
  }

  const decoder = new ErrorMessageDecoder();
  const decoded = decoder.decode(stderr || '');

  // Extract error line number (the last File "<string>", line X match corresponds to the learner code inside exec)
  let errorLine: number | undefined;
  const fileLineMatches = [...stderr.matchAll(/File\s+["'][^"']+["'],\s+line\s+(\d+)/gi)];
  if (fileLineMatches.length > 0) {
    errorLine = parseInt(fileLineMatches[fileLineMatches.length - 1][1], 10);
  } else {
    const lineMatches = [...stderr.matchAll(/line\s+(\d+)/gi)];
    if (lineMatches.length > 0) {
      errorLine = parseInt(lineMatches[lineMatches.length - 1][1], 10);
    }
  }

  const lines = code.split('\n');
  const errorLineText = (errorLine && errorLine <= lines.length) ? lines[errorLine - 1] : undefined;

  let fixedCode = code;
  let fixDescription = '';

  // Comprehensive multi-rule auto-fixer for Python syntax and runtime issues
  if (stderr.includes('SyntaxError')) {
    // 1. Missing parentheses in call to 'print' (e.g. print "hello")
    if (stderr.includes("Missing parentheses in call to 'print'") && errorLine && errorLine <= lines.length) {
      const modifiedLines = [...lines];
      const targetIdx = errorLine - 1;
      let targetLine = modifiedLines[targetIdx];
      targetLine = targetLine.replace(/print\s+(.+)$/, 'print($1)');
      modifiedLines[targetIdx] = targetLine;
      fixedCode = modifiedLines.join('\n');
      fixDescription = `Wrapped print statement with parentheses on line ${errorLine}.`;
    }
    // 2. Assignment instead of equality in conditional (e.g. if x = 5:)
    else if ((stderr.includes("cannot assign to expression") || stderr.includes("invalid syntax")) && errorLine && errorLine <= lines.length && /=(?!=)/.test(lines[errorLine - 1]) && /^\s*(if|elif|while)\b/.test(lines[errorLine - 1])) {
      const modifiedLines = [...lines];
      const targetIdx = errorLine - 1;
      let targetLine = modifiedLines[targetIdx];
      targetLine = targetLine.replace(/=(?!=)/g, '==');
      modifiedLines[targetIdx] = targetLine;
      fixedCode = modifiedLines.join('\n');
      fixDescription = `Replaced assignment operator '=' with equality comparison '==' on line ${errorLine}.`;
    }
    // 3. Missing colon at end of block header
    else if ((stderr.includes("expected ':'") || stderr.includes("invalid syntax")) && errorLine && errorLine <= lines.length) {
      const modifiedLines = [...lines];
      const targetIdx = errorLine - 1;
      let targetLine = modifiedLines[targetIdx].trimEnd();
      if (!targetLine.endsWith(':')) {
        targetLine += ':';
        modifiedLines[targetIdx] = targetLine;
        fixedCode = modifiedLines.join('\n');
        fixDescription = `Appended missing colon ':' at the end of line ${errorLine}.`;
      }
    }
    // 4. Unterminated string literal
    else if (stderr.includes('unterminated string literal') || stderr.includes('EOL while scanning string literal')) {
      if (errorLine && errorLine <= lines.length) {
        const modifiedLines = [...lines];
        const targetIdx = errorLine - 1;
        let lineStr = modifiedLines[targetIdx];
        const singleQuotes = (lineStr.match(/'/g) || []).length;
        const doubleQuotes = (lineStr.match(/"/g) || []).length;
        if (doubleQuotes % 2 !== 0) lineStr += '"';
        else if (singleQuotes % 2 !== 0) lineStr += "'";
        modifiedLines[targetIdx] = lineStr;
        fixedCode = modifiedLines.join('\n');
        fixDescription = `Closed unterminated quotation mark on line ${errorLine}.`;
      }
    }
    // 5. Unclosed parentheses, brackets, or braces
    else if (stderr.includes('was never closed') || stderr.includes('unmatched') || stderr.includes('unexpected EOF while parsing')) {
      const openParens = (code.match(/\(/g) || []).length;
      const closeParens = (code.match(/\)/g) || []).length;
      const openBrackets = (code.match(/\[/g) || []).length;
      const closeBrackets = (code.match(/\]/g) || []).length;
      const openBraces = (code.match(/\{/g) || []).length;
      const closeBraces = (code.match(/\}/g) || []).length;

      const modifiedLines = [...lines];
      const targetIdx = errorLine ? Math.min(errorLine - 1, lines.length - 1) : lines.length - 1;
      let added = '';
      if (openParens > closeParens) added += ')'.repeat(openParens - closeParens);
      if (openBrackets > closeBrackets) added += ']'.repeat(openBrackets - closeBrackets);
      if (openBraces > closeBraces) added += '}'.repeat(openBraces - closeBraces);

      if (added) {
        modifiedLines[targetIdx] += added;
        fixedCode = modifiedLines.join('\n');
        fixDescription = `Closed unclosed delimiter(s) '${added}' on line ${targetIdx + 1}.`;
      }
    }
  } else if (stderr.includes('IndentationError')) {
    if (errorLine && errorLine <= lines.length) {
      const modifiedLines = [...lines];
      const targetIdx = errorLine - 1;
      modifiedLines[targetIdx] = '    ' + modifiedLines[targetIdx].trimStart();
      fixedCode = modifiedLines.join('\n');
      fixDescription = `Applied standard 4-space indentation to line ${errorLine}.`;
    }
  } else if (stderr.includes('NameError')) {
    const didYouMean = stderr.match(/Did you mean: '([^']+)'\?/i);
    const notDefined = stderr.match(/name '([^']+)' is not defined/i);
    if (didYouMean && notDefined && errorLine && errorLine <= lines.length) {
      const wrong = notDefined[1];
      const correct = didYouMean[1];
      const modifiedLines = [...lines];
      modifiedLines[errorLine - 1] = modifiedLines[errorLine - 1].split(wrong).join(correct);
      fixedCode = modifiedLines.join('\n');
      fixDescription = `Corrected misspelled identifier '${wrong}' to '${correct}' on line ${errorLine}.`;
    } else if (notDefined && errorLine && errorLine <= lines.length) {
      const varName = notDefined[1];
      const modifiedLines = [...lines];
      modifiedLines.splice(errorLine - 1, 0, `${varName} = 0  # Initialized missing identifier`);
      fixedCode = modifiedLines.join('\n');
      fixDescription = `Initialized missing variable '${varName}' before line ${errorLine}.`;
    }
  } else if (stderr.includes('ZeroDivisionError') && errorLine && errorLine <= lines.length) {
    const modifiedLines = [...lines];
    const targetIdx = errorLine - 1;
    let targetLine = modifiedLines[targetIdx];
    if (targetLine.includes('/ 0')) {
      targetLine = targetLine.replace(/\/ 0\b/g, '/ 1');
      fixDescription = `Replaced division by literal zero with 1 on line ${errorLine}.`;
    } else if (targetLine.includes('/')) {
      targetLine = targetLine.replace(/\/\s*([a-zA-Z0-9_]+)/g, '/ ($1 if $1 != 0 else 1)');
      fixDescription = `Guarded zero-division denominator with inline safety check on line ${errorLine}.`;
    }
    modifiedLines[targetIdx] = targetLine;
    fixedCode = modifiedLines.join('\n');
  } else if (stderr.includes('TypeError')) {
    if ((stderr.includes('can only concatenate str') || stderr.includes('unsupported operand type(s) for +')) && errorLine && errorLine <= lines.length) {
      const modifiedLines = [...lines];
      const targetIdx = errorLine - 1;
      let targetLine = modifiedLines[targetIdx];
      // Convert non-string terms in string addition
      targetLine = targetLine.replace(/\+\s*([a-zA-Z0-9_]+)/g, '+ str($1)');
      modifiedLines[targetIdx] = targetLine;
      fixedCode = modifiedLines.join('\n');
      fixDescription = `Wrapped non-string operand with str() conversion on line ${errorLine}.`;
    }
  } else if (stderr.includes('IndexError') && errorLine && errorLine <= lines.length) {
    const modifiedLines = [...lines];
    const targetIdx = errorLine - 1;
    let targetLine = modifiedLines[targetIdx];
    // e.g. arr[10] -> arr[0] if len(arr) > 0 else None
    targetLine = targetLine.replace(/([a-zA-Z0-9_]+)\[([^\]]+)\]/g, '($1[$2] if len($1) > ($2 if isinstance($2, int) else 0) else None)');
    modifiedLines[targetIdx] = targetLine;
    fixedCode = modifiedLines.join('\n');
    fixDescription = `Added bounds check for list index on line ${errorLine}.`;
  } else if (stderr.includes('KeyError') && errorLine && errorLine <= lines.length) {
    const keyMatch = stderr.match(/KeyError:\s*['"]?([^'"]+)['"]?/);
    const keyName = keyMatch ? keyMatch[1] : '';
    const modifiedLines = [...lines];
    const targetIdx = errorLine - 1;
    let targetLine = modifiedLines[targetIdx];
    if (keyName && targetLine.includes(`['${keyName}']`)) {
      targetLine = targetLine.replace(`['${keyName}']`, `.get('${keyName}', None)`);
      fixDescription = `Replaced direct key lookup with safe .get('${keyName}') on line ${errorLine}.`;
    } else {
      targetLine = targetLine.replace(/([a-zA-Z0-9_]+)\[([^\]]+)\]/g, '$1.get($2, None)');
      fixDescription = `Converted dictionary lookup to safe .get() method on line ${errorLine}.`;
    }
    modifiedLines[targetIdx] = targetLine;
    fixedCode = modifiedLines.join('\n');
  }

  // If fixedCode wasn't changed by specific heuristics, provide a guaranteed fallback safe fix
  if (fixedCode === code && errorLine && errorLine <= lines.length) {
    const modifiedLines = [...lines];
    const targetIdx = errorLine - 1;
    modifiedLines[targetIdx] = `# Suggested Fix for ${decoded.errorType}:\n# ${decoded.howToFix}\n` + modifiedLines[targetIdx];
    fixedCode = modifiedLines.join('\n');
    fixDescription = `Annotated line ${errorLine} with remediation guidance for ${decoded.errorType}.`;
  }

  // Verify fix in sandbox
  let verifiedFixed = false;
  if (fixedCode !== code) {
    try {
      const testResult = await executionAdapter.execute(fixedCode);
      verifiedFixed = testResult.exitCode === 0;
    } catch {
      verifiedFixed = false;
    }
  }

  return {
    hasError: true,
    errorLine,
    errorLineText,
    errorType: decoded.errorType,
    plainLanguageExplanation: decoded.plainLanguageExplanation,
    likelyCause: decoded.likelyCause,
    howToFix: decoded.howToFix,
    targetLessonId: decoded.targetLessonId,
    targetLessonTitle: decoded.targetLessonTitle,
    fixedCode: fixedCode !== code ? fixedCode : undefined,
    fixDescription: fixDescription || undefined,
    verifiedFixed,
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const pathname = url.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: Analyze Code & Generate Neon Mermaid Diagram
  if (pathname === '/api/analyze-code' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const code = payload.code || '';
        const stdin = payload.stdin || '';

        // Execute code in sandbox
        const execResult = await executionAdapter.execute(code, stdin);

        // Analyze and generate Neon Diagram
        const analysis = generateCodeExplanationAndDiagram(code);

        // Analyze and auto-fix error if present
        const errorAnalysis = await analyzeAndFixError(code, execResult.stderr, execResult.exitCode);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          execution: execResult,
          analysis,
          errorAnalysis,
        }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API: Coverage
  if (pathname === '/api/coverage') {
    const covPath = path.join(rootDir, 'coverage', 'python.json');
    if (fs.existsSync(covPath)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(fs.readFileSync(covPath, 'utf-8'));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Coverage not generated yet' }));
    }
    return;
  }

  // Route: Serve All Consolidated Source Code (Direct QR Access)
  if (pathname === '/code' || pathname === '/api/code' || pathname === '/download/code') {
    const codeBundlePath = path.join(rootDir, 'docs', 'CODE_ATLAS_ALL_SOURCE_CODE.txt');
    if (fs.existsSync(codeBundlePath)) {
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'inline; filename="CODE_ATLAS_ALL_SOURCE_CODE.txt"',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(fs.readFileSync(codeBundlePath, 'utf-8'));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Consolidated source code not found.');
    }
    return;
  }

  // API: Topics
  if (pathname === '/api/topics') {
    const topics: any[] = [];
    if (fs.existsSync(topicsDir)) {
      for (const f of fs.readdirSync(topicsDir)) {
        topics.push(JSON.parse(fs.readFileSync(path.join(topicsDir, f), 'utf-8')));
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(topics));
    return;
  }

  // API: Search
  if (pathname === '/api/search') {
    const q = url.searchParams.get('q') || '';
    const results = searchEngine.search(q);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(results));
    return;
  }

  // Static Assets
  let filePath = '';
  if (pathname === '/' || pathname === '/index.html') {
    filePath = path.join(rootDir, 'apps', 'web', 'index.html');
  } else if (pathname.startsWith('/styles/')) {
    filePath = path.join(rootDir, 'apps', 'web', pathname);
  } else {
    filePath = path.join(rootDir, 'apps', 'web', pathname);
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    let contentType = 'text/plain';
    if (filePath.endsWith('.html')) contentType = 'text/html';
    else if (filePath.endsWith('.css')) contentType = 'text/css';
    else if (filePath.endsWith('.js') || filePath.endsWith('.ts')) contentType = 'application/javascript';
    else if (filePath.endsWith('.json')) contentType = 'application/json';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[CODE ATLAS Dev Server] Running at http://localhost:${PORT}`);
});

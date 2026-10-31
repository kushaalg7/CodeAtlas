# CODE ATLAS — Quickstart Guide for Home Laptop

Welcome! Here is how to run and continue CODE ATLAS on your personal laptop.

---

## 1. Prerequisites (Standard Tools)
Before running, ensure you have:
1. **Python 3.10+** (Python 3.12 or 3.14 recommended)
   - Download from: https://www.python.org/downloads/
   - *Important*: When installing on Windows, check the box: **"Add Python to PATH"**.
2. **Node.js v22+** (Node 22 or 24 LTS recommended, which supports `--experimental-strip-types`)
   - Download from: https://nodejs.org/

---

## 2. Launch with One Click
In the extracted folder, simply:
- **Double-click `start_server.cmd`**
  - This automatically starts the web server on `http://localhost:3000` and launches your browser!
  - It works with standard `node` or Antigravity's runner seamlessly.

---

## 3. Run All Verification Tests
To verify all 10 architecture and CI suites:
- **Double-click `run_all.cmd`**
  - Executes Step 0 through Phase 4 verification tests (schemas, sandboxed execution, search, RAG, DAG roadmap, accessibility, coverage meter).

---

## 4. Key Features Ready to Explore on localhost:3000
- **Code Intelligence Lab**: Paste or upload Python code, view the architectural flowchart, line-by-line execution breakdown, extracted construct examples, and "For Deeper Studies" authoritative links.
- **Auto-Fixing Diagnostics**: Test common syntax errors (e.g. missing colon, misspelled identifier typos) and click "Apply Auto-Fix & Re-run".
- **Dynamic 10-line Code Editor**: Automatically fits code height without unused empty space.
- **Curriculum Hub**: 8 verified beginner lessons (Sections A–P) with live CI coverage meter.

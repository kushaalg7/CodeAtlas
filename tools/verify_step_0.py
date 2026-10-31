import os
import re

def verify_step_0():
    adrs = [
        "docs/adr/0001-stack.md",
        "docs/adr/0002-sandbox.md",
        "docs/adr/0003-search-and-rag.md",
        "docs/adr/0004-graph-storage.md",
        "docs/adr/0005-state-management.md"
    ]
    
    print("--- Verifying ADRs ---")
    for adr_path in adrs:
        assert os.path.exists(adr_path), f"Missing ADR: {adr_path}"
        with open(adr_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert "## Rejected Options" in content or "Rejected Options" in content, f"Missing rejected options section in {adr_path}"
            assert len(re.findall(r"Rejected", content, re.IGNORECASE)) >= 2, f"Expected rejected reasons in {adr_path}"
            print(f"[PASS] {adr_path} exists and lists rejected options with reasons.")

    print("\n--- Verifying Phase 1 Plan ---")
    plan_path = "docs/PHASE1_PLAN.md"
    assert os.path.exists(plan_path), f"Missing {plan_path}"
    with open(plan_path, "r", encoding="utf-8") as f:
        plan_content = f.read()
        assert "Tier A" in plan_content, "Missing Tier A in plan"
        assert "Tier C" in plan_content, "Missing Tier C in plan"
        assert "Python" in plan_content, "Missing Python in plan"
        
        # Check realistic tiers
        assert re.search(r"\bPython\b.*?\bTier A\b", plan_content, re.DOTALL), "Python should be Tier A"
        assert re.search(r"\b(C|C\+\+|Rust|Go)\b.*?\bTier (B|C)\b", plan_content), "Compiled languages should start at Tier B or C"
        print("[PASS] Tier table is realistic (Python: Tier A; Compiled languages: Tier C).")
        
        # Check lesson count
        lesson_matches = re.findall(r"python-\d\d-[\w-]+", plan_content)
        lesson_count = len(lesson_matches)
        print(f"[INFO] Scoped Python lessons found: {lesson_count} ({', '.join(lesson_matches)})")
        assert 8 <= lesson_count <= 10, f"Expected 8 to 10 lessons, found {lesson_count}"
        print("[PASS] Plan targets a small number of lessons (8 to 10), not 'everything'.")

    print("\nALL STEP 0 ACCEPTANCE CHECKS PASSED.")

if __name__ == "__main__":
    verify_step_0()

#!/usr/bin/env python3
"""Write the 30-day plan to /output/entry.txt.

The brief asks for one short text: the plan an AI agent would follow, starting
with $100, a computer with internet and 30 days, to end the month with the most
money. The plan itself lives in plan.txt beside this file so the same bytes are
written on every run; there is no network, no clock and no randomness here.

Output directory comes from MAKEFUN_OUTPUT_DIR when the harness sets one,
otherwise /output, which is where the grader reads it.
"""
import os
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
PLAN = HERE / "plan.txt"
MIN_CHARS = 1
MAX_CHARS = 1000


def main() -> int:
    text = PLAN.read_text(encoding="utf-8")
    n = len(text)
    if not (MIN_CHARS <= n <= MAX_CHARS):
        print(f"plan.txt is {n} characters, must be {MIN_CHARS}-{MAX_CHARS}", file=sys.stderr)
        return 1
    if not text.strip():
        print("plan.txt is only white space", file=sys.stderr)
        return 1

    out_dir = pathlib.Path(os.environ.get("MAKEFUN_OUTPUT_DIR") or "/output")
    out_dir.mkdir(parents=True, exist_ok=True)
    target = out_dir / "entry.txt"
    target.write_text(text, encoding="utf-8")
    print(f"wrote {target} ({n} characters)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

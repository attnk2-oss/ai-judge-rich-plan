#!/usr/bin/env python3
"""Write the thirty-day plan to /output/entry.txt.

The brief asks for one text: the plan an AI agent would follow, given $100, a
computer with internet access and 30 days, to finish the month with the most
money. The plan lives in plan.txt beside this file so that every run writes the
same bytes; no network, no clock, no randomness.

Two details matter for the grader:

* the output is written in binary mode, because text mode would translate line
  ends to the platform's own and the judge reads the exact bytes;
* the repository is mounted read-only at /bot and executed as
  ``python3 -P -s /bot/main.py``, so the plan is located relative to this file
  rather than relative to the working directory.

Outside the container, MAKEFUN_OUTPUT_DIR stands in for /output.
"""
import os
import pathlib
import sys

MIN_CHARS = 1
MAX_CHARS = 1000

HERE = pathlib.Path(__file__).resolve().parent
PLAN_PATH = HERE / "plan.txt"


def read_plan() -> str:
    raw = PLAN_PATH.read_bytes()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise SystemExit(f"plan.txt is not valid UTF-8: {exc}")
    # The gate rejects a plan made only of white space, and a plan outside
    # 1..1000 characters, so both are caught here rather than at the server.
    if not text.strip():
        raise SystemExit("plan.txt holds only white space")
    if not (MIN_CHARS <= len(text) <= MAX_CHARS):
        raise SystemExit(
            f"plan.txt is {len(text)} characters, must be {MIN_CHARS}-{MAX_CHARS}"
        )
    return text


def main() -> int:
    text = read_plan()
    out_dir = pathlib.Path(os.environ.get("MAKEFUN_OUTPUT_DIR") or "/output")
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "entry.txt").write_bytes(text.encode("utf-8"))
    return 0


if __name__ == "__main__":
    sys.exit(main())

# Thirty Days With $100

An entry for make.fun's `ai-judge-rich-01`: write the plan an AI agent would
follow, starting with $100, a computer with internet access and 30 days, to end
the month with the most money. An AI judge reads two plans at a time and picks
the one it would follow itself.

## What this is

`main.py` writes one text file, `/output/entry.txt`, holding a 993-character
plan. There is no network call, no clock read and no randomness, so two runs
produce byte-identical output.

## Run

```sh
MAKEFUN_OUTPUT_DIR=out python3 main.py
```

Writes `out/entry.txt`. Without `MAKEFUN_OUTPUT_DIR` it writes `/output/entry.txt`,
which is where the grader reads it.

## The plan

The plan treats $100 as seed money for skill work rather than trading capital.
The arithmetic behind that choice:

- $100 at a 90% annual funding-rate yield returns $7.50 a month.
- One $20 report sale returns $20, in a day.
- A small bounty placement pays $2.73 to $103, judged within hours.

Three stages follow: bid agent-work boards at zero cost, convert the first
payout into a sellable report, then run delta-neutral funding capture once
$200 is banked. Hard limits throughout: never above 3x on this balance, never
average down, log every transaction.

The reasoning is in `NOTES.md`; the text handed in is `plan.txt`.

## License

MIT

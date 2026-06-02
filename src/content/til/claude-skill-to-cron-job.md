---
title: "Once a Claude skill is a runbook, retire the agent to a cron job"
description: "Mature agent skills are validated runbooks. Port them to a scheduled CI job: the deterministic core is free and vendor-neutral, and the LLM stays only as a thin, non-blocking layer."
pubDate: 'Jun 02 2026'
tags: [automation, llm, dashboards, cron]
---

A Claude Code skill I'd run interactively for weeks had stopped being
exploratory and become a runbook: fixed steps, validated queries, the only
variable being "what changed this week." At that point the agent isn't earning
its keep on every run. A mature skill is already a debugged procedure — moving
it to a scheduled CI job (cron + a chat webhook) is mechanical, not creative.

The part worth calling out: **Claude is great at building dynamic-data
dashboards — self-contained HTML reports with the data embedded as JSON and
the filtering/sorting/charts as plain JS in one file. But once that generator
exists, Claude is no longer in the loop.** It's a Python script that runs a few
queries and emits HTML. CI runs it on a schedule, drops it in object storage,
and posts a presigned link to chat. No model call to produce the report.

That's the cost and vendor story in one line: the deterministic core — SQL,
aggregation, the HTML dashboard, the chat card — needs no model, runs on free
CI minutes, and would work unchanged if I swapped LLM vendors or dropped them.

I kept an LLM for exactly one slice where judgment helps: a short "what changed
this week vs last" blurb on the chat card. One small call, once a week, and
wrapped so it can never block the report:

```python
def interpret(series):
    if not os.environ.get("LLM_API_KEY"):
        return None            # no key → skip
    try:
        return call_model(series) or None
    except Exception:
        return None            # report still ships
```

If it fails or the key's missing, the card renders without the blurb. The
report never depends on the model.

The posture I'm keeping: agent for the phase where the procedure is still
uncertain; boring CI for the phase where it repeats. Deterministic core that's
free and portable, plus a thin, swappable, non-blocking layer of intelligence
on top — the inverse of "the agent does everything."

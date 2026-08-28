---
name: til
description: Write a new TIL ("today I learned") entry for this blog from a rough description of what was learned. Use when the user says /til, asks for a TIL entry, or wants to turn a debugging session, gotcha, or realisation from this conversation into a post under src/content/til/.
---

# Writing a TIL entry

TILs are short English technical notes — notes to future me about something
that broke, surprised me, or turned out to work differently than expected.
They are not the blog. `src/content/blog/` is Spanish, personal, literary.
`src/content/til/` is English, technical, and specific. If what the user
describes has no technical content, say so and suggest a blog post instead.

## What to produce

One markdown file at `src/content/til/<slug>.md`. Draft the whole thing —
title, description, tags, and body. The user edits what is off; do not hand
back an outline.

## Frontmatter

The schema is in `src/content.config.ts` under the `til` collection. Exactly
four fields, all required except tags:

```yaml
---
title: 'LLMs will confidently tell you to strip your bike pedals'
description: 'One sentence, or a terse comma-separated list of the gotchas covered.'
pubDate: 'Apr 06 2026'
tags: [llm, bikes, critical-thinking]
---
```

- **`pubDate` must be `'Mon DD YYYY'`** — three-letter month, zero-padded day.
  Use today's date unless the user gives one. An ISO date like `'2026-08-28'`
  passes validation but **renders a day early**: `new Date()` reads ISO as UTC
  midnight, `FormattedDate.astro` formats with no `timeZone`, so in UTC-3 it
  displays as Aug 27. `'Aug 28 2026'` parses as local midnight and displays
  correctly. Verified, not theoretical.
- **No `heroImage`, `ogImage`, or other keys.** They are not in the schema, and
  because the Zod object is non-strict they are silently stripped rather than
  flagged — the key just does nothing, with no warning. The social card comes
  from the title and tags via `src/pages/og/til/[slug].png.ts`.
- **`title`** renders at 52px on that card, so keep it under about 70
  characters — two lines. Make it the lesson, stated as a claim, not a topic
  label. "Five Logstash gotchas that wedged me in production", not "Logstash
  notes".
- **`description`** is the meta description and the index-page subtitle.
  One sentence, or the bare list of gotchas when the entry is a list.

## Tags

Read the existing vocabulary before choosing — `grep -h '^tags:'
src/content/til/*.md` — and reuse a tag that already exists rather than
coining a near-duplicate. Lowercase, kebab-case for multiple words, three to
four per entry. Tags feed `/tags/[tag]` and are shared with the blog and links
collections, so a new tag has site-wide effect. Do not add `hago 🔧`, which
means something specific on `/hago/`.

## Slug

The filename becomes the URL. Kebab-case, descriptive of the lesson rather
than the technology alone, and it may be longer than the title is snappy:
`llms-will-confidently-strip-your-bike-pedals`,
`opensearch-keyword-byte-limit`, `sandboxing-claude-code-docker-readonly-aws`.

## Voice and structure

Read one or two existing entries before drafting. What they have in common:

- **Open with the situation, not a definition.** What was being attempted and
  what happened. "Notes to future me after a week of cascading Logstash
  failures." First person, past tense.
- **Show the real artefact.** The actual error text, thread dump, SQL, or
  shell snippet, in a fenced block with a language tag. Paraphrased errors are
  worthless to future me — the point is that the next search for that string
  lands here.
- **Then the fix, concretely.** The working version of the command or query,
  not a description of it.
- **Close on the posture, not a summary.** What changes about how I work now.
  The bike-pedals entry ends on being lazy, not on LLM unreliability. A
  section heading like `## The actual lesson` is fine but not required.
- **Multi-gotcha entries** use one `##` per gotcha, each headed with the
  behaviour rather than the component: "`:sql_last_value` substitutes as a
  string".
- **Bold sparingly**, for the one sentence that is the actual point.
- Length runs roughly 150-600 words. If it needs more than that, it is a blog
  post.
- Do not pad. No "In this post I will", no restating the title as a first
  line, no concluding recap of what was just read.

If the material comes from work, keep it generic: no employer internals,
service names, metrics, or thresholds. Describe the mechanism, not the system
it was found in.

## Steps

1. Read `src/content.config.ts` (the `til` block) and at least one existing
   entry, so the draft matches current conventions rather than these notes.
2. Check the existing tag vocabulary.
3. Pick the slug; confirm no file already claims it.
4. Write the file.
5. Run `npm run build`. Zod validates here: a missing required field or an
   unparseable `pubDate` fails the build with `InvalidContentEntryDataError`.
   Note what it does *not* catch — an unknown key, or a valid-but-ISO date that
   will render a day early. Check those by eye. Confirm the build passes and
   that `dist/til/<slug>/index.html` and `dist/og/til/<slug>.png` exist.
6. Show the user the rendered entry path and stop.

## Stop before committing

Pushing to `master` triggers the GitHub Actions deploy and the entry is live
in two to three minutes. Leave the file uncommitted and let the user read it
first. Commit and push only when they ask.

---
name: wiki-knowledge
description: Search the zeb wiki for project context — ask the retrieval service first, fall back to direct graph tools when raw grounding material is needed.
---

# Wiki Knowledge

Use this skill to pull project knowledge from the zeb wiki before planning or
building. The CLI binary is pre-installed at `wiki-entity-cli` in the sandbox
environment.

`wiki-entity-cli` exposes two layers over the same knowledge graph:

- **`query`** — the wiki service's own agent. It already knows how to resolve
  the right group, search facts and entity summaries, and retry with a
  rephrased search if the first attempt comes back empty. It returns one
  synthesized answer. Use it first.
- **`list-groups` / `node-search` / `search` / `get-episodes`** — the same
  underlying tools `query`'s agent uses internally, callable directly. These
  return raw facts, entity summaries, and source text instead of a paraphrase.
  Use them when `query` finds nothing, or when the task needs verbatim
  material (exact figures, quoted text for citation) rather than a summary.

## Required env vars (already set in sandbox)

- `ZEB_WIKI_API_URL` — base URL of substrate-graphiti-zeb-wiki, for `query`
- `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` — for the direct graph tools
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (or the
  `BEDROCK_AWS_*` overrides) — Bedrock, needed by both paths

## Step 1 — Ask the retrieval service

The wiki stores knowledge by project/topic name — NOT by Jira project key
(e.g. "AZ"). Derive the project/topic name from `task_description`, then ask
a real question, not a keyword:

```bash
wiki-entity-cli query "What do we know about <project name>?" [-g <group_id>] --raw
```

Example: if `task_description` = "NFI Logistics platform — build a modern
logistics system..." →

```bash
wiki-entity-cli query "What do we know about the NFI Logistics project?" --raw
```

`--raw` returns `{question, answer, input_tokens, output_tokens, estimated_cost_usd}`.

- If `answer` is non-empty and useful → that's your knowledge summary. Skip to
  **Output**.
- If `answer` is empty/unhelpful, or the task needs verbatim source material
  rather than a paraphrase (exact contract terms, quoted figures, a specific
  citation) → continue to Step 2.

## Step 2 — Direct graph tools

Only reached when Step 1 didn't fully answer the need. These are the same
tools `query` already tried internally — don't expect a second, less
specialized attempt to find what a dedicated retrieval agent with
retry-and-rephrase logic could not. Use this step for **raw** material, not as
a blind retry.

### 2a — Find the group, if unknown

```bash
wiki-entity-cli list-groups --raw
```

Match the `group_id` whose description best fits the project/topic.

### 2b — Resolve the entity

```bash
wiki-entity-cli node-search "<project name>" -g <group_id> --raw
```

Look for the highest-scoring entity summary. Note its name for the output.

### 2c — Retrieve relevant facts

```bash
wiki-entity-cli search "<topic>" -g <group_id> -n 10 --raw
```

Run additional targeted searches for specific topics as needed, e.g.:

```bash
wiki-entity-cli search "technical requirements architecture tech stack" -g <group_id> -n 5 --raw
```

### 2d — Full source text, when citing verbatim

```bash
wiki-entity-cli get-episodes <episode_uuid...> --raw
```

Only when a fact's exact wording matters. `search` and `node-search` results
reference the episode(s) they came from.

If Step 2 also finds nothing → the project has no wiki knowledge → proceed
with `task_description` context only.

## Output

Consolidate into a knowledge summary:

```
wiki_knowledge:
  source: query | graph_tools | none
  answer: "{query's answer, if Step 1 was used}"
  entity: "{entity name, if node-search was used}"
  facts:
    - "{fact text}"
  episodes:
    - uuid: {episode_uuid}
      content: "{verbatim text, if fetched}"
```

Use this knowledge summary as the primary context for planning/building. If no
wiki knowledge found, fall back to Jira story descriptions and
`task_description` only.

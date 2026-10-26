---
name: analyse-codebase
description: Build an AST code graph of the cloned repo for blast-radius and impact analysis. Run build once right after setup-git-repo; query on demand while authoring the Solution Definition.
compatibility: "Requires code-review-graph CLI (pre-installed at /usr/local/bin/code-review-graph)."
allowed-tools:
  - "Bash(code-review-graph:*)"
---

# analyse-codebase

Use this skill in two phases every session:

- **Phase 1 — Build** (always, right after `setup-git-repo`): parse the repo into a local graph once. Takes seconds.
- **Phase 2 — Query** (on demand, while authoring the SD): ask the graph targeted questions about the code instead of reading every file manually.

---

## Phase 1: Build the graph (always run after clone)

Run this once from inside the cloned repo directory:

```bash
cd <cwd>/repo
code-review-graph build
```

This produces a `.code-review-graph/` directory at the repo root containing a SQLite graph of every function, class, and their call relationships. The graph persists for the rest of the session — you do not need to rebuild it.

If `build` errors with a parse failure on a specific file, continue — the graph is still usable for all other files. Only stop if the entire build fails.

---

## Phase 2: Query the graph (on demand while writing the SD)

Use these commands from inside `<cwd>/repo` when you need to understand what a story's changes will affect. You do not need to run all of them — pick the ones relevant to the story.

### Understand the full call graph (start here)

```bash
code-review-graph visualize --format json
```

Returns the complete call graph as JSON — functions as nodes, calls as edges. Use this to trace which functions, classes, and modules are involved in the area the story touches. Read the JSON to identify callers, dependents, and affected code paths relevant to the story's scope.

### Export to GraphML (for complex graphs)

```bash
code-review-graph visualize --format graphml
```

Useful when the JSON graph is too large to reason about inline — export to GraphML and inspect the topology.

---

## Rules

- Always run Phase 1 immediately after `setup-git-repo` completes — before reading the story description or exploring the codebase manually.
- Phase 2 queries are **on demand only** — run them when the story touches existing code and you need to trace what is affected. Do not run them for stories that only add brand-new files with no callers yet.
- Never run `code-review-graph serve` — the planner uses the CLI, not the MCP server.
- All commands run from inside `<cwd>/repo` (the cloned repo root), not from `<cwd>`.

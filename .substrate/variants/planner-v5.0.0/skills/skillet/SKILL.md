---
name: skillet
description: Search and view substrate tech skills from the registry. Run at session start to discover available skills before any implementation work.
compatibility: "Requires skillet CLI (pre-installed at /usr/local/bin/skillet)."
allowed-tools:
  - "Bash(skillet:*)"
---

# skillet

Run **once at the very start of every session**, before any other step. This tells you what tech skills are available — library docs, API references, framework patterns — so you know what tools you have before planning your work.

---

## Step 1: List all available skills

```bash
skillet list --raw
```

This returns a JSON array of every skill in the registry. Each entry has:

```json
{
  "name": "<skill-name>",
  "description": "<what it does and when to use it>",
  "path": "<full path to SKILL.md>"
}
```

Read the list. Note any skills relevant to the current story's tech stack or domain.

---

## Step 2: Search for specific skills (if needed)

If the story involves a specific library, tool, or domain — search for it:

```bash
skillet search "<keyword>" --raw
```

Examples:
```bash
skillet search "react" --raw
skillet search "django" --raw
skillet search "documentation" --raw
skillet search --tag curl --raw
```

Search matches across: name, description, compatibility, allowed-tools, metadata.

---

## Step 3: View a skill in full (before using it)

Once you identify a relevant skill, read its full instructions:

```bash
skillet view <skill-name> --raw
```

Example:
```bash
skillet view context7 --raw
```

This returns the complete SKILL.md — read it fully before invoking the skill.

---

## Rules

- When you are running `skillet list --raw`, do not use `head` to filter the lines as it will truncate the skill context which results in in complete skill context. So just run the command without filtration
- Always run `skillet list --raw` as the **first action** of every session — before reading inputs, before exploring the codebase, before anything else.
- If a skill exists that covers a library or pattern you need — use it. Do not manually search the web or invent patterns that a skill already provides.
- Do not skip this step even if you believe you know what skills are available — the registry may have been updated.

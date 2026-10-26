---
name: handoff
description: Trigger the next variant by running the handoff script. Supports same-session and cross-session delegation.
---

# Handoff Process

This is the crucial final process: it hands the work off to a different variant (agent) based on the state of the current variant's output. When your workflow's output is ready, this is what triggers whatever comes next in the pipeline, so a clean handoff is what lets the next variant pick up without gaps. Follow the details and instructions below to carry it out neatly.

### General Instructions to Follow

- Use the `bash-tool` to execute the script.
- Do not create any files as part of this process.
- Stop immediately once the script prints `Handoff Confirmed` — don't generate or process anything beyond that output.
- If the script errors consistently three times in a row, stop the execution and return an error. Don't try to fix it yourself.

### Handoff Script

```bash
bash ./.pi-{{variant_id}}/skills/handoff/scripts/handoff.sh \
  <next_variant_id> \
  "<task_description>" \
  "<story_id>" \
  <session_id>
```

- The `next_variant_id`, `task_description`, and `story_id` fields are required. If any of them is missing, stop the execution and return which required field values you're missing rather than running the script with gaps.
- The `session_id` field is optional. Include it only when you've received a `session_id` from the input for a cross-session handoff.
- With those details in hand, run the script above to perform the handoff.
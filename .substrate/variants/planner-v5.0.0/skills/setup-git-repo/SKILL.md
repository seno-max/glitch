---
name: setup-git-repo
description: Extract repo URL and base branch from Jira description, clone the Azure DevOps repo, and create the story branch.
---

# Set up the Working Repository and Story Branch

For the given story, you need to identify the correct repository from the Jira description and create a new feature branch off the right base branch. This branch will hold every code commit and snippet for this specific story, so getting the repository and base branch right here is what all the downstream work depends on. Follow the steps below to set it up.

### Step 1: Extract the Repo URL and Base Branch from the Description

- Look for the Azure DevOps repository URL in the description. It will be in the format `https://dev.azure.com/.../_git/...`.
- Look for the base branch in the description, checking all the patterns a base branch might reasonably be written in.
- Don't guess at either value. If the repo URL, the base branch, or both are missing from the description, call `ask_human` immediately and ask for exactly what's missing, using the matching question:
    - "No repository URL found in the description for {{story_id}}. Please provide the Azure DevOps repo URL to proceed." or
    - "No base branch found in the description for {{story_id}}. Please provide the base branch to refer to proceed." or
    - "No repository URL and base branch were found in the description for {{story_id}}. Please provide the Azure DevOps repo URL and base branch to refer to proceed."
- Proceeding on an assumed repo or branch would land the whole story's work in the wrong place, which is why asking a human here is the safe default rather than inferring.

### Step 2: Clone the Repo and Create the Story Branch

- Once you have all the details — repo URL, base branch, story id, and story name — you can set up the feature branch in the identified repo by running the script below.
- The script lives in your current working directory (`<cwd>`), so make sure you're inside that directory before you run it.
  ```bash
  bash .pi-{{variant_id}}/skills/setup-git-repo/scripts/setup-git-repo.sh \
    --clone <REPO_URL> \
    --branch <STORY_ID>-<STORY_NAME> \
    --base <BASE_BRANCH>
  ```
- The script clones into a `repo/` subdirectory of the current working directory (`<cwd>/repo`), not directly into `<cwd>` itself — all subsequent work (`cd <cwd>/repo && ...`) descends into that subdirectory first.
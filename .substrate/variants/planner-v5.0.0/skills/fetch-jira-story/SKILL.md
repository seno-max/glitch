---
name: fetch-jira-story
description: This skill is used to fetch the details of specific story from JIRA. It should be used by the agent only when it needs the Jira story details, if it already has the details about story (description with repo url is main) then it don't need to use this skill.
---

# Fetch Jira Story using ACLI (Atlassian CLI)

Fetched the details of specific story from JIRA through `acli` (Atlassian CLI). 
You will receive the story id which you will use in below steps to get the details of that particular story. 
If you have the jira story description but can't able to locate "azure devops repo url", then trigger `ask_human` tool to escalate to user, don't need to follow any of the below steps if you only want repo url.

---

### Step 1: Check login status to ensure authentication

```bash
acli jira auth status
```

- If you get "Error" for the above command then go to Step 2 to authenticate acli
- If you get the account details (Already acli authenticated completed), then go to Step 3 to fetch jira details

### Step 2: Login to acli and authenticate

```bash
mkdir -p "$ACLI_CONFIG_DIR" && chmod 700 "$ACLI_CONFIG_DIR"
echo "$ATLASSIAN_API_TOKEN" | acli jira auth login \
  --site "$ATLASSIAN_URL" \
  --email "$ATLASSIAN_USERNAME" \
  --token
```

- Just execute the above the command and all the required values will be configured in env variables, you don't need to worry about those values
- If you faced any issues in login, then you can stop this process completely and return jira authentication failure. 
- This process will just act as context, so stopping this process completely won't impact in actual process, it actually helps by avoiding unwanted process calls
- The probability of this login failure will be near zero, just letting you know what should you do when login fails.

### Step 3: Fetching specific story details

```bash
acli jira workitem view {{story_id}} --fields "customfield_11481,customfield_10257,customfield_10469,customfield_11076,attachment" --json
```

- You need to pass the actual story id in place of `{{story_id}}` in the above command.
- Just execute the command and get the result
- You need to manipulate the result to get a better understanding
    - "customfield_10469" or "customfield_10257" should be replaced as "Acceptance Criteria"
    - "customfield_11481" or "customfield_11076" should be replaced as "Repo URL"
- Don't care if the result returns nothing or results gets failed
- After you read the description of the story, if you can't able to locate the "azure devops url" then you need to trigger `ask_human` tool to ask the user for the repo url.

---

### Step 4: Download attachments (if any)

If the story has attachments, download them into the repo's `.substrate/docs/` directory using the script.

**Pick the command that matches your current directory.** The `.pi-{{variant_id}}/` skills mount
is a sibling of `repo/`, not inside it — so the path to the script differs depending on where you are.
Getting this wrong is the one way this step fails, with `No such file or directory` (exit 127).

From the session root (`<cwd>`):

```bash
bash ./.pi-{{variant_id}}/skills/fetch-jira-story/scripts/download-attachments.sh "{{story_id}}"
```

From inside the cloned repo (`<cwd>/repo`) — note the leading `../`:

```bash
cd <cwd>/repo && bash ../.pi-{{variant_id}}/skills/fetch-jira-story/scripts/download-attachments.sh "{{story_id}}"
```

| Argument | Required | Example | Description |
|---|---|---|---|
| `story_id` | Yes | `TES-3602` | Jira story key |
| `repo_root` | No | `/home/agent/repo` | Absolute path to the cloned repo root. **Omit it** — the script derives it from its own location and prints the value it used. Pass it only to write somewhere other than `<cwd>/repo`. |

**Required env vars:** `ATLASSIAN_URL`, `ATLASSIAN_USERNAME`, `ATLASSIAN_API_TOKEN`

- Files are saved to `<repo_root>/.substrate/docs/<filename>`
- The output location does **not** depend on your current directory — only on `repo_root`. Running the
  script from `<cwd>` and from `<cwd>/repo` writes to the same place.
- If the story has no attachments the script exits cleanly with a message — this is not an error
- Run this step only when you need the attachment content (e.g. a PDF spec, design doc, or reference file mentioned in the story description)
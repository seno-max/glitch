#!/usr/bin/env bash
# Usage: download-attachments.sh <STORY_ID> [REPO_ROOT]
# Downloads all attachments from a Jira story into <REPO_ROOT>/.substrate/docs/
#
# Must be run with `bash` (not `sh`) — it uses bash-only features.
#
# REPO_ROOT is OPTIONAL. When omitted it is derived from this script's own location
# (<session>/.pi-<variant>/skills/fetch-jira-story/scripts/), so the script produces the
# same result no matter which directory it is invoked from — session root, <session>/repo,
# or anywhere else. Pass REPO_ROOT explicitly only to override that default.
#
# Exit codes:
#   0  attachments downloaded, OR the story genuinely has none (both are success)
#   1  something went wrong: bad credentials, API error, or a download that failed
#
# Required env vars: ATLASSIAN_URL, ATLASSIAN_USERNAME, ATLASSIAN_API_TOKEN
set -euo pipefail

STORY_ID="${1:?Usage: download-attachments.sh <STORY_ID> [REPO_ROOT]}"
REPO_ROOT="${2:-}"

# Resolve REPO_ROOT independently of the caller's cwd. This script lives at
#   <session>/.pi-<variant>/skills/fetch-jira-story/scripts/download-attachments.sh
# so the session root is four levels above its own directory.
if [ -z "$REPO_ROOT" ]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  SESSION_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"
  if [ -d "${SESSION_ROOT}/repo" ]; then
    REPO_ROOT="${SESSION_ROOT}/repo"
  else
    REPO_ROOT="${SESSION_ROOT}"
  fi
  echo "REPO_ROOT not supplied — using ${REPO_ROOT}"
fi

command -v jq >/dev/null 2>&1 || { echo "ERROR: jq not found on PATH — it is required to parse the Jira response." >&2; exit 1; }

: "${ATLASSIAN_URL:?ATLASSIAN_URL must be set}"
: "${ATLASSIAN_USERNAME:?ATLASSIAN_USERNAME must be set}"
: "${ATLASSIAN_API_TOKEN:?ATLASSIAN_API_TOKEN must be set}"

OUT_DIR="${REPO_ROOT}/.substrate/docs"
mkdir -p "$OUT_DIR"

RESPONSE_FILE="$(mktemp)"
trap 'rm -f "$RESPONSE_FILE"' EXIT

# ── Fetch the attachment metadata. Check the HTTP status explicitly so that bad
#    credentials are reported as an error, never mistaken for "no attachments". ──
HTTP_CODE="$(curl -sS --max-time 60 \
  -u "${ATLASSIAN_USERNAME}:${ATLASSIAN_API_TOKEN}" \
  -H "Accept: application/json" \
  -o "$RESPONSE_FILE" -w '%{http_code}' \
  "${ATLASSIAN_URL}/rest/api/3/issue/${STORY_ID}?fields=attachment")" || {
    echo "ERROR: could not reach ${ATLASSIAN_URL} (curl failed)." >&2; exit 1; }

if [ "$HTTP_CODE" != "200" ]; then
  echo "ERROR: Jira API returned HTTP ${HTTP_CODE} for ${STORY_ID}." >&2
  API_ERR="$(jq -r '(.errorMessages // [])[], (.errors // {} | to_entries[] | "\(.key): \(.value)")' "$RESPONSE_FILE" 2>/dev/null || true)"
  if [ -n "$API_ERR" ]; then echo "$API_ERR" >&2; else head -c 300 "$RESPONSE_FILE" >&2; echo >&2; fi
  case "$HTTP_CODE" in
    401|403) echo "Hint: check ATLASSIAN_USERNAME / ATLASSIAN_API_TOKEN." >&2 ;;
    404)     echo "Hint: story ${STORY_ID} not found, or the token lacks access to it." >&2 ;;
  esac
  exit 1
fi

# One tab-separated url<TAB>filename line per attachment. Emitted as pairs by jq, so
# the two fields cannot drift out of alignment the way two separate greps could.
PAIRS="$(jq -r '[.fields.attachment // [] | .[] | select(.content != null)] | .[] | "\(.content)\t\(.filename // "")"' "$RESPONSE_FILE")"

if [ -z "$PAIRS" ]; then
  echo "No attachments found on ${STORY_ID}"
  exit 0
fi

TOTAL=0; SUCCEEDED=0; FAILED=0

# Here-string, not a pipe: keeps the loop in this shell so the counters survive it.
while IFS=$'\t' read -r url filename; do
  [ -n "$url" ] || continue
  TOTAL=$((TOTAL + 1))

  # basename strips any directory component, so a filename like "../x" or "a/b.pdf"
  # cannot escape OUT_DIR or land in a directory that does not exist.
  SAFE_NAME="$(basename -- "$filename")"
  case "$SAFE_NAME" in
    ""|"."|"..") SAFE_NAME="${STORY_ID}-attachment-${TOTAL}"
                 echo "WARN: attachment ${TOTAL} has an unusable filename — saving as ${SAFE_NAME}" >&2 ;;
  esac

  OUT_PATH="${OUT_DIR}/${SAFE_NAME}"
  echo "Downloading: ${SAFE_NAME}"

  # -f makes curl fail on 4xx/5xx instead of writing the error body into the file.
  if curl -fsSL --max-time 300 \
       -u "${ATLASSIAN_USERNAME}:${ATLASSIAN_API_TOKEN}" \
       "$url" -o "$OUT_PATH" && [ -s "$OUT_PATH" ]; then
    echo "  -> ${OUT_PATH} ($(wc -c < "$OUT_PATH" | tr -d ' ') bytes)"
    SUCCEEDED=$((SUCCEEDED + 1))
  else
    echo "  FAILED: ${SAFE_NAME} — download error or empty file" >&2
    rm -f "$OUT_PATH"
    FAILED=$((FAILED + 1))
  fi
done <<< "$PAIRS"

echo "Done. ${SUCCEEDED} of ${TOTAL} attachment(s) downloaded to ${OUT_DIR}"

if [ "$FAILED" -gt 0 ]; then
  echo "ERROR: ${FAILED} attachment(s) failed to download." >&2
  exit 1
fi

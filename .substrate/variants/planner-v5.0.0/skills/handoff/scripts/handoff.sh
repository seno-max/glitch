#!/bin/bash
# Usage: ./handoff.sh <next_variant> <task_description> <story_id> [session_id]
# session_id is optional — if omitted, auto-extracted from cwd path: .../zeb_events/<session_id>/...
set -e

NEXT_VARIANT="${1:-}"
TASK_DESCRIPTION="${2:-}"
STORY_ID="${3:-}"
SESSION_ID="${4:-}"

if [ -z "$PUBLISHER_SERVER_URL" ]; then
  echo "ERROR: PUBLISHER_SERVER_URL not set."
  exit 1
fi

if [ -z "$NEXT_VARIANT" ] || [ -z "$TASK_DESCRIPTION" ] || [ -z "$STORY_ID" ]; then
  echo "Usage: ./handoff.sh <next_variant> <task_description> <story_id> [session_id]"
  echo "  next_variant      e.g. executor-v1.0.0"
  echo "  task_description  one-line summary of what the next variant should do"
  echo "  story_id          e.g. SBT-761"
  echo "  session_id        optional — target session; defaults to current session from cwd"
  exit 1
fi

# Use provided session_id or auto-extract from pwd
if [ -z "$SESSION_ID" ]; then
  SESSION_ID=$(pwd | grep -oP '(?<=zeb_events/)[^/]+')
  if [ -z "$SESSION_ID" ]; then
    echo "ERROR: Could not extract session ID from pwd: $(pwd)"
    echo "Expected path to contain: zeb_events/<session_id>, or pass session_id as 4th argument."
    exit 1
  fi
fi

USECASE_ID="process-jira-story"
URL="${PUBLISHER_SERVER_URL}/${USECASE_ID}"

echo "Handing off to: $NEXT_VARIANT"
echo "Session:        $SESSION_ID"
echo "Story:          $STORY_ID"
echo "Task:           $TASK_DESCRIPTION"
echo "URL:            $URL"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"substrate_session_id\": \"$SESSION_ID\",
    \"input_args\": {
      \"next_variant\": \"$NEXT_VARIANT\",
      \"story_id\": \"$STORY_ID\",
      \"task_description\": \"$TASK_DESCRIPTION\"
    }
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "Response: $BODY"

if [ "$HTTP_CODE" != "200" ]; then
  echo "ERROR: Handoff failed with HTTP $HTTP_CODE"
  exit 1
fi

echo "Handoff confirmed. STOP — do not continue."

#!/bin/bash
  set -e

  # Usage:
  #   ./setup-git-repo.sh --clone <URL> --branch <NAME> --base <BASE_BRANCH>
  #
  # Clone the specified Azure DevOps repository, checkout the base branch,
  # and create a new story branch from it.

  REPO_URL=""
  BRANCH_NAME=""
  BASE_BRANCH=""

  # Parse arguments
  for i in "$@"; do
    if [ "$PREV" = "--clone" ]; then
      REPO_URL="$i"
    fi
    if [ "$PREV" = "--branch" ]; then
      BRANCH_NAME="$i"
    fi
    if [ "$PREV" = "--base" ]; then
      BASE_BRANCH="$i"
    fi
    PREV="$i"
  done

  # Validate required arguments
  if [ -z "$REPO_URL" ]; then
    echo "ERROR: No repo URL provided."
    echo "Usage: ./setup-git-repo.sh --clone <URL> --branch <BRANCH> --base <BASE>"
    exit 1
  fi

  if [ -z "$BRANCH_NAME" ]; then
    echo "ERROR: No branch name provided."
    echo "Usage: ./setup-git-repo.sh --clone <URL> --branch <BRANCH> --base <BASE>"
    exit 1
  fi

  if [ -z "$BASE_BRANCH" ]; then
    echo "ERROR: No base branch provided."
    echo "Usage: ./setup-git-repo.sh --clone <URL> --branch <BRANCH> --base <BASE>"
    exit 1
  fi

  if [ -z "$AZURE_DEVOPS_EXT_PAT" ]; then
    echo "ERROR: AZURE_DEVOPS_EXT_PAT not set."
    exit 1
  fi

  echo "Setting up repository: $REPO_URL"
  CLEAN_URL=$(echo "$REPO_URL" | sed "s|https://[^@]*@|https://|")
  AUTH_URL=$(echo "$CLEAN_URL" | sed "s|https://|https://${AZURE_DEVOPS_EXT_PAT}@|")

  REPO_DIR="repo"

  # Clone or use existing repo
  if [ -d "$REPO_DIR/.git" ]; then
    echo "Repository already cloned at $REPO_DIR. Using existing repo..."
    cd "$REPO_DIR"
    echo "Fetching latest changes..."
    git fetch --all --prune 2>&1 || {
      echo "Warning: Fetch failed, continuing with existing state"
    }
  else
    echo "Cloning repository..."
    MAX_RETRIES=3
    RETRY_COUNT=0

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
      if git clone "$AUTH_URL" "$REPO_DIR" 2>&1; then
        break
      else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
          echo "Clone failed. Retry $RETRY_COUNT/$MAX_RETRIES in 3 seconds..."
          rm -rf "$REPO_DIR"  # Clean up failed attempt
          sleep 3
        fi
      fi
    done

    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
      echo "ERROR: Failed to clone after $MAX_RETRIES attempts"
      exit 1
    fi

    cd "$REPO_DIR"

    # Ensure base branch is available
    echo "Fetching base branch: $BASE_BRANCH"
    git fetch origin "$BASE_BRANCH" 2>/dev/null || git fetch --all
  fi

  # Restore any deleted files
  git status --short | grep -q "^ D" && git restore . || true

  # Checkout base branch before creating story branch
  echo "Checking out base branch: $BASE_BRANCH"

  if git show-ref --verify --quiet "refs/heads/$BASE_BRANCH"; then
    echo "Base branch exists locally, checking out..."
    git checkout "$BASE_BRANCH"
  elif git show-ref --verify --quiet "refs/remotes/origin/$BASE_BRANCH"; then
    echo "Base branch exists on remote, creating local tracking branch..."
    git checkout -b "$BASE_BRANCH" "origin/$BASE_BRANCH"
  else
    # Try case-insensitive match
    echo "Exact match not found. Trying case-insensitive search..."
    ACTUAL_BRANCH=$(git branch -r | grep -i "origin/$BASE_BRANCH$" | sed 's/.*origin\///' | tr -d ' ' | head -1)

    if [ -n "$ACTUAL_BRANCH" ]; then
      echo "Warning: Base branch case mismatch. Using '$ACTUAL_BRANCH' instead of '$BASE_BRANCH'"
      git checkout -b "$ACTUAL_BRANCH" "origin/$ACTUAL_BRANCH"
    else
      echo "ERROR: Base branch '$BASE_BRANCH' not found locally or in origin."
      echo "Available remote branches:"
      git branch -r
      exit 1
    fi
  fi

  echo "Base branch ready: $(git branch --show-current)"

  # Create and checkout story branch from current HEAD (base branch)
  if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    echo "Story branch already exists, checking out: $BRANCH_NAME"
    git checkout "$BRANCH_NAME"
  else
    echo "Creating story branch: $BRANCH_NAME (from $(git branch --show-current))"
    git checkout -b "$BRANCH_NAME"
  fi

  echo ""
  echo "=== Repository Ready ==="
  echo "Remote: $(git remote get-url origin)"
  echo "Base:   $BASE_BRANCH"
  echo "Branch: $(git branch --show-current)"
  echo "Path:   $PWD"
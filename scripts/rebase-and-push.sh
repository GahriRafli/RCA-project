#!/usr/bin/env bash
set -e

echo "== Git rebase+push helper =="
BRANCH=$(git rev-parse --abbrev-ref HEAD)
REMOTE=origin
MAIN_BRANCH=main

# Check for uncommitted changes
if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERROR: You have uncommitted changes. Please commit or stash them before running this script."
  git status --porcelain
  exit 1
fi

echo "Current branch: $BRANCH"

echo "Fetching remote..."
git fetch $REMOTE

if [[ "$BRANCH" == "$MAIN_BRANCH" ]]; then
  echo "Rebasing $BRANCH onto $REMOTE/$MAIN_BRANCH..."
  git rebase $REMOTE/$MAIN_BRANCH
else
  echo "Rebasing $BRANCH onto $REMOTE/$MAIN_BRANCH..."
  git rebase $REMOTE/$MAIN_BRANCH
fi

if [[ $? -ne 0 ]]; then
  echo "Rebase failed or conflict occurred. Resolve conflicts, then run: git rebase --continue"
  exit 1
fi

echo "Pushing to $REMOTE $BRANCH..."

git push $REMOTE $BRANCH

if [[ $? -eq 0 ]]; then
  echo "Push successful."
else
  echo "Push failed. If branch protection prevented push, push to a new branch and open a PR, e.g. git push origin HEAD:fix/rebase-$BRANCH"
fi

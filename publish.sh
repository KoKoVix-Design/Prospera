#!/usr/bin/env bash
set -e

# Usage: ./publish.sh [GITHUB_USERNAME] [REPO_NAME]
USERNAME=${1:-KoKoVix-Design}
REPO=${2:-Kokovix}
REMOTE_URL="https://github.com/$USERNAME/$REPO.git"
PAGES_URL="https://$USERNAME.github.io/$REPO/"

echo "Using username: $USERNAME  repo: $REPO"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Initializing git repository..."
  git init
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "Adding remote: $REMOTE_URL"
  git remote add origin "$REMOTE_URL"
fi

git add .
if git diff --cached --quiet; then
  echo "No staged changes to commit."
else
  git commit -m "Publish site"
fi

git branch -M main
git push -u origin main

echo "Pushed to https://github.com/$USERNAME/$REPO"
echo "Pages URL: $PAGES_URL"

# Try to open in browser (best-effort)
if command -v python3 >/dev/null 2>&1; then
  python3 -m webbrowser "$PAGES_URL" >/dev/null 2>&1 &
elif command -v python >/dev/null 2>&1; then
  python -m webbrowser "$PAGES_URL" >/dev/null 2>&1 &
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$PAGES_URL" >/dev/null 2>&1 &
elif command -v open >/dev/null 2>&1; then
  open "$PAGES_URL" >/dev/null 2>&1 &
else
  echo "Open this URL manually: $PAGES_URL"
fi

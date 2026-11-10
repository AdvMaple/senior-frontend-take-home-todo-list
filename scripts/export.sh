#!/usr/bin/env bash
# Zip the whole project for submission (no git history needed).
# Usage: pnpm export   -> ../senior-frontend-engineer-submission.zip
set -euo pipefail
cd "$(dirname "$0")/.."
name="$(basename "$PWD")"
out="$(cd .. && pwd)/${name}-submission.zip"
rm -f "$out"
cd ..
zip -rq "$out" "$name" \
	-x "$name/node_modules/*" "$name/*/node_modules/*" "$name/*/*/node_modules/*" \
	-x "$name/.turbo/*" "$name/*/.turbo/*" "$name/*/*/.turbo/*" \
	-x "$name/*/dist/*" "$name/*/*/dist/*" "$name/dist/*" \
	-x "$name/.vitest/*" "$name/*/.vitest/*" "$name/*/*/.vitest/*" \
	-x "$name/.git/*" "$name/coverage/*" "$name/*/coverage/*" "$name/*/*/coverage/*" \
	-x "*.DS_Store" "*.log" "*.tsbuildinfo" "$name/.env" "$name/.env.*"
echo "Created $(cd "$(dirname "$out")" && pwd)/$(basename "$out") ($(du -h "$out" | cut -f1))"
unzip -l "$out" | tail -1

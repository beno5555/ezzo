#!/bin/sh
# Runs in the one-shot n8n-import service (compose.yaml), before n8n starts, on every start.
# Imports the credentials and the workflows, then publishes each workflow by the fixed id in its file.
# The import unpublishes what it imports, so the publish runs every time, not only on a clean start.
# Any failure stops the start: n8n waits for this service to exit with 0.
set -eu

n8n import:credentials --input=/import/credentials.json
n8n import:workflow --separate --input=/import/workflows

for file in /import/workflows/*.json; do
  id=$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).id)' "$file")
  n8n publish:workflow --id="$id"
done

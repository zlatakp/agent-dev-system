#!/bin/bash

# start.sh — compose and send a message to the PM
# bash start.sh

set -e

PIPELINE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

source "$PIPELINE_DIR/agents/.env"

echo ""
echo "agent-pipeline — new message"
echo "-----------------------------"
echo ""

# ── Pick message type ─────────────────────────────────────────

echo "Message type:"
echo ""

PS3="Select type: "

select STATUS in brief feedback; do
  if [ -n "$STATUS" ]; then
    break
  fi
  echo "Invalid selection, try again."
done

TASK_TYPE=""
ITERATION_ID=""

if [ "$STATUS" = "brief" ]; then
  echo ""
  echo "Task type:"
  echo ""

  PS3="Select task type: "

  select TASK_TYPE in new-project feature refactor config onboarding; do
    if [ -n "$TASK_TYPE" ]; then
      break
    fi
    echo "Invalid selection, try again."
  done
fi

if [ "$STATUS" = "feedback" ]; then
  LATEST_REVIEW=$(ls -t "$PIPELINE_DIR/agents/human/inbox/"*pm-review*.md 2>/dev/null | head -1)

  if [ -n "$LATEST_REVIEW" ]; then
    ITERATION_ID=$(grep "^iteration_id:" "$LATEST_REVIEW" | sed 's/iteration_id: //' | tr -d '[:space:]')
    echo ""
    echo "  Detected iteration: $ITERATION_ID"
  else
    read -p "  Iteration ID (e.g. 001): " ITERATION_ID < /dev/tty
  fi
fi

echo ""
echo "Selected: $STATUS${TASK_TYPE:+ / $TASK_TYPE}"
echo ""

# ── Load schema ───────────────────────────────────────────────

SCHEMAS_DIR="$PIPELINE_DIR/agents/schemas"
SCHEMA_FILE="$SCHEMAS_DIR/human-${STATUS}.md"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "Error: schema not found: $SCHEMA_FILE"
  exit 1
fi

# ── Extract body fields only (skip frontmatter) ───────────────

mapfile -t FIELDS < <(awk '/^---/{found++; next} found>=2 && /^## /{print}' "$SCHEMA_FILE" | sed 's/## //' | sed 's/\r//' | sed 's/ — OPTIONAL.*//')

declare -A FIELD_VALUES
declare -A FIELD_OPTIONAL

echo "Fill out the following fields:"
echo "(press enter to leave optional fields blank)"
echo ""

for field in "${FIELDS[@]}"; do
  OPTIONAL=""
  if grep -q "## $field — OPTIONAL" "$SCHEMA_FILE"; then
    OPTIONAL=" (optional)"
    FIELD_OPTIONAL[$field]=true
  fi

  read -p "  $field$OPTIONAL: " VALUE < /dev/tty
  FIELD_VALUES[$field]="$VALUE"
done



# ── Compose file ──────────────────────────────────────────────

TIMESTAMP=$(date +%Y-%m-%d_%H-%M)
FILENAME="${TIMESTAMP}_${STATUS}.md"
FILEPATH="$PIPELINE_DIR/agents/pm/inbox/$FILENAME"

{
  echo "---"
  [ -n "$ITERATION_ID" ] && echo "iteration_id: $ITERATION_ID"
  echo "date: $(date +%Y-%m-%d)"
  echo "from: human"
  echo "to: pm"
  echo "status: $STATUS"
  [ -n "$TASK_TYPE" ] && echo "type: $TASK_TYPE"
  echo "---"
} > "$FILEPATH"

# ── Write body fields ─────────────────────────────────────────

for field in "${FIELDS[@]}"; do
  VALUE="${FIELD_VALUES[$field]}"
  if [ -n "$VALUE" ] || [ -z "${FIELD_OPTIONAL[$field]}" ]; then
    cat >> "$FILEPATH" << EOF
## $field
$VALUE

EOF
  fi
done

# ── Done ──────────────────────────────────────────────────────

echo ""
echo "✓ Message written: $FILENAME"
echo "✓ Dropped into pm inbox"
echo ""
echo "Run the PM agent:"
echo "  System prompt: $PIPELINE_DIR/agents/pm/role.md"
echo "  User message:  Check your inbox and proceed."
echo ""
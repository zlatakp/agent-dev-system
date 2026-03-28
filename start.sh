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

echo ""
echo "Selected: $STATUS${TASK_TYPE:+ / $TASK_TYPE}"
echo ""


# ── Pick message type ─────────────────────────────────────────

SCHEMAS_DIR="$PIPELINE_DIR/agents/schemas"

SCHEMA_FILE="$SCHEMAS_DIR/human-$STATUS.md"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "Error: schema not found: $SCHEMA_FILE"
  exit 1
fi


mapfile -t FIELDS < <(grep "^## " "$SCHEMA_FILE" | sed 's/## //' | sed 's/\r//' | sed 's/ — OPTIONAL.*//')

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

cat > "$FILEPATH" << EOF
---
date: $(date +%Y-%m-%d)
from: human
to: pm
status: $STATUS
$([ -n "$TASK_TYPE" ] && echo "type: $TASK_TYPE")
---

EOF
TIMESTAMP=$(date +%Y-%m-%d_%H-%M)


# write fields
for field in "${!FIELD_VALUES[@]}"; do
  VALUE="${FIELD_VALUES[$field]}"
  if [ -n "$VALUE" ] || [ -z "${FIELD_OPTIONAL[$field]}" ]; then
    cat >> "$FILEPATH" << EOF
## $field
$VALUE

EOF
  fi
done

echo ""
echo "✓ Message written: $FILENAME"
echo "✓ Dropped into pm inbox"
echo ""
echo "Run the PM agent:"
echo "  System prompt: $PIPELINE_DIR/agents/pm/role.md"
echo "  User message:  Check your inbox and proceed."
echo ""
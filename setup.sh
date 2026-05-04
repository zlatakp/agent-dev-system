#!/bin/bash

# setup.sh — run once after cloning
# bash setup.sh

set -e

PIPELINE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "PIPELINE_DIR=$PIPELINE_DIR" >> "$PIPELINE_DIR/agents/.env"

echo ""
echo "agent-pipeline setup"
echo "--------------------"
echo ""

# ── Check for existing state ──────────────────────────────────

RUNTIME_DIRS=(
  "agents/pm/inbox"
  "agents/pm/logs"
  "agents/architect/inbox"
  "agents/architect/logs"
  "agents/engineer/inbox"
  "agents/engineer/logs"
  "agents/human/inbox"
  "agents/human/outbox"
)

EXISTING_FILES=()

for dir in "${RUNTIME_DIRS[@]}"; do
  if [ -d "$PIPELINE_DIR/$dir" ]; then
    while IFS= read -r -d '' file; do
      EXISTING_FILES+=("$file")
    done < <(find "$PIPELINE_DIR/$dir" -type f -name "*.md" -print0 2>/dev/null)
  fi
done

if [ ${#EXISTING_FILES[@]} -gt 0 ]; then
  echo "Existing pipeline state detected:"
  echo ""
  for file in "${EXISTING_FILES[@]}"; do
    echo "  ${file#$PIPELINE_DIR/}"
  done
  echo ""
  read -p "Discard and start fresh? [y/N] " DISCARD

  if [[ "$DISCARD" =~ ^[Yy]$ ]]; then
    for dir in "${RUNTIME_DIRS[@]}"; do
      rm -rf "$PIPELINE_DIR/$dir"
    done
    echo ""
    echo "✓ Previous state discarded"
  else
    echo ""
    echo "Keeping existing state. Continuing setup..."
  fi
  echo ""
fi

# ── Project root ──────────────────────────────────────────────

read -p "Enter the absolute path to your project: " PROJECT_ROOT

if [ ! -d "$PROJECT_ROOT" ]; then
  echo "Error: directory not found: $PROJECT_ROOT"
  exit 1
fi

echo "PROJECT_ROOT=$PROJECT_ROOT" > "$PIPELINE_DIR/agents/.env"
echo ""
echo "✓ Project root set"

# ── Runtime folders ───────────────────────────────────────────

mkdir -p "$PIPELINE_DIR/agents/pm/inbox/done"
mkdir -p "$PIPELINE_DIR/agents/pm/logs"
mkdir -p "$PIPELINE_DIR/agents/architect/inbox/done"
mkdir -p "$PIPELINE_DIR/agents/architect/logs"
mkdir -p "$PIPELINE_DIR/agents/engineer/inbox/done"
mkdir -p "$PIPELINE_DIR/agents/engineer/logs"
mkdir -p "$PIPELINE_DIR/agents/human/inbox"
mkdir -p "$PIPELINE_DIR/agents/human/outbox"

echo "✓ Folders created"

# ── Project state ─────────────────────────────────────────────

if [ ! -f "$PIPELINE_DIR/agents/pm/logs/project-state.md" ]; then
  cp "$PIPELINE_DIR/agents/schemas/project-state.md" \
     "$PIPELINE_DIR/agents/pm/logs/project-state.md"
  echo "✓ Project state initialised"
else
  echo "✓ Project state preserved"
fi

# ── Gitignore ─────────────────────────────────────────────────

if ! grep -q "agent-pipeline" "$PIPELINE_DIR/.gitignore" 2>/dev/null; then
  cat >> "$PIPELINE_DIR/.gitignore" << 'EOF'

# runtime state — do not commit
agents/.env
agents/pm/inbox/
agents/pm/logs/
agents/architect/inbox/
agents/architect/logs/
agents/engineer/inbox/
agents/engineer/logs/
agents/human/inbox/
agents/human/outbox/
EOF
  echo "✓ Gitignore updated"
else
  echo "✓ Gitignore already configured"
fi

# ── Done ──────────────────────────────────────────────────────

echo ""
echo "Pipeline ready."
echo ""
echo "  Existing project? Onboard first:"
echo "     cp agents/schemas/onboarding.md agents/human/outbox/YYYY-MM-DD_HH-MM_onboarding.md"
echo "     fill it out"
echo "     cp agents/human/outbox/*onboarding* agents/pm/inbox/"
echo "     run each agent once: Check your inbox and proceed."
echo ""
echo "  New project? Start here:"
echo "     cp agents/schemas/human-brief.md agents/human/outbox/YYYY-MM-DD_HH-MM_human-brief.md"
echo "     fill it out"
echo "     cp agents/human/outbox/*human-brief* agents/pm/inbox/"
echo "     run each agent: Check your inbox and proceed."
echo ""
echo "  Run each agent using its role.md as the system prompt"
echo "     User message: Check your inbox and proceed."
echo ""
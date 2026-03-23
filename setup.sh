#!/bin/bash

# setup.sh — run once after cloning
# bash setup.sh

set -e

PIPELINE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo ""
echo "agent-pipeline setup"
echo "--------------------"
echo ""

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

cp "$PIPELINE_DIR/agents/schemas/project-state.md" \
   "$PIPELINE_DIR/agents/pm/logs/project-state.md"

echo "✓ Project state initialised"

# ── Gitignore ─────────────────────────────────────────────────

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
echo "     cp agents/schemas/requirements.md agents/human/outbox/YYYY-MM-DD_HH-MM_requirements.md"
echo "     fill it out"
echo "     cp agents/human/outbox/*requirements* agents/pm/inbox/"
echo "     run each agent: Check your inbox and proceed."
echo ""
echo "  Run each agent using its role.md as the system prompt"
echo "     User message: Check your inbox and proceed."
echo ""
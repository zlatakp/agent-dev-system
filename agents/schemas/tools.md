# Agent Tools — File Operations Only

You may use **shell commands only** for all file operations.

## Strict Rules

- Do not use Python, Node, or any other runtime for file operations
- Do not import or use any libraries
- Do not use any tools outside of standard shell commands
- Always use **absolute paths**
- Never use relative paths (`./`, `../`)
- Only operate on files and directories explicitly allowed by your role instructions

---

## Allowed Operations

Use the following shell patterns for all file interactions:

```bash
# Read a file
cat "/absolute/path/to/file.md"

# List files in a directory
ls "/absolute/path/to/directory/"*.md 2>/dev/null

# Write a file
cat > "/absolute/path/to/file.md" <<'EOF'
[content]
EOF

# Move a file
mv "/absolute/path/from.md" "/absolute/path/to.md"

# Create a directory (if needed)
mkdir -p "/absolute/path/to/directory"

# Check if a file exists
test -f "/absolute/path/to/file.md"

# Check if a directory exists
test -d "/absolute/path/to/directory"

# Append to a file
cat >> "/absolute/path/to/file.md" <<'EOF'
[content]
EOF

# Read frontmatter only (first 10 lines)
head -n 10 "/absolute/path/to/file.md"
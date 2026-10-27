---
name: vercel-guidelines
description: Review or build UI against Vercel's Web Interface Guidelines — accessibility, focus states, forms, animation, typography, images and CLS, performance, navigation state, touch, dark mode, i18n, hydration and copy. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", "check my site against best practices", or as the final quality gate before shipping a page.
metadata:
  author: vercel
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines, or apply the same rules while writing new UI.

## How It Works

1. Get the guidelines (see **Guidelines Source**)
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the guidelines
4. Output findings in the terse `file:line` format

## Guidelines Source

Fetch fresh guidelines before each review:

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Use WebFetch to retrieve the latest rules. The fetched content contains all the rules and output format instructions.

If the fetch fails (offline, blocked network), use the bundled copy in [guidelines.md](guidelines.md) and say in the report that the local copy was used.

## Usage

When a user provides a file or pattern argument:
1. Get the guidelines as above
2. Read the specified files
3. Apply all rules from the guidelines
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.

When building rather than reviewing, read [guidelines.md](guidelines.md) before writing markup and treat its **Anti-patterns** list as things the output must not contain.

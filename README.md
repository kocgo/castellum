# Castellum - Starter Kit for Claude Code

## Folder Contents

```
castellum-starter/
├── CLAUDE_CODE_PROMPT.md    ← Give this to Claude Code
└── docs/
    ├── game-design-doc.md   ← What to build
    └── architecture.md       ← How to build it
```

## How to Use

1. Create a new folder for your project:
   ```bash
   mkdir castellum
   cd castellum
   ```

2. Copy these files into it:
   ```bash
   cp -r /path/to/castellum-starter/* .
   ```

3. Start Claude Code:
   ```bash
   claude
   ```

4. Give it the first prompt:
   ```
   Read CLAUDE_CODE_PROMPT.md and the docs in the docs/ folder.
   Then start with Task 1.1 - set up the monorepo structure.
   ```

5. Work through tasks one by one.

## Tips

- Let Claude Code read all docs before starting
- Complete and test each task before moving on
- Paste any errors you see - Claude Code will fix them
- The full build takes ~3-4 hours of prompting

Good luck, have fun!

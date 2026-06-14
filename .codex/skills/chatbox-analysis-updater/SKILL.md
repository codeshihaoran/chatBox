---
name: chatbox-analysis-updater
description: >
  In each project feature update/change, supplement in the chatBox analysis document.
  Use when Codex makes changes to the chatBox project that involve new features,
  bug fixes, refactoring, or module changes that should be reflected in the
  project analysis document (chatBox-analysis.md). Do not re-scan the entire project,
  only supplement the changed modules to avoid unnecessary token waste.
---

# chatBox Analysis Document Updater

## When to Use

Use this skill whenever you make changes to the chatBox project that involve:
- New feature development
- Bug fixes or optimizations
- Code refactoring or restructuring
- Module/file additions or deletions
- Dependency or configuration changes

## What to Do

After completing changes to the chatBox project, update the analysis document at:
C:\Users\shihaoran\projects\chatBox\chatBox-analysis.md

## Update Rules

1. **Only update changed modules**: Do NOT re-scan the entire project. Only update the specific module sections that have changed.
2. **Preserve existing content**: Do not modify or delete descriptions of unchanged modules.
3. **Add version history**: Always append a new entry to the "版本变更记录" section at the end of the document.
4. **Update module sections**: For each changed file, update the relevant module section with new features, changes, or fixes.
5. **Keep it concise**: Use bullet points, tables, and code references. Avoid verbosity.

## Update Format

### For Module Sections

Add new features/fixes under the existing module's "关键代码分析" subsection:
- Brief description of the change
- Reference the relevant code (function name, hook, component)
- Mention any UX/feature IDs if applicable

### For Version History

Append to the "版本变更记录" section:
```
### v{x}.{y}.{z} - {title} ({date})

#### {category}
- **{feature/fix description}**: {details} ({file_path})
```

### For 可优化点

Add new entries to the table if applicable, or mark resolved items with strikethrough.

## Important Notes

1. Read the existing analysis document first to understand the current structure
2. Only update sections that correspond to actually changed files
3. When adding new modules, add them in the appropriate location in the directory tree and create a new section
4. Use absolute paths for file references
5. The document is UTF-8 encoded
6. When viewing files, prefer `rg` for text search and `cat` for single files; avoid full directory scans

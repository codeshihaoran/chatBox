---
name: review-logger
description: >
  Automatically log fixes, optimizations, and new features to the code review
  document. Use when Codex makes changes to the chatBox project involving bug
  fixes, optimizations, or new feature development.
---

# Review Logger Skill

## When to Use

Use this skill whenever you make changes to the chatBox project (C:\Users\shihaoran\projects\chatBox) that involve:
- Bug fixes (any severity level)
- Performance or UX optimizations
- New feature development
- Code refactoring
- Dependency or configuration changes

## What to Do

After completing the changes, log them to the review document at:
C:\Users\shihaoran\projects\chatBox\chatBox-review.md

## Logging Format

Append a new entry at the end of the review document using this format:

```
---
## P{next_id}. {category}({date})

### P{next_id}.{sub_id} [{severity}] {title}

**修复文件：** [file_path](/abs/path/file)

**问题描述：** One paragraph describing what the problem is.

**根因分析：** One paragraph explaining the root cause.

**修复方案：** Description of the fix approach, including code snippets where relevant:

```
// Before
old_code

// After
new_code
```

```

### Severity Levels
- CRITICAL - P0 issues: crashes, data loss, complete feature broken
- HIGH - P1 issues: major feature degradation, significant user experience impact
- MEDIUM - P2 issues: minor feature issues, moderate UX improvements
- LOW - P3 issues: cosmetic, nice-to-have improvements

### Category Examples
- 重大 BUG 修复记录
- 优化修复记录
- 新功能开发记录
- 代码重构记录
- 依赖配置更新

## Important Notes
1. Do NOT modify or delete existing entries in the review document
2. Always append new entries at the end of the file
3. Use absolute paths in file links
4. Keep descriptions concise but informative
5. Always include before/after code snippets where applicable

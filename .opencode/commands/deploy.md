---
description: Bump patch version, generate changelog, commit changes, and push to remote
---

Automated deploy workflow that generates a changelog, bumps the patch version, and commits changes.

## Workflow

### Step 1: Read Current Version

Extract the current version from package.json.

### Step 2: Analyze Uncommitted Changes

```bash
git diff --staged | grep -E '^\+|^\-' | head -30
git diff | grep -E '^\+|^\-' | head -30
```

Review all staged and unstaged changes to understand what will be included in this release.

### Step 3: Generate CHANGELOG.md

Create or update `CHANGELOG.md` at the project root. If the file exists, prepend the new entry. If it doesn't exist, create it.

Use this format:

```markdown
# Changelog

## v<NEW_VERSION> - <DATE>

### <Type>: <Description>

- <bullet point describing change>
- <bullet point describing change>
```

**Date format:** Human-readable English, e.g., `April 2, 2026`

**Example:**

```markdown
# Changelog

## v0.0.6 - April 2, 2026

### fix: make playwright non-fatal for dynamic sites

- Playwright failures no longer crash the entire scan
- Added helpful warning message when dynamic content is unavailable
- Fallback to static HTML when Playwright is not installed

## v0.0.5 - March 30, 2026

### fix: add sharedData fallback in active modules

- metadata, scripts, comments, social, phones, emails now fetch their own HTML if sharedData is unavailable
```

### Step 4: Bump Patch Version

Increment the patch version (e.g., 0.0.5 → 0.0.6) in:

- `package.json` (version field)
- `src/index.ts` (VERSION constant)

### Step 5: Stage All Changes

```bash
git add .
```

### Step 6: Generate Commit Message

Based on analyzed changes, determine type:

| Pattern                              | Type                | Emoji                |
| ------------------------------------ | ------------------- | -------------------- |
| `new file:` / creates component/page | feat                | `:tada:`             |
| `delete:` / removes file             | chore               | `:art:`              |
| `.tsx` / `.ts` changes               | feat, fix, refactor | context-based        |
| `package.json` / config              | chore               | `:art:`              |
| `.css` / styles                      | style               | `:lipstick:`         |
| `.md` / documentation                | docs                | `:book:`             |
| `test` / spec files                  | test                | `:white_check_mark:` |
| `ci` / github actions                | ci                  | `:green_heart:`      |

### Step 7: Create Commit

```bash
git commit -m ":rocket: <type>: <description> (v<new-version>)"
```

### Step 8: Push to Remote

```bash
git branch --show-current | xargs -I {} git push -u origin {}
```

Always push to the current branch (never hardcode branch name).

## Format

```
:rocket: <emoji>: <type>: <description> (v<new-version>)
```

## Rules

- Max 50 characters for description
- Imperative mood ("add" not "added")
- No period at end
- First letter lowercase
- Include affected feature/module name
- Include new version number in parentheses
- CHANGELOG.md date must be in human-readable English format

## Examples

- `:rocket: :tada: feat: add jssecrets module (v0.0.6)`
- `:rocket: :bug: fix: make playwright non-fatal (v0.0.7)`
- `:rocket: :book: docs: update README with playwright setup (v0.0.8)`

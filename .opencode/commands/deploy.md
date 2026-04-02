---
description: Bump patch version, commit changes, and push to remote
---

Automated deploy workflow that bumps the patch version and commits changes.

## Workflow

### Step 1: Read Current Version

Extract the current version from package.json.

### Step 2: Bump Patch Version

Increment the patch version (e.g., 0.0.5 → 0.0.6) in:

- `package.json` (version field)
- `src/index.ts` (VERSION constant)

### Step 3: Stage All Changes

```bash
git add .
```

### Step 4: Analyze Changes

```bash
git diff --staged | grep -E '^\+|^\-' | head -30
```

### Step 5: Generate Commit Message

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

### Step 6: Create Commit

```bash
git commit -m ":rocket: <type>: <description> (v<new-version>)"
```

### Step 7: Push to Remote

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

## Examples

- `:rocket: :tada: feat: add jssecrets module (v0.0.6)`
- `:rocket: :bug: fix: make playwright non-fatal (v0.0.7)`
- `:rocket: :book: docs: update README with playwright setup (v0.0.8)`

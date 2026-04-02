# AGENTS.md - xrecon Development Guide

## Project Overview

xrecon is an OSINT CLI tool for web reconnaissance - gather passive and active information about websites. Built with TypeScript, Node.js, and uses Playwright for browser automation.

## Build Commands

```bash
# Build the CLI (produces dist/index.cjs)
pnpm build

# Watch mode for development
pnpm dev

# Build and link locally for testing
pnpm preview
```

## Lint & Format Commands

```bash
# Run ESLint on all TypeScript files
pnpm lint

# Auto-fix ESLint issues
pnpm lint:fix

# Format all files with Prettier
pnpm format

# Check formatting without fixing
pnpm check
```

## Running Tests

```bash
# Run all tests with Vitest
pnpm vitest

# Run tests in watch mode
pnpm vitest --watch

# Run a single test file
pnpm vitest run src/path/to/test.spec.ts

# Run tests matching a pattern
pnpm vitest run --grep "pattern"
```

Note: No tests currently exist in this project. Vitest is configured and ready for test implementation.

## Code Style Guidelines

### Formatting (Prettier)

- Semi-colons: **enabled**
- Single quotes: **enabled**
- Print width: **100 characters**
- Tab width: **2 spaces**
- Trailing commas: **es5**
- Arrow function parens: **avoid** (only when unnecessary)

### TypeScript Configuration

- Target: ES2022
- Module: ESNext
- Module resolution: node
- **Strict mode: enabled**
- Path aliases: `@/*` maps to `src/*`

### ESLint Rules

- Unused variables: **error** (prefix with `_` to ignore, e.g., `_unused`)
- Explicit `any`: **warning** (avoid when possible)
- Console: **allowed** (no restrictions)

### Import Conventions

- Use path aliases: `import something from '@/modules/something'`
- Use type imports when possible: `import type { SomeType } from '@/types'`
- Group imports: external first, then path aliases, then relative

### Naming Conventions

- **Files**: kebab-case (e.g., `get-html.ts`, `whois.ts`)
- **Interfaces**: PascalCase with `Result` suffix for data types (e.g., `WhoisResult`, `GeoResult`)
- **Modules**: camelCase (e.g., `whois`, `getHtml`)
- **Constants**: UPPER_SNAKE_CASE for configuration values
- **Functions**: camelCase, verb-prefixed for actions (e.g., `normalizeUrl`, `validateDomain`)

### Error Handling

- Always return structured results via `ModuleResult<T>` interface
- Always include `success: boolean` and either `data` or `error`
- Use try-catch blocks around async operations
- Convert errors to strings: `error instanceof Error ? error.message : String(error)`
- Use appropriate timeout values (default 10s for HTTP requests)

### Type Definitions

All modules must implement either `PassiveModule` or `ActiveModule` interface:

```typescript
interface PassiveModule {
  name: string;
  run(target?: string): Promise<ModuleResult>;
}

interface ActiveModule {
  name: string;
  run(target?: string, sharedData?: SharedHtmlData): Promise<ModuleResult>;
}
```

### Module Structure

Passive modules (in `src/modules/passive/`):

- Export a named object implementing `PassiveModule`
- Run without browser/page context

Active modules (in `src/modules/active/`):

- Export a named object implementing `ActiveModule`
- Receive optional `SharedHtmlData` with parsed HTML, Cheerio, and optional Playwright context

### CLI Development

- Use Commander.js for CLI argument parsing
- Follow existing pattern for command options and flags
- Output JSON to stdout for programmatic consumption
- Use console.error for error messages

### Common Patterns

- Use `promisify` from 'util' for Node.js callback APIs
- Use `Promise.allSettled` for parallel operations where partial failures are acceptable
- Normalize URLs to https:// prefix
- Validate domain resolution before running modules

### Dependencies

- **Runtime**: axios, boxen, chalk, cheerio, commander, fuse.js, inquirer, ora, zod
- **Dev**: typescript, tsdown, vitest, eslint, prettier, playwright
- Skip bundling node modules in production build

## File Organization

```
src/
├── index.ts              # CLI entry point
├── types.ts              # Shared type definitions
├── commands/             # CLI command handlers
├── utils/
│   ├── get-html.ts       # HTML fetching utility
│   ├── output-cli.ts     # CLI output formatting
│   ├── output-html.ts    # HTML report generation
│   └── search.ts         # Module search functionality
└── modules/
    ├── passive/          # DNS, WHOIS, geo, subdomains, txt, mx (no HTTP needed)
    └── active/           # HTTP-based scanning modules (19 modules)
```

## Important Notes

- This is a CLI tool - avoid browser-dependent code unless explicitly needed
- Keep modules independent where possible
- Handle network failures gracefully - don't crash entire scan
- Use type-safe approaches - avoid `any` when possible
- Only publish `dist/` directory to npm (configured via `files` in package.json)
- pnpm version must be consistent: `10.18.1` (in package.json and GitHub workflows)

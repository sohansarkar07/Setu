# Contributing to Setu v2

Thank you for your interest in contributing to Setu — the production-grade RWA invoice financing protocol on Stellar Soroban!

## 📋 Table of Contents
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Convention](#commit-convention)
- [Smart Contract Guidelines](#smart-contract-guidelines)
- [Frontend Guidelines](#frontend-guidelines)
- [Pull Request Process](#pull-request-process)

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Set up** your `.env.local`:
   ```env
   NEXT_PUBLIC_INVOICE_CONTRACT_ID=<contract_id>
   NEXT_PUBLIC_TOKEN_CONTRACT_ID=<token_id>
   GROQ_API_KEY=<your_groq_key>
   ```
5. **Run** the dev server: `npm run dev`

## Development Workflow

- Always branch off `main`
- Branch naming: `feat/feature-name`, `fix/bug-name`, `docs/doc-update`
- Keep PRs focused and small — one feature or fix per PR

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scope): add new feature
fix(scope): fix a bug
docs(scope): update documentation
chore(scope): housekeeping task
refactor(scope): code refactor without feature change
test(scope): add or update tests
ci(scope): CI/CD changes
```

## Smart Contract Guidelines

- All Soroban contracts are in `contracts/`
- Run tests before pushing: `cargo test --lib`
- Never use `unwrap()` in production contract code — use `expect()` with clear messages
- All new contract functions must have at least one unit test

## Frontend Guidelines

- All pages live in `app/app/`
- Use the shared design tokens from `globals.css` (CSS variables like `--neon-cyan`)
- New components go in `components/`
- Utility functions go in `lib/`
- Hooks go in `lib/hooks/`
- Always add `aria-label` to interactive elements for accessibility

## Pull Request Process

1. Ensure all CI checks pass (build + lint + contract tests)
2. Update the README if adding a new feature
3. Include screenshots for UI changes
4. Get at least one approval before merging

---

Questions? Open an [issue](https://github.com/sohansarkar07/Setu/issues) or reach out on GitHub.

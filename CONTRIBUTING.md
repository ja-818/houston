# Contributing to Houston

Thanks for your interest in contributing to Houston!

## Getting Started

```bash
git clone https://github.com/ja-818/houston.git
cd houston
pnpm install
cargo check --workspace
```

## Development

```bash
# Run the Houston app
cd app && pnpm tauri dev

# Run the showcase
cd showcase && pnpm dev

# TypeScript check
pnpm typecheck

# Rust check
cargo check --workspace

# Rust tests
cargo test --workspace
```

## Structure

- `ui/` — React packages (@houston-ai/*)
- `engine/` — Rust crates (houston-*)
- `app/` — The Houston desktop app
- `showcase/` — Component showcase
- `create-app/` — Experience scaffolding CLI

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Run `pnpm typecheck` and `cargo check --workspace`
4. Open a PR to `main`

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `chore:` — Maintenance
- `refactor:` — Code restructuring

## Code Style

- 200 line file limit (excluding tests)
- No hover-only affordances
- Props over stores in library packages
- No `@/` path aliases in packages

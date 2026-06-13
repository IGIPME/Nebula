# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nebula is an EDA platform for micro/nano photonic device design, providing a React + Rust project scaffolding system with integrated simulation support (Meep, ANSYS Lumerical).

## Build, Test, and Development Commands

### Rust Backend

```bash
# Build entire workspace
cargo build

# Build specific crate
cargo build -p nebula-ffi

# Run all tests
cargo test

# Run tests for a specific crate
cargo test -p nebula-core
cargo test -p nebula-cli
cargo test -p nebula-ffi

# Format check
cargo fmt --all -- --check

# Lint (clippy)
cargo clippy --all-targets

# Lint a specific crate with warnings as errors
cargo clippy -p nebula-core -- -D warnings

# Start the backend server (binds to NEBULA_SERVER_ADDR, default 127.0.0.1:3030)
cargo run -p nebula-ffi
```

### Frontend (src/nebula)

```bash
cd src/nebula

pnpm install          # Install dependencies
pnpm dev              # Start Vite dev server
pnpm build            # TypeScript check + Vite production build
pnpm lint             # ESLint
pnpm exec tsc -b      # TypeScript type check only
```

### Docker (Development)

```bash
docker compose build
docker compose up -d
docker compose logs -f
docker compose down
```

### Docker (Production)

```bash
# Pull and deploy
docker compose -f docker-compose.production.yml --env-file .env pull
docker compose -f docker-compose.production.yml --env-file .env up -d

# Build & push to Tencent Cloud TCR
./scripts/build.sh              # Push latest + date tag
TAG=20260613 ./scripts/build.sh # Push specific tag only

# Deploy from CDN
./scripts/deploy.sh             # Deploy
./scripts/deploy.sh --update    # Re-download config from CDN then deploy
./scripts/deploy.sh --down      # Stop and remove containers
```

## Architecture

### Rust Workspace (3 crates, edition 2024, Rust 1.95+)

```
Cargo.toml (workspace)
├── nebula-core  (src/crates/core)   — Template engine, shared logic
├── nebula-cli   (src/crates/cli)    — CLI tool (`nebulacli template init/list`)
└── nebula-ffi   (src/crates/ffi)    — Axum HTTP server + cdylib for FFI
```

**`nebula-core`** is the heart of the system. It embeds the `templates/` directory at compile time via `include_dir!`, parses per-template `template.toml` metadata, and renders projects using the Tera template engine. It handles:
- Template discovery and metadata parsing
- Variable normalization: kebab-case (`project-name`) and snake_case (`project_name`) are treated as aliases
- Path traversal protection (rejects `..`, absolute paths in rendered output)
- Overwrite modes: `Fail`, `Overwrite`, `Skip`
- Dry-run mode that reports what would be created without writing

**`nebula-cli`** wraps `nebula-core` behind a Clap CLI. Interactive mode prompts for missing required variables; `--non-interactive` mode errors instead.

**`nebula-ffi`** is an Axum server (`nebula-server` binary) with 3 endpoints:
- `GET /health`
- `GET /api/templates` — list available templates
- `GET /api/templates/{name}` — get template metadata + variable definitions
- `POST /api/projects` — scaffold a new project (supports dry-run, overwrite modes)

The `lib.rs` also exports `app()` for FFI use; the crate builds as both `rlib` and `cdylib`. CORS is configured to allow `localhost:5173` (Vite dev server).

### Frontend (src/nebula)

React 19 + TypeScript 6 + Vite 8 + MUI 9. SPA that talks to the Rust backend. Key structure:
- `src/api/client.ts` — Axios instance, reads `VITE_API_BASE_URL` env var
- `src/api/templates.ts` / `projects.ts` — typed API calls
- `src/api/types.ts` — shared TypeScript interfaces matching backend DTOs
- `src/components/TemplateSelector.tsx` — template picker
- `src/components/ProjectCreateForm.tsx` — variable form with dry-run toggle, overwrite mode selector
- `src/components/ScaffoldResult.tsx` — displays created/skipped files

In production, nginx serves the built frontend and reverse-proxies `/api/` and `/health` to the Rust backend.

### Templates

Templates live in `templates/<name>/` and are embedded into `nebula-core` at compile time. Each template has:
- `template.toml` — metadata (name, description, version) + variable definitions (prompt, default)
- `{{project-name}}/` — the template directory whose name is rendered from variables
- Files within may use `{{ variable }}` Tera syntax; variable names with hyphens are auto-normalized to underscores for Tera compatibility

### Python Simulation Environments

- **`src/python/mpmcp/`** — Meep FDTD simulation. Dockerized Ubuntu 22.04 + Miniconda + pymeep. The container runs `sleep infinity` and is used as an execution environment for Meep scripts.
- **`src/python/lummcp/`** — ANSYS Lumerical integration placeholder (Python 3.14, gRPC-based).

### CI/CD

GitHub Actions (`.github/workflows/ci.yml`):
- Triggers on push/PR to `master`
- Rust: fmt check (nebula-core only), clippy, and test for all 3 crates (matrix build)
- Frontend: pnpm install → lint → type check → build

### Key Conventions

- Rust edition 2024, max line width 100, use `clang` + `lld` as linker on Linux
- Cargo workspace resolver v2
- Template variables use kebab-case (`project-name`); code auto-aliases `_` and `-` forms
- Error messages and UI are in Simplified Chinese
- Docker images push to Tencent Cloud TCR (`ccr.ccs.tencentyun.com/igipme.nebula/`)

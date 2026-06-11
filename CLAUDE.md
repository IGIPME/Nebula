# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Nebula is an EDA platform for micro/nano photonic device and system design. The repository currently combines:

- A Rust workspace for core template scaffolding logic, a CLI, and an Axum HTTP server.
- A React + TypeScript + Vite frontend that talks to the local Axum server.
- A small Python package placeholder under `src/python/lummcp`.

The README states that Simplified Chinese is the primary language for Nebula i18n; existing user-facing strings and many Rust comments/errors are Chinese.

## Common commands

### Rust workspace

Run from the repository root:

```bash
cargo build
cargo test
cargo test -p nebula-core
cargo test -p nebula-cli
cargo test -p nebula-ffi
cargo test <test_name>
cargo fmt --all
cargo clippy --workspace --all-targets --all-features
```

Useful binaries:

```bash
cargo run -p nebula-cli -- template list
cargo run -p nebula-cli -- template init pic-design --name MyProject --output /tmp --author Alice --dry-run
cargo run -p nebula-ffi --bin nebula-server
NEBULA_SERVER_ADDR=127.0.0.1:3030 cargo run -p nebula-ffi --bin nebula-server
```

The Rust build uses `.cargo/config.toml`, which sets `clang`/`lld` for `x86_64-unknown-linux-gnu` and exposes `CARGO_WORKSPACE_DIR` for embedding templates.

### Frontend (`src/nebula`)

Run from `src/nebula`:

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm preview
```

Frontend development expects the Rust server at `http://127.0.0.1:3030`; `vite.config.ts` proxies `/api` and `/health` to that backend. For a different backend URL in browser code, set `VITE_API_BASE_URL`.

### Python package (`src/python/lummcp`)

The package metadata requires Python `>=3.14` and has no dependencies yet. There are currently no Python test/build scripts declared.

## Architecture

### Rust crates

The root `Cargo.toml` is a workspace with three members:

- `src/crates/core` (`nebula-core`): shared template engine. It embeds the repository `templates/` directory at compile time with `include_dir`, reads each template's `template.toml`, builds a Tera context, renders paths and text file contents, validates rendered relative paths, and writes scaffolded projects according to `OverwriteMode` (`Fail`, `Overwrite`, `Skip`) and `dry_run`.
- `src/crates/cli` (`nebula-cli`): clap-based command-line wrapper around `nebula-core`. Current commands are `template list` and `template init`. CLI variable handling uses `insert_variable` so dashed and underscored aliases such as `project-name`/`project_name` stay consistent.
- `src/crates/ffi` (`nebula-ffi`): Axum HTTP interface around the same core template functions. Despite the crate name, it currently exposes an HTTP server binary named `nebula-server` plus an `app()` router for tests.

Important backend routes in `nebula-ffi`:

- `GET /health`
- `GET /api/templates`
- `GET /api/templates/{template_name}`
- `POST /api/projects`

`POST /api/projects` accepts camelCase JSON matching the frontend types: `templateName`, `outputBase`, `variables`, `overwrite` (`fail`/`overwrite`/`skip`), and `dryRun`.

### Template system

Templates live under `templates/<template-name>/`. Each template has a `template.toml` metadata file and arbitrary files/directories to render. The current template is `pic-design`.

Template variable names may contain hyphens. The core normalizes aliases so templates and callers can use both hyphenated and underscored forms. For path-like variables (`project-name`, `*_name`, `*-name`), values are rejected if empty, `.`/`..`, or containing path separators. Rendered template paths must remain relative and cannot contain `..`.

Because templates are embedded into the Rust binary at compile time, changes under `templates/` require rebuilding/rerunning Rust binaries before the CLI/server sees them.

### Frontend

The frontend is in `src/nebula` and uses React 19, TypeScript, Vite, MUI, and axios.

- `src/api/*` defines the axios client and TypeScript request/response types for the Rust server.
- `App.tsx` loads template summaries, fetches selected template metadata, and submits scaffold requests.
- `components/TemplateSelector.tsx`, `ProjectCreateForm.tsx`, and `ScaffoldResult.tsx` implement the project scaffolding UI.

The form defaults to dry-run mode. The default output directory is currently hard-coded in `ProjectCreateForm.tsx`.

## Repository notes

- Generated/build artifacts are ignored by `.gitignore`: Rust `target/`, frontend `node_modules/`, frontend `dist/`, TypeScript build info, Python caches, and env files.
- No Cursor rules (`.cursor/rules` or `.cursorrules`) or GitHub Copilot instructions were present when this file was created.
- The nested `src/nebula/README.md` is the default Vite template README; prefer the root `README.md` for project intent.

 常用命令

  # 启动
  sg docker -c "docker compose up -d"

  # 查看状态
  sg docker -c "docker compose ps"

  # 查看日志
  sg docker -c "docker compose logs -f"

  # 重建（源码修改后）
  sg docker -c "docker compose build --no-cache && docker compose up -d"

  # 停止
  sg docker -c "docker compose down"
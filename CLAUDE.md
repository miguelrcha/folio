# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Updated: 2026-07-08
> This file is the index. Always-on rules live in the imported `@AGENTS.md`
> (architecture, data model, non-negotiables). Everything below is this repo's
> commands and working notes. `CONTRIBUTING.md` has the full contributor workflow.

@AGENTS.md

# Folio

Turns a GitHub profile into a public portfolio/resume site (`folio.dev/{username}`), built with Next.js + Supabase. See AGENTS.md above for the full rundown of the data model, editable-section pattern, and CV export approach.

## Commands

- `npm run dev` — start the dev server (Next.js + Turbopack).
- `npm run build` — production build. Use this to catch type/build errors; there is no separate `tsc` step wired up.
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, extends `eslint-config-next`).
- `npm test` — Vitest (jsdom) + React Testing Library; `npm run test:watch` for the watch loop. Config in `vitest.config.ts`, setup in `vitest.setup.ts`. Coverage is thin (unit-level: pure `lib/` helpers and component renders); Next runtime code (server components, route handlers) is out of scope — extract logic to test it. Still verify UI/print changes by rendering the affected page (see the print/PDF note below).

## Environment & infrastructure

Required env vars (see `.env.example` for the committed template):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — client/server Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` — service-role client (`lib/supabase/admin.ts`), **bypasses RLS**; used only in no-session contexts like the cron job. Never use it in a route that responds to a visitor.
- `TOKEN_ENCRYPTION_KEY` — 32-byte base64 key (`openssl rand -base64 32`) for AES-256-GCM encryption of the GitHub access token (`lib/crypto.ts`, format `iv:authTag:ciphertext`).
- `CRON_SECRET` — Vercel injects it as a `Bearer` auth header; `/api/cron/sync-all` rejects requests that don't match.

Three Supabase clients, pick by context:
- `lib/supabase/client.ts` — browser client, used by all `Edit*Modal.tsx` for direct client-side mutations.
- `lib/supabase/server.ts` — SSR client (cookies), for server components / route handlers acting as the signed-in user.
- `lib/supabase/admin.ts` — service-role, RLS-bypassing (see above).

Sync flow: `/api/sync-github` (interactive, on connect) and `/api/cron/sync-all` (daily 03:00 UTC via `vercel.json`, over all profiles) both call `syncGithubProfile` in `lib/github-sync.ts`, which fetches repos/languages, parses stack icons from the profile README, and generates a deterministic (username-hashed, no AI) profile summary.

## Layout

- `app/` — routes. Public profile is `app/[username]/page.tsx`; auth via `app/login`, `app/auth/callback`, `app/connect`; API under `app/api/`.
- `components/` — UI, including the `Edit*Modal.tsx` editable-section family and the print-only `ResumeDocument.tsx`.
- `lib/` — data/domain helpers (`profile.ts`, `experience.ts`, `certification.ts`, `language.ts`), `github-sync.ts`, `crypto.ts`, `resume/` (docx/pdf generation via `docx` + `jspdf`), and `supabase/`.

## Working notes specific to this repo

- No headless-browser/PDF tooling is installed. To visually check print/PDF output (e.g. the CV), render with a locally installed Chromium-based browser in headless mode (`--headless=new --print-to-pdf=...` or `--screenshot=...`), then inspect the result — don't assume print CSS looks right without actually rendering it.
- DB schema changes can't be applied from here (no Supabase CLI/migration setup, no direct Postgres connection) — always hand the user the exact SQL to run themselves, then verify the change against the DB via the Supabase JS client before building on top of it. Remember `public_profiles` is a hand-allowlisted view: adding a public field means re-running `CREATE OR REPLACE VIEW ... AS SELECT ...` with the existing column order preserved and new columns appended (reordering throws Postgres `42P16`).
- **Controlled, issue-driven workflow — see `CONTRIBUTING.md`.** Nothing lands on `main` directly: work happens on a `<type>/<issue#>-<slug>` branch and merges via PR. Commits are atomic and use the emoji-prefixed Conventional Commits convention (`✨ feat:`, `🐛 fix:`, `🚧 chore:`, `✅ test:`, `✏️ docs:`). `npm run build`, `npm run lint`, and `npm test` must pass before a PR.
- **Do not push or open PRs on your own.** Never push to `origin/main`. Create commits on a feature branch only, and push / open the PR only when the maintainer explicitly asks. Commits should end with a `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` trailer.
- **English-only repository.** All code, comments, UI strings, commits and docs are in English — never mix languages within a file. (Note: some existing UI strings and comments are still in Portuguese; treat that as tech debt to fix via issues, not a pattern to follow.)

## Maintenance

Keep these docs honest as the project grows — but don't add rules speculatively. A
new rule earns its place in `AGENTS.md` only after it has actually bitten once. When
you establish a real pattern or fix a significant gotcha, record it in the right
section and bump the `Updated:` date above.

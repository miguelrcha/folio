<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# About this project

Folio turns a GitHub profile into a public portfolio/resume site. A user signs in with GitHub OAuth, `/api/sync-github` pulls their repos, per-repo languages, and stack icons parsed out of their `github.com/{user}/{user}` profile README (skillicons.dev, shields.io badges, devicon/simple-icons `<img>` tags), and aggregates all of it into a profile at `folio.dev/{username}`.

**Stack:** Next.js (Turbopack), React 19, TypeScript, Tailwind CSS v4 (CSS-first theme in `app/globals.css` via `@theme inline` — there is no `tailwind.config.js`), Supabase (Postgres + GitHub OAuth). Fonts (Inter, JetBrains Mono) are loaded via `next/font/google` in `app/layout.tsx`.

**Data model:**
- `profiles` — full row, includes the encrypted `github_access_token`. Never query this table for anything rendered to a visitor.
- `public_profiles` — a Postgres **view** with a hand-picked column allowlist (not `SELECT *`), used for anything public-facing. It does **not** auto-adopt new columns added to `profiles`. When a new profile field needs to be public, it must be added by re-running `CREATE OR REPLACE VIEW public_profiles AS SELECT ... FROM profiles;` with the *same column order as before*, appending new columns at the end — reordering existing columns throws Postgres error `42P16`.
- `repos` — one row per GitHub repo, including an `is_selected` flag the owner uses to curate which projects show up on their profile.
- There is no Supabase CLI/migration tooling wired into this repo. Schema changes (new columns, view updates) have to be run manually by the project owner in the Supabase SQL Editor — there's no way to apply them from the codebase or CI.

**Editable sections** (Overview, Experiences, Stacks, Certifications, Languages, Projects) all follow one convention: a small pencil-icon button opens a dark modal (`components/Edit*Modal.tsx`), which mutates Supabase directly from the client (`createClient()` from `@/lib/supabase/client`, no server actions/API routes for edits) and calls `router.refresh()` on save. Structured repeatable-entry sections (Experiences, Certifications) share the same add/remove-entry shape; Stacks and Languages use tag/dropdown pickers instead.

**CV export:** the "View CV" button just calls `window.print()` against a dedicated print-only component (`components/ResumeDocument.tsx`, `hidden print:block`), styled to fit a single A4 page (`@page` rule in `app/globals.css`). There's no server-side PDF rendering (no puppeteer/headless-chromium) — deliberately, to keep the project deployable as a plain Next.js app.

**Commit convention:** emoji-prefixed Conventional Commits in English — `✨ feat:`, `🐛 fix:`, `🚧 chore:`, `✅ test:`, `✏️ docs:`.

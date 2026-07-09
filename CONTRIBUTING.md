# Contributing to Folio

This project follows a controlled, issue-driven workflow. Nothing lands on `main`
directly — every change goes through a branch and a pull request.

> Language: this repository is English-only. Code, comments, UI strings, commit
> messages, and docs must all be in English. Do not mix languages within a file.

## Local setup

1. `npm install`
2. Copy the env template and fill it in: `cp .env.example .env.local`
   (Next.js reads `.env.local`; the values come from the Supabase project — see
   `.env.example` for what each one is).
3. `npm run dev` and open http://localhost:3000

There is no local database to run — the app talks to a hosted Supabase project.
GitHub OAuth is configured inside Supabase, not via env vars.

## Project structure

- `app/` — routes (pages + API handlers). Public profile is `app/[username]/`;
  auth/onboarding in `app/login`, `app/auth/callback`, `app/connect`.
- `components/` — UI, including the `Edit*Modal.tsx` editable sections and the
  print-only `ResumeDocument.tsx`.
- `lib/` — domain logic: `github-sync.ts` (the sync engine), `crypto.ts`, the
  `resume/` CV generators, and `supabase/` (the browser/server/admin clients).

See `AGENTS.md` for the full architecture and the data-model notes.

## Workflow: issue → branch → PR

1. **Start from an issue.** Every change should map to a GitHub issue. If one
   doesn't exist yet, open it first and describe the problem/scope.
2. **Branch off `main`**, one branch per issue. Name it `<type>/<issue#>-<slug>`:
   - `fix/123-pinned-header`
   - `feat/145-linkedin-import`
   - `docs/150-contributing-guide`
   - `chore/160-bump-next`
3. **Keep the branch focused.** One issue's worth of work — don't bundle
   unrelated changes into the same branch.
4. **Open a PR** back into `main` and link the issue (`Closes #123`). Merging to
   `main` happens through the PR, not by pushing to `main`.

## Commits

Atomic and Conventional-Commits style, with the repo's emoji prefixes, in English:

- `✨ feat:` new feature
- `🐛 fix:` bug fix
- `🚧 chore:` tooling / maintenance
- `✅ test:` tests
- `✏️ docs:` documentation

Rules:
- **One responsibility per commit.** Split `feat` / `fix` / `docs` / `chore` into
  separate commits rather than one mixed commit.
- Imperative mood, lowercase after the prefix, no trailing period, keep the
  subject line short (≤ ~72 chars).

## Testing

Tests run on [Vitest](https://vitest.dev) with React Testing Library (jsdom):

- `npm test` — run the suite once (used in CI / before a PR).
- `npm run test:watch` — re-run on change while developing.

Test files live next to the code they cover, named `*.test.ts` / `*.test.tsx`.
Config is in `vitest.config.ts`; shared setup (jest-dom matchers, cleanup) is in
`vitest.setup.ts`. The `@/` import alias works the same as in the app.

Vitest bundles with Vite, not Next/Turbopack, so it covers pure `lib/` helpers and
React components. Anything that needs Next's runtime (server components, route
handlers) is out of scope — extract the logic into a testable function and test
that instead. Coverage is still thin; new PRs should add tests for the logic they
touch.

## Before opening a PR

The bar before a PR is:

- `npm run build` passes (this is also the type/build check — there's no separate
  `tsc` step).
- `npm run lint` passes.
- `npm test` passes.
- If the change affects print/PDF output (the CV), render it and check visually —
  print CSS is not exercised by the build.
- If the change touches the DB schema, include the exact SQL in the PR description
  (schema changes are applied manually in the Supabase SQL Editor — there's no
  migration tooling wired into the repo).

## Pushing

Do **not** push to `origin/main`. Push your feature branch and open a PR. Automated
tools/agents working in this repo must not push or open PRs on their own — only
when the maintainer explicitly asks.

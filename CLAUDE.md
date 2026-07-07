@AGENTS.md

# Folio

Turns a GitHub profile into a public portfolio/resume site (`folio.dev/{username}`), built with Next.js + Supabase. See AGENTS.md above for the full rundown of the data model, editable-section pattern, and CV export approach.

A few things specific to working with Claude Code on this repo:
- No headless-browser/PDF tooling is installed. To visually check print/PDF output (e.g. the CV), render with a locally installed Chromium-based browser in headless mode (`--headless=new --print-to-pdf=...` or `--screenshot=...`), then inspect the result — don't assume print CSS looks right without actually rendering it.
- DB schema changes can't be applied from here (no Supabase CLI/migration setup, no direct Postgres connection) — always hand the user the exact SQL to run themselves, then verify the change against the DB via the Supabase JS client before building on top of it.
- Commits should end with a `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` trailer, and should be pushed to `origin/main` right after committing, without needing to be asked each time.

# PartsPro - GIT_BASELINE.md

## Current Local Git State

Date: 2026-05-24

```txt
Branch: main
Commits: none yet
Remote origin: not configured
Git user.name: not configured
Git user.email: not configured
Staged baseline candidate: 153 files
```

## Pre-Commit Safety Check

Checked before preparing the baseline:

- `.env`, `.env.local`, `.next`, `node_modules`, `.DS_Store`, and `next-env.d.ts` are ignored.
- `.env.example` is intentionally tracked and contains placeholders only.
- No real Supabase service role key, Vercel token, private key, or OpenAI-style secret key was found in tracked project files.
- Local test admin credentials are documented for development only and must be changed before production.

## Suggested First Commit

After setting a local Git identity:

```bash
git config user.name "Your Name"
git config user.email "you@example.com"
git commit -m "chore: initialize PartsPro baseline"
```

## Suggested Remote Setup

After creating the GitHub repository:

```bash
git remote add origin git@github.com:<owner>/partspro-v3.git
git push -u origin main
```

Do not push until `npm run lint` and `npm run build` both pass.

Current verification:

```txt
npm run lint: passed
npm run build: passed
```

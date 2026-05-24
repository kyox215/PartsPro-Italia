# PartsPro - DEPLOYMENT.md

## 1. GitHub

Recommended repository name:

```txt
partspro-v3
```

Initial publish flow:

```bash
git remote add origin git@github.com:<owner>/partspro-v3.git
git add .
git commit -m "chore: prepare PartsPro deployment"
git push -u origin main
```

## 2. Vercel

Import the GitHub repository into Vercel.

Settings:

```txt
Framework Preset: Next.js
Install Command: npm ci
Build Command: npm run build
Output Directory: .next
Production Branch: main
```

The repository includes `vercel.json` so Vercel can use the same install and build commands consistently.

## 3. Environment Variables

Configure these values in Vercel Project Settings for Production, Preview, and Development as needed.

| Key | Scope | Required | Notes |
|---|---|---:|---|
| `NEXT_PUBLIC_SITE_URL` | Browser/server | yes | Production URL, for example `https://partspro.vercel.app` or the custom domain. |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser/server | yes | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser/server | yes | Preferred public key for browser and server SSR clients. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/server | fallback | Keep only if the project still uses legacy anon keys. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | later | Do not expose to client code. Add only when admin server-only operations require it. |

Never commit real `.env`, `.env.local`, Vercel tokens, or Supabase service role keys.

## 4. Domain

After the production deployment is healthy:

1. Add the domain in Vercel Project Settings.
2. Point DNS to Vercel using the records Vercel provides.
3. Update `NEXT_PUBLIC_SITE_URL` to the final HTTPS domain.
4. Redeploy production.

## 5. Verification

Before pushing:

```bash
npm run lint
npm run build
```

After deployment:

```txt
/it
/en
/zh
/sitemap.xml
/robots.txt
```

Also verify Supabase Auth callback URLs include:

```txt
https://<production-domain>/it/auth/callback
https://<production-domain>/en/auth/callback
https://<production-domain>/zh/auth/callback
```

## 6. Current External Blockers

Local deployment readiness is complete, but production publishing still needs external authorization:

- No GitHub `origin` remote is configured in this checkout.
- The local `gh` CLI is not installed.
- The local Vercel CLI token is invalid.
- Uploading this workspace through the Vercel connector requires explicit approval because it sends project files to Vercel.

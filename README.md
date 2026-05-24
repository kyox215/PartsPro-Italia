# PartsPro

PartsPro 基础框架项目，使用 Next.js App Router 与 TypeScript 搭建。当前仓库包含项目骨架、基础 UI 系统、初始 Supabase schema、Auth 基础流、静态商品浏览流程、后台静态运营台，以及部署准备配置。

## Tech Stack

- Next.js 16
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI
- Supabase
- TanStack Table
- React Hook Form
- Zod
- Framer Motion
- Lucide React

## Project Structure

```text
src/app/[locale]
src/components/ui
src/components/layout
src/components/product
src/components/admin
src/components/forms
src/components/search
src/components/cart
src/components/b2b
src/components/charts
src/lib/supabase
src/lib/validations
src/messages
src/types
supabase/migrations
```

## Development

```bash
npm run dev
npm run lint
npm run build
npm run db:lint
npm run db:reset
```

The localized shell is available at `/it`, `/en`, and `/zh`. The root route redirects to `/it`.

## Deployment

Deployment readiness files:

- `vercel.json`
- `.github/workflows/ci.yml`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `DEPLOYMENT.md`
- `LIGHTHOUSE_REPORT.md`
- `GIT_BASELINE.md`

See `DEPLOYMENT.md` for the GitHub, Vercel, Supabase ENV, and custom domain checklist.

## Environment

Supabase helpers expect these variables when they are used:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=
```

## Current Scope

Tasks 01-10 are scaffolded: framework setup, modern design-system primitives, the initial Supabase schema/seed baseline, the Auth route/session guard foundation, the localized storefront home page, a static product catalog flow, a protected static admin dashboard, a lightweight motion system, deployment readiness, and the first UI acceptance repair pass. Real dashboard CRUD writes and commerce API behavior are intentionally not implemented yet.

Auth routes are available under each locale:

- `/it/login`, `/en/login`, `/zh/login`
- `/it/register`, `/en/register`, `/zh/register`
- `/it/account`, `/en/account`, `/zh/account`
- `/it/admin`, `/en/admin`, `/zh/admin`

Storefront home routes are available at `/it`, `/en`, and `/zh`.

Product browsing routes are available under each locale:

- `/it/products`, `/en/products`, `/zh/products`
- `/it/search`, `/en/search`, `/zh/search`
- `/it/category/[slug]`, `/en/category/[slug]`, `/zh/category/[slug]`
- `/it/brand/[slug]`, `/en/brand/[slug]`, `/zh/brand/[slug]`
- `/it/product/[slug]`, `/en/product/[slug]`, `/zh/product/[slug]`

Admin routes are protected by the backoffice role guard:

- `/it/admin`, `/en/admin`, `/zh/admin`
- `/it/admin/products`, `/en/admin/products`, `/zh/admin/products`
- `/it/admin/orders`, `/en/admin/orders`, `/zh/admin/orders`
- `/it/admin/customers`, `/en/admin/customers`, `/zh/admin/customers`
- `/it/admin/inventory`, `/en/admin/inventory`, `/zh/admin/inventory`

## Database

Supabase schema files live in `supabase/`.

- `supabase/migrations/*` contains versioned schema migrations.
- `supabase/seed.sql` contains local development seed data only.
- The local admin user documented in `SEED_DATA.md` must be created through Supabase Auth locally; weak test credentials are not seeded into production migrations.

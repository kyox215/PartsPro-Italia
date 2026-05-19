# PartsPro Italia

Self-hosted MVP for an Italy-focused phone repair parts supplier.

The app is built for:

- B2B-first catalog and pricing
- B2C-compatible checkout
- Italian and Chinese UI routes (`/it`, `/zh`)
- Supabase Auth/Postgres/Storage architecture
- Email/password and Google OAuth login entry
- Supabase CLI config in `supabase/config.toml`
- Stripe checkout and bank transfer orders
- Vercel Git deployments from GitHub
- Internal admin shell at `/admin` or `/{locale}/admin`
- Supabase SSR auth with cookie sessions
- Role-aware navigation and post-login redirects
- Admin product/SKU creation shell at `/{locale}/admin/products`
- Admin order, B2B approval, and RMA status workflows
- Admin order/RMA detail pages with fulfillment and return-to-detail status updates
- Admin system health dashboard for environment and Supabase table checks
- Customer account workspace with own orders, totals, RMA activity, and detail pages
- Customer company profile editor for invoice and B2B data

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The root route redirects to `/it`. Chinese UI is available at `/zh`.

## Environment

Copy the example file for local development:

```bash
cp .env.example .env.local
```

Fill in Supabase and Stripe values when ready. The app still builds without secrets so GitHub/Vercel bootstrap is not blocked.

## Scripts

```bash
npm run lint
npm run typecheck
npm run build
```

## Main Routes

- `/it`, `/zh`
- `/it/products`
- `/it/products/[slug]`
- `/it/cart`
- `/it/checkout`
- `/it/b2b`
- `/it/rma`
- `/it/account`
- `/it/account/orders`
- `/it/account/orders/[orderId]`
- `/it/account/rma`
- `/it/account/rma/[rmaId]`
- `/it/account/company`
- `/it/admin`
- `/it/admin/inventory`
- `/it/admin/products`
- `/it/admin/orders`
- `/it/admin/orders/[orderId]`
- `/it/admin/b2b`
- `/it/admin/rma`
- `/it/admin/rma/[rmaId]`
- `/it/admin/system`
- `/it/login`
- `/api/orders`
- `/api/account/company`
- `/api/admin/products`
- `/api/admin/inventory/import-cart`
- `/api/admin/inventory/receive`
- `/api/admin/inventory/settings`
- `/api/admin/orders/status`
- `/api/admin/b2b/status`
- `/api/admin/rma/status`
- `/api/admin/health`
- `/api/auth/callback`
- `/api/auth/oauth/google`
- `/api/auth/sign-in`
- `/api/auth/sign-up`
- `/api/auth/sign-out`
- `/api/b2b-applications`
- `/api/rma`
- `/api/stripe/webhook`

## Database

Initial Supabase schema:

```text
supabase/migrations/0001_initial_schema.sql
```

Optional seed data:

```text
supabase/seed.sql
```

## Deploy on Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the GitHub + Vercel setup flow.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

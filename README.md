# PartsPro Italia

Self-hosted MVP for an Italy-focused phone repair parts supplier.

The app is built for:

- B2B-first catalog and pricing
- B2C-compatible checkout
- Italian and Chinese UI routes (`/it`, `/zh`)
- Supabase Auth/Postgres/Storage architecture
- Stripe checkout and bank transfer orders
- Vercel Git deployments from GitHub
- Internal admin shell at `/admin` or `/{locale}/admin`

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
- `/it/admin`
- `/api/orders`
- `/api/b2b-applications`
- `/api/rma`
- `/api/stripe/webhook`
- `/api/admin/health`

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

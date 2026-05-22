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
- Supabase SSR auth with cookie sessions
- Account navigation and post-login redirects
- Customer account workspace with own orders, totals, and detail pages
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
- `/it/account`
- `/it/account/orders`
- `/it/account/orders/[orderId]`
- `/it/account/company`
- `/it/login`
- `/api/orders`
- `/api/account/company`
- `/api/auth/callback`
- `/api/auth/oauth/google`
- `/api/auth/sign-in`
- `/api/auth/sign-up`
- `/api/auth/sign-out`
- `/api/stripe/webhook`

## Database

The previous Supabase schema and seed migrations were intentionally removed during the rebuild reset. New database migrations should be created from the next backend design.

## Deploy on Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the GitHub + Vercel setup flow.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

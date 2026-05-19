# GitHub + Vercel Deployment

This project is designed for a private GitHub repository connected to Vercel Git deployments.

## 1. First GitHub Push

Create a private GitHub repository named `phone-parts-b2b-italy`, then run:

```bash
git remote add origin git@github.com:<your-user-or-org>/phone-parts-b2b-italy.git
git push -u origin main
```

If you use HTTPS instead of SSH:

```bash
git remote add origin https://github.com/<your-user-or-org>/phone-parts-b2b-italy.git
git push -u origin main
```

## 2. Vercel Git Integration

1. Open Vercel Dashboard.
2. Import the GitHub repository.
3. Keep the framework preset as Next.js.
4. Production branch: `main`.
5. Vercel will create Preview deployments for non-production branches.

## 3. Environment Variables

Set these in Vercel Project Settings > Environment Variables for Production, Preview, and Development as needed:

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
ADMIN_EMAIL
```

Never commit `.env.local` or secret values. Use `.env.example` only as the public checklist.

## 4. Supabase Setup

1. Create a Supabase project.
2. Apply `supabase/migrations/0001_initial_schema.sql`.
3. Optionally apply `supabase/seed.sql`.
4. Copy the project URL and keys into Vercel env vars.
5. Create an admin user, then set their `profiles.role` to `admin`.

The migration enables RLS and keeps authorization roles in `profiles`, not user-editable metadata.

## 5. Stripe Setup

1. Create Stripe account.
2. Add publishable and secret keys to Vercel.
3. Add a webhook endpoint:

```text
https://<your-domain>/api/stripe/webhook
```

4. Subscribe to `checkout.session.completed`.
5. Add the webhook signing secret to `STRIPE_WEBHOOK_SECRET`.

## 6. Verification

Before merging to `main`, run:

```bash
npm run lint
npm run typecheck
npm run build
```

After deployment, check:

- `/it` and `/zh`
- `/it/products`
- `/it/cart`
- `/it/checkout`
- `/it/b2b`
- `/it/rma`
- `/it/admin`
- `/api/admin/health`

## 7. Rollback

For code bugs, revert the Git commit and push `main`.

For deployment issues, use Vercel Dashboard > Deployments > select previous successful deployment > Promote/Rollback.

# GitHub + Vercel Deployment

This project is designed for a GitHub repository connected to Vercel Git deployments.

## 1. First GitHub Push

Create or use the GitHub repository `kyox215/PartsPro-Italia`, then run:

```bash
git remote add origin git@github.com:kyox215/PartsPro-Italia.git
git push -u origin main
```

If you use HTTPS instead of SSH:

```bash
git remote add origin https://github.com/kyox215/PartsPro-Italia.git
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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
ADMIN_EMAIL
```

Never commit `.env.local` or secret values. Use `.env.example` only as the public checklist.

## 4. Supabase Setup

1. Create or open the Supabase project.
2. Link the local CLI project with `npx supabase link --project-ref <project-ref>`.
3. Apply `supabase/migrations/0001_initial_schema.sql`.
4. Optionally apply `supabase/seed.sql`.
5. Copy the project URL and keys into Vercel env vars.
6. Create an admin user, then set their `profiles.role` to `admin`.

The migration enables RLS and keeps authorization roles in `profiles`, not user-editable metadata.

### Google Login

Enable Google under Supabase Dashboard > Authentication > Providers. In Google Cloud Console, add this authorized redirect URI:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

In Supabase Auth URL Configuration, allow these app redirect URLs:

```text
http://localhost:3001/api/auth/callback
https://phone-parts-b2b-italy.vercel.app/api/auth/callback
```

The login page posts to `/api/auth/oauth/google`, then Supabase redirects back to `/api/auth/callback` where the app exchanges the OAuth code for SSR cookies.

Useful SQL after your first admin signs up:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

The app uses Supabase SSR cookie sessions through `src/proxy.ts`. Admin APIs check the signed-in user and only allow real writes for users with `profiles.role = 'admin'`. If Supabase is not configured, admin pages stay in demo mode so Vercel builds and previews still work.

Admin passwords are managed by Supabase Auth and cannot be read back from the app or database. Create the admin user with email/password or Google login, set `ADMIN_EMAIL` to that email in Vercel, and set `profiles.role = 'admin'`.

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
- `/it/account`
- `/it/account/company`
- `/it/b2b`
- `/it/rma`
- `/it/admin`
- `/it/admin/products`
- `/it/admin/orders`
- `/it/admin/b2b`
- `/it/admin/rma`
- `/it/admin/system`
- `/it/login`
- `/api/auth/oauth/google`
- `/api/auth/callback`
- `/api/admin/orders/status`
- `/api/admin/b2b/status`
- `/api/admin/rma/status`
- `/api/admin/health`
- `/api/account/company`

## 7. Current MVP Behavior

- Checkout posts real line items via `itemsJson`; bank transfer orders redirect to the account page with the generated order ID.
- The account page reads the signed-in customer's own orders and RMA records through Supabase SSR sessions and RLS.
- Customers can maintain company, invoice, contact, and category data at `/account/company`; status and price group remain admin-controlled.
- `/admin/system` shows Vercel environment readiness plus Supabase public/admin table reachability without exposing secret values.
- Stripe checkout redirects to Stripe only when `STRIPE_SECRET_KEY` is configured.
- Product/SKU admin form writes to `products`, `skus`, and `inventory` when Supabase is configured and the user is admin.
- Admin order, B2B approval, and RMA pages can update statuses through Node.js route handlers when Supabase is configured and the user is admin.
- Without Supabase env vars, catalog/admin pages use local seed products and API writes return demo-mode redirects.

## 8. Rollback

For code bugs, revert the Git commit and push `main`.

For deployment issues, use Vercel Dashboard > Deployments > select previous successful deployment > Promote/Rollback.

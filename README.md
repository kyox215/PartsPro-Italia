# PartsPro

PartsPro is an Italy-first B2B mobile repair parts ordering platform.

## Stack

- Vue 3
- Vite
- TypeScript
- Ant Design Vue
- Supabase

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Environment

Copy `.env.example` to `.env.local` and fill in:

```text
VITE_SUPABASE_URL=https://zethhymziiziiwrypsnc.supabase.co
VITE_SUPABASE_ANON_KEY=
VITE_USE_SUPABASE_DATA=true
```

`VITE_USE_SUPABASE_DATA=false` keeps the app on local mock data even when Supabase Auth is configured.

## Supabase Database

The `PartsPro-Italia` cloud project is:

```text
Project ref: zethhymziiziiwrypsnc
Project URL: https://zethhymziiziiwrypsnc.supabase.co
```

The MVP schema migrations are in:

```text
supabase/migrations/20260522152536_partspro_mvp_schema.sql
supabase/migrations/20260522160746_harden_public_product_grants.sql
```

They create products, customers, B2B applications, price groups, batches, inventory, orders, order lines, RMA requests, RLS policies, the `staff_ship_order` RPC placeholder, and the public product column grants that keep anonymous users from reading B2B prices.

Both migrations have been applied to the `PartsPro-Italia` Supabase project.

Roles must be stored in `profiles.role` or Supabase `app_metadata.role`; do not use user-editable metadata for authorization.

## Project Documents

- `声明/PartsPro-UI设计声明-AntDesignVue.md`
- `声明/PartsPro-项目执行计划与进度.md`

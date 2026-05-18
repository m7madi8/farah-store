# Nana's Bites — React App

React storefront + optional **Supabase** backend and **staff admin** (`/admin`) using TanStack Table and shadcn-style UI primitives.

## Structure

```
src/
├── components/     # Navbar, Footer, ProductCard, … + ui/ (button, table, card, …)
├── pages/          # HomePage, ProductDetailPage, CheckoutPage, admin/*
├── context/        # CartContext, LanguageContext
├── lib/            # supabase.js, cn.js
├── services/       # api.js — catalog + checkout (Supabase, REST, or mock)
├── data/           # translations.js (en / ar)
├── styles/         # style.css, product.css, tailwind.css
├── App.jsx
└── index.jsx
supabase/
├── schema.sql      # Postgres tables + RLS (run in Supabase SQL editor)
└── seed.sql        # Optional demo products with stable UUIDs
```

## Troubleshooting: `npm install` / certificate errors

If install fails with **`UNABLE_TO_VERIFY_LEAF_SIGNATURE`** when contacting `registry.npmjs.org`, your network or antivirus is intercepting HTTPS (corporate proxy / SSL inspection). Fixes that usually work:

- Install/update **Node LTS** and retry `npm install`.
- If IT gave you a root CA file:  
  `set NODE_EXTRA_CA_CERTS=C:\path\to\corp-ca.pem` (PowerShell/cmd) then `npm install`.
- Ask IT to allow direct access to `registry.npmjs.org` or configure npm for your proxy per company docs.

Avoid turning off TLS verification unless you understand the risk.

## Scripts

- `npm run dev` — start dev server (port 3000)
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm test` — Vitest

## Supabase (recommended)

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL**: paste and run `supabase/schema.sql`, then optionally `supabase/seed.sql`.
3. **Auth**: Authentication → Providers → enable **Email**. Create a staff user (Authentication → Users → Add user).
4. **Env**: copy `.env.example` → `.env` and set:

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

**Behavior**

- **Storefront**: loads rows from `products` (falls back to mock catalog if the table is empty or the query fails). Checkout inserts into `orders` and `order_items` (RLS allows public insert; only authenticated users can read orders in admin).
- **Admin**: open `/admin/login`, sign in with the staff user → `/admin/orders` and `/admin/products` (TanStack Table).

If both Supabase and `VITE_API_BASE` are set, **Supabase takes priority** for catalog and checkout.

## Optional REST API

Set `VITE_API_BASE` when pointing at a custom REST API (no Supabase):

- **GET** `/products/` — list products (array or `{ results: [...] }`)
- **POST** `/orders/` — see `submitOrder` in `src/services/api.js`

## Routing

- `/` — Home
- `/product/:slug` — Product detail
- `/checkout` — Checkout
- `/admin/login` — Staff login (requires Supabase env)
- `/admin`, `/admin/orders`, `/admin/products` — Protected admin

## Features

- **Cart:** Context API; persists in `localStorage`
- **i18n:** English / Arabic
- **Forms:** Checkout validated client-side

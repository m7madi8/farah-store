# Firebase setup — Chef Farah Ammar store

Free tier (Spark) is enough for this storefront + admin.

## 1. Create project

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Add project**.
2. Enable **Firestore** (production mode) and **Authentication** → **Email/Password**.

## 2. Web app config

Project settings → **Your apps** → Web (`</>`) → copy config into `react-app/.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

Restart dev server after editing `.env`.

## 3. Firestore rules

Firebase Console → Firestore → **Rules** → paste `firebase/firestore.rules` → **Publish**.

## Troubleshooting: "Missing or insufficient permissions"

1. Open [Firebase Console](https://console.firebase.google.com/) → project **farah-store-48a43** → **Firestore → Rules**.
2. Replace all rules with the contents of `react-app/firebase/firestore.rules`.
3. Click **Publish** (not just Save draft).
4. Sign out from `/admin` and sign in again.

Default Firebase rules block all reads — the admin panel will show this error until you publish the custom rules.


## 4. Composite index (orders)

First admin load may prompt a link to create an index on `orders` / `created_at` DESC — follow the console link, or add manually:

- Collection: `orders`
- Fields: `created_at` Descending

Same for `products` / `sort_order` Ascending if prompted.

## 5. Seed products

Firebase Console → Firestore → **Start collection** `products`.

For each entry in `firebase/seed-products.json`, create a document with **Document ID** = the key (e.g. `dumplings-chicken`) and paste the fields.

Or use the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # select project, use firebase/firestore.rules
# Import seed (one-time): use Console import or a small script with admin SDK
```

## 6. Admin user

Authentication → **Users** → **Add user** (email + password). Use these credentials at `/admin/login`.

## 7. Vercel

Add the same `VITE_FIREBASE_*` variables in Project → Settings → Environment Variables, plus:

```env
VITE_SITE_URL=https://cheffarahammar.com
```

Connect the custom domain in Vercel → **Settings → Domains** (`cheffarahammar.com`), then **Redeploy**.

In Firebase Console → **Authentication → Settings → Authorized domains**, add `cheffarahammar.com` so admin login works on the live domain.

Remove old `VITE_SUPABASE_*` vars if you no longer use Supabase.

## Collections

| Collection | Document ID | Notes |
|------------|-------------|--------|
| `products` | product `slug` | Catalog for storefront |
| `orders` | auto ID | Checkout writes `items[]` embedded in order doc |

Order document shape:

```json
{
  "customer_name": "...",
  "customer_phone": "...",
  "shipping_address": "...",
  "notes": "",
  "payment_method": "cod",
  "total": 50,
  "status": "pending",
  "created_at": "<server timestamp>",
  "items": [
    { "product_slug": "dumplings-chicken", "product_name": "...", "quantity": 2, "unit_price": 25 }
  ]
}
```

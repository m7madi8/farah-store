# Chef Farah Ammar — مشروع الواجهة (React)

متجر **Chef Farah Ammar** كتطبيق React (Vite) داخل مجلد `react-app/`. يمكن التشغيل **بدون خادم** (منتجات تجريبية + طلب محلي)، أو ربط **Supabase** (كتالوج + طلبات + لوحة `/admin`)، أو REST عبر `VITE_API_BASE`.

## التشغيل السريع

```bash
cd react-app
npm install
npm run dev
```

يفتح المطور على المنفذ الافتراضي لـ Vite (حالياً `3000`).

## بناء للإنتاج

```bash
cd react-app
npm run build
```

المخرجات في `react-app/dist/` جاهزة للاستضافة الثابتة.

## Supabase (اختياري — موصى به)

أنشئ مشروعاً على [Supabase](https://supabase.com)، نفّذ `react-app/supabase/schema.sql` ثم اختيارياً `seed.sql`، فعّل تسجيل الدخول بالبريد وأنشئ مستخدماً للطاقم، ثم ضع `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY` في `react-app/.env`. المتجر يقرأ جدول `products` ويكتب الطلبات في `orders` / `order_items`؛ لوحة التحكم على `/admin/login`.

## API REST اختياري

انسخ `.env.example` إلى `.env` وحدّد `VITE_API_BASE` إذا كان لديك خادم REST (ويُستخدم عندما **لا** يكون Supabase مفعّلاً). إذا لم تضبط لا Supabase ولا REST، التطبيق يستخدم المنتجات المدمجة ونجاح الطلب محلياً.

---

تفاصيل إضافية: راجع `react-app/README.md`.

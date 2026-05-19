-- Optional seed: stable IDs aligned with mock storefront (run after schema.sql)

insert into public.products (
  id, slug, name, name_ar, description, description_ar, price, category,
  image_url, hero_image, sort_order, badge, details, variants, images
) values
(
  '11111111-1111-4111-a111-111111111101',
  'dumplings-chicken',
  'Dumplings – Chicken',
  'دامبلنغ – دجاج',
  'Handcrafted chicken dumplings with rich flavors.',
  'دامبلنغ دجاج مصنوع يدوياً.',
  25, 'boxes',
  '/img/1.webp', '/img/2.webp', 1, 'Signature',
  '["detail1","detail2","detail3","detail4","detail5","detailTeriyaki","detailSweetChili","detail6"]'::jsonb,
  null,
  '[]'::jsonb
),
(
  '11111111-1111-4111-a111-111111111102',
  'dumplings-meat',
  'Dumplings – Meat',
  'دامبلنغ – لحم',
  'Handcrafted meat dumplings.',
  'دامبلنغ لحم.',
  27, 'boxes',
  '/img/1.webp', '/img/2.webp', 2, 'Signature',
  '["detail1","detail2Meat","detail3","detail4","detail5","detailTeriyaki","detailSweetChili","detail6"]'::jsonb,
  null,
  '[]'::jsonb
),
(
  '11111111-1111-4111-a111-111111111103',
  'teriyaki-sauce',
  'Teriyaki sauce',
  'صلصة ترياكي',
  'Rich teriyaki glaze.',
  'صلصة ترياكي.',
  2, 'sauces',
  '/img/teriyaki.webp', '/img/teriyaki.webp', 3, 'Sauce',
  '[]'::jsonb,
  null,
  '[]'::jsonb
),
(
  '11111111-1111-4111-a111-111111111104',
  'soya-sauce',
  'Soya sauce',
  'صلصة صويا',
  'Classic soy sauce.',
  'صلصة صويا.',
  2, 'sauces',
  '/img/soya.webp', '/img/soya.webp', 4, 'Sauce',
  '[]'::jsonb,
  null,
  '[]'::jsonb
),
(
  '11111111-1111-4111-a111-111111111105',
  'buffalo-sauce',
  'Buffalo sauce',
  'صلصة بافلو',
  'Spicy buffalo.',
  'صلصة بافلو.',
  2, 'sauces',
  '/img/buffalo.webp', '/img/buffalo.webp', 5, 'Sauce',
  '[]'::jsonb,
  null,
  '[]'::jsonb
),
(
  '11111111-1111-4111-a111-111111111106',
  'sweet-chili-sauce',
  'Sweet chili sauce',
  'صلصة الفلفل الحلو',
  'Sweet chili.',
  'صلصة فلفل حلو.',
  2, 'sauces',
  '/img/sweet-chili.webp', '/img/sweet-chili.webp', 6, 'Sauce',
  '[]'::jsonb,
  null,
  '[]'::jsonb
),
(
  '11111111-1111-4111-a111-111111111107',
  'chop-sticks',
  'Chop sticks',
  'عيدان الطعام',
  '1 ₪ per stick.',
  '1 ₪ للعود.',
  1, 'chopsticks',
  '/img/chop-sticks.webp', '/img/chop-sticks.webp', 7, 'Accessory',
  '[]'::jsonb,
  null,
  '[]'::jsonb
),
(
  '11111111-1111-4111-a111-111111111108',
  'date-balls-chocolate',
  'Date balls with chocolate',
  'كرات التمر بالشوكولاته',
  'Date balls with chocolate.',
  'كرات تمر بالشوكولاته.',
  25, 'boxes',
  '/img/pro2.png', '/img/pro2.png', 8, 'Signature',
  '[]'::jsonb,
  '[{"key":"7","labelEn":"7 pieces","labelAr":"٧ حبات","price":25},{"key":"16","labelEn":"16 pieces","labelAr":"١٦ حبة","price":45}]'::jsonb,
  '["/img/pro2.png"]'::jsonb
)
on conflict (slug) do nothing;

-- Sync dumpling ingredient lists for existing databases (seed insert skips on conflict)
update public.products
set details = '["detail1","detail2","detail3","detail4","detail5","detailTeriyaki","detailSweetChili","detail6"]'::jsonb
where slug = 'dumplings-chicken';

update public.products
set details = '["detail1","detail2Meat","detail3","detail4","detail5","detailTeriyaki","detailSweetChili","detail6"]'::jsonb
where slug = 'dumplings-meat';

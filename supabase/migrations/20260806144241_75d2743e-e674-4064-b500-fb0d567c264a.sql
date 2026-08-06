-- ROLES
CREATE TYPE public.app_role AS ENUM ('super_admin','admin','store_manager','customer_service','shipping_staff','customer');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','admin','store_manager')
  )
$$;

CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "super admin manages roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- CATALOG
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  palette TEXT NOT NULL DEFAULT 'default',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "staff manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL DEFAULT '',
  materials TEXT,
  care TEXT,
  price_cents INT NOT NULL CHECK (price_cents >= 0),
  compare_at_cents INT,
  currency TEXT NOT NULL DEFAULT 'USD',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  hover_image_url TEXT,
  is_new BOOLEAN NOT NULL DEFAULT false,
  is_bestseller BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT TO anon, authenticated USING (is_published);
CREATE POLICY "staff read all products" ON public.products FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff manage products" ON public.products FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER products_touch BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX products_category_idx ON public.products (category_id);

CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  position INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product images public read" ON public.product_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "staff manage product images" ON public.product_images FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  color_hex TEXT,
  sku TEXT,
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  UNIQUE (product_id, size, color)
);
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "variants public read" ON public.product_variants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "staff manage variants" ON public.product_variants FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- REVIEWS
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT NOT NULL,
  photo_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approved reviews public read" ON public.reviews FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "own reviews read" ON public.reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own reviews insert" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own reviews update" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "staff moderate reviews" ON public.reviews FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wishlist" ON public.wishlist_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can subscribe" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "staff read subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- SEED
INSERT INTO public.categories (slug, name, tagline, palette, position) VALUES
  ('women','Women','Fluid tailoring and quiet volume.','default',1),
  ('men','Men','Utility meets refinement.','cool',2),
  ('objects','Objects','Accessories built to outlast the season.','default',3);

INSERT INTO public.products (slug, name, subtitle, description, materials, care, price_cents, category_id, image_url, is_new, is_bestseller) VALUES
  ('asymmetric-silk-blouse','Asymmetric Silk Blouse','Ivory White','A fluid silk blouse cut on the bias with an offset placket. Designed to drape rather than structure.','100% mulberry silk, 19mm charmeuse','Dry clean only. Cool iron on reverse.',24000,(SELECT id FROM public.categories WHERE slug='women'),'/images/product-blouse.jpg',true,true),
  ('sculptural-trouser','Sculptural Trouser','Charcoal','Wide leg trouser with a pressed centre crease and a high, clean waistband.','Italian virgin wool blend','Dry clean only.',38000,(SELECT id FROM public.categories WHERE slug='women'),'/images/product-trousers.jpg',true,true),
  ('oversized-cashmere-knit','Oversized Cashmere Knit','Ecru','Chunky rib knit with a folded funnel neck and dropped shoulders.','90% cashmere, 10% wool','Hand wash cold. Dry flat.',41000,(SELECT id FROM public.categories WHERE slug='women'),'/images/product-knit.jpg',true,false),
  ('bias-slip-dress','Bias Slip Dress','Sand','A weightless bias cut slip with adjustable straps and a subtle side slit.','100% satin-back crepe','Hand wash cold. Line dry.',29000,(SELECT id FROM public.categories WHERE slug='women'),'/images/product-dress.jpg',false,true),
  ('heavy-cotton-overshirt','Heavy Cotton Overshirt','Pale Blue','A garment-washed overshirt in heavy cotton twill with a single chest pocket.','100% organic cotton twill, 280gsm','Machine wash cold. Tumble dry low.',22000,(SELECT id FROM public.categories WHERE slug='men'),'/images/product-overshirt.jpg',true,false),
  ('navy-wool-blazer','Structured Wool Blazer','Navy','Half-lined single breasted blazer with natural shoulders and patch pockets.','Super 120s virgin wool','Dry clean only.',56000,(SELECT id FROM public.categories WHERE slug='men'),'/images/product-blazer.jpg',false,true),
  ('form-tote-bag','Form Tote Bag','Pebbled Black','An unlined tote in pebbled leather that softens with wear.','Full grain Italian leather','Wipe with a dry cloth. Condition twice yearly.',52000,(SELECT id FROM public.categories WHERE slug='objects'),'/images/product-tote.jpg',false,true),
  ('lumiere-silk-scarf','Lumière Silk Scarf','Champagne','A hand rolled silk square with a soft gradient wash.','100% silk twill','Dry clean only.',12500,(SELECT id FROM public.categories WHERE slug='objects'),'/images/product-scarf.jpg',true,false),
  ('narrow-leather-belt','Narrow Leather Belt','Tan','A slim vegetable tanned belt with a solid brass buckle.','Vegetable tanned leather, brass hardware','Wipe clean. Keep dry.',9500,(SELECT id FROM public.categories WHERE slug='objects'),'/images/product-belt.jpg',false,false);

INSERT INTO public.product_variants (product_id, size, color, color_hex, stock)
SELECT p.id, s.size, p.subtitle, NULL, 12
FROM public.products p
CROSS JOIN (VALUES ('XS'),('S'),('M'),('L'),('XL')) AS s(size)
WHERE p.category_id IN (SELECT id FROM public.categories WHERE slug IN ('women','men'));

INSERT INTO public.product_variants (product_id, size, color, color_hex, stock)
SELECT p.id, 'One Size', p.subtitle, NULL, 20
FROM public.products p
WHERE p.category_id = (SELECT id FROM public.categories WHERE slug='objects');

INSERT INTO public.reviews (product_id, author_name, rating, title, body, is_verified, is_featured, status) VALUES
  ((SELECT id FROM public.products WHERE slug='asymmetric-silk-blouse'),'Noor A.',5,'Wears like nothing','The silk is heavier than I expected in the best way. It has become the piece I reach for weekly.',true,true,'approved'),
  ((SELECT id FROM public.products WHERE slug='sculptural-trouser'),'Yara M.',5,'Perfect drape','The crease holds all day and the waistband sits exactly where it should.',true,true,'approved'),
  ((SELECT id FROM public.products WHERE slug='form-tote-bag'),'Elias K.',4,'Softens beautifully','Stiff for the first week, then it relaxed into shape. Fits a laptop with room to spare.',true,false,'approved'),
  ((SELECT id FROM public.products WHERE slug='oversized-cashmere-knit'),'Lina S.',5,'Worth it','Genuinely soft cashmere with no itch. Sizing runs generous, which is the point.',true,true,'approved'),
  ((SELECT id FROM public.products WHERE slug='navy-wool-blazer'),'Omar H.',5,'Tailor approved','My tailor said the shoulders needed nothing. Rare for off the rack.',true,false,'approved'),
  ((SELECT id FROM public.products WHERE slug='bias-slip-dress'),'Dana R.',4,'Elegant and easy','Beautiful on. I sized down one and it fell perfectly.',true,true,'approved');
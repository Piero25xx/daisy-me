import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Category, Product, Review, Variant } from "./catalog-types";

const PRODUCT_FIELDS =
  "id, slug, name, subtitle, description, materials, care, price_cents, compare_at_cents, category_id, image_url, hover_image_url, is_new, is_bestseller";

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublicClient } = await import("./supabase-public.server");
  const { data, error } = await createPublicClient()
    .from("categories")
    .select("id, slug, name, tagline, palette, position")
    .order("position");
  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
});

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({ categorySlug: z.string().optional(), limit: z.number().int().positive().max(60).optional() })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const { createPublicClient } = await import("./supabase-public.server");
    const supabase = createPublicClient();

    let categoryId: string | null = null;
    if (data.categorySlug) {
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", data.categorySlug)
        .maybeSingle();
      if (!category) return [] as Product[];
      categoryId = category.id as string;
    }

    let query = supabase.from("products").select(PRODUCT_FIELDS).order("created_at", { ascending: false });
    if (categoryId) query = query.eq("category_id", categoryId);
    if (data.limit) query = query.limit(data.limit);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as Product[];
  });

export const getCollection = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { createPublicClient } = await import("./supabase-public.server");
    const supabase = createPublicClient();

    const { data: category } = await supabase
      .from("categories")
      .select("id, slug, name, tagline, palette, position")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!category) return null;

    const [{ data: products }, { data: variants }] = await Promise.all([
      supabase
        .from("products")
        .select(PRODUCT_FIELDS)
        .eq("category_id", category.id)
        .order("created_at", { ascending: false }),
      supabase.from("product_variants").select("id, product_id, size, color, color_hex, stock"),
    ]);

    return {
      category: category as unknown as Category,
      products: (products ?? []) as unknown as Product[],
      variants: (variants ?? []) as unknown as Variant[],
    };
  });

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { createPublicClient } = await import("./supabase-public.server");
    const supabase = createPublicClient();

    const { data: product } = await supabase
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("slug", data.slug)
      .maybeSingle();
    if (!product) return null;

    const [{ data: variants }, { data: reviews }, { data: category }] = await Promise.all([
      supabase
        .from("product_variants")
        .select("id, product_id, size, color, color_hex, stock")
        .eq("product_id", product.id),
      supabase
        .from("reviews")
        .select("id, product_id, author_name, rating, title, body, photo_url, is_verified, is_featured, created_at")
        .eq("product_id", product.id)
        .eq("status", "approved"),
      product.category_id
        ? supabase
            .from("categories")
            .select("id, slug, name, tagline, palette, position")
            .eq("id", product.category_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const { data: related } = await supabase
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("category_id", product.category_id ?? "")
      .neq("id", product.id)
      .limit(4);

    return {
      product: product as unknown as Product,
      category: (category ?? null) as unknown as Category | null,
      variants: (variants ?? []) as unknown as Variant[],
      reviews: (reviews ?? []) as unknown as Review[],
      related: (related ?? []) as unknown as Product[],
    };
  });

export const listReviews = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublicClient } = await import("./supabase-public.server");
  const supabase = createPublicClient();

  const [{ data: reviews }, { data: products }] = await Promise.all([
    supabase
      .from("reviews")
      .select("id, product_id, author_name, rating, title, body, photo_url, is_verified, is_featured, created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
    supabase.from("products").select("id, slug, name, image_url"),
  ]);

  return {
    reviews: (reviews ?? []) as unknown as Review[],
    products: (products ?? []) as { id: string; slug: string; name: string; image_url: string | null }[],
  };
});

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ email: z.string().trim().email().max(255) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { createPublicClient } = await import("./supabase-public.server");
    const { error } = await createPublicClient()
      .from("newsletter_subscribers")
      .insert({ email: data.email.toLowerCase() });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

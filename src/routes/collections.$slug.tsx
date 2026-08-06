import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/site/ProductCard";
import { getCollection } from "@/lib/catalog.functions";
import type { Category, Product, Variant } from "@/lib/catalog-types";

export const Route = createFileRoute("/collections/$slug")({
  loader: async ({ params }): Promise<{ category: Category; products: Product[]; variants: Variant[] }> => {
    const data = await getCollection({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Collection not found — Daisy" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.category.name} Collection — Daisy`;
    const description =
      loaderData.category.tagline ??
      `Shop the Daisy ${loaderData.category.name} collection: considered materials and lasting silhouettes.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  notFoundComponent: () => <p className="p-24 text-center text-sm">That collection doesn't exist.</p>,
  errorComponent: () => <p className="p-24 text-center text-sm">This collection didn't load. Please refresh.</p>,
  component: CollectionPage,
});

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
] as const;

function CollectionPage() {
  const { category, products, variants } = Route.useLoaderData() as {
    category: Category;
    products: Product[];
    variants: Variant[];
  };
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("newest");
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(600);

  const productVariants = useMemo(() => {
    const map = new Map<string, typeof variants>();
    for (const variant of variants) {
      const list = map.get(variant.product_id) ?? [];
      list.push(variant);
      map.set(variant.product_id, list);
    }
    return map;
  }, [variants]);

  const sizes = useMemo<string[]>(() => {
    const ids = new Set(products.map((product) => product.id));
    return [...new Set(variants.filter((v) => ids.has(v.product_id)).map((v) => v.size))];
  }, [products, variants]);

  const colors = useMemo<string[]>(
    () => [...new Set(products.map((product) => product.subtitle).filter(Boolean) as string[])],
    [products],
  );

  const visible = useMemo(() => {
    const filtered = products.filter((product) => {
      if (query && !`${product.name} ${product.subtitle ?? ""}`.toLowerCase().includes(query.toLowerCase()))
        return false;
      if (color && product.subtitle !== color) return false;
      if (product.price_cents / 100 > maxPrice) return false;
      if (size && !(productVariants.get(product.id) ?? []).some((variant) => variant.size === size)) return false;
      return true;
    });

    if (sort === "price-asc") return [...filtered].sort((a, b) => a.price_cents - b.price_cents);
    if (sort === "price-desc") return [...filtered].sort((a, b) => b.price_cents - a.price_cents);
    return filtered;
  }, [products, query, color, size, maxPrice, sort, productVariants]);

  const cool = category.palette === "cool";

  return (
    <div className={cool ? "palette-cool" : undefined}>
      <header className="border-b border-border px-6 py-16">
        <p className="label-mono mb-4 text-accent">Collection</p>
        <h1 className="font-display text-5xl md:text-7xl">{category.name}</h1>
        {category.tagline ? <p className="mt-4 max-w-md text-sm text-muted-foreground">{category.tagline}</p> : null}
      </header>

      <div className="flex flex-col gap-10 px-6 py-12 lg:flex-row">
        <aside className="w-full shrink-0 lg:sticky lg:top-28 lg:h-fit lg:w-56">
          <div className="space-y-8">
            <div>
              <label htmlFor="search" className="label-mono mb-3 block text-muted-foreground">
                Search
              </label>
              <input
                id="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                maxLength={60}
                placeholder="Search this collection"
                className="w-full border-b border-input bg-transparent pb-2 text-xs outline-none focus:border-foreground"
              />
            </div>

            <div>
              <p className="label-mono mb-3 text-muted-foreground">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSize(size === option ? null : option)}
                    aria-pressed={size === option}
                    className={`border px-3 py-1 text-[11px] uppercase transition-colors ${
                      size === option ? "border-foreground bg-foreground text-background" : "border-input"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="label-mono mb-3 text-muted-foreground">Colour</p>
              <div className="flex flex-col items-start gap-2">
                {colors.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setColor(color === option ? null : option)}
                    aria-pressed={color === option}
                    className={`text-xs transition-colors ${color === option ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="price" className="label-mono mb-3 block text-muted-foreground">
                Max price · ${maxPrice}
              </label>
              <input
                id="price"
                type="range"
                min={50}
                max={600}
                step={10}
                value={maxPrice}
                onChange={(event) => setMaxPrice(Number(event.target.value))}
                className="w-full accent-foreground"
              />
            </div>

            <div>
              <label htmlFor="sort" className="label-mono mb-3 block text-muted-foreground">
                Sort
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(event) => setSort(event.target.value as typeof sort)}
                className="w-full border-b border-input bg-transparent pb-2 text-xs outline-none"
              >
                {SORTS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <p className="label-mono mb-8 text-muted-foreground">
            {visible.length} {visible.length === 1 ? "piece" : "pieces"}
          </p>
          {visible.length === 0 ? (
            <p className="py-24 text-center text-sm text-muted-foreground">
              Nothing matches those filters just yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-3">
              {visible.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

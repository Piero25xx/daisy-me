import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/site/ProductCard";
import { getProduct } from "@/lib/catalog.functions";
import { formatPrice, type Category, type Product, type Review, type Variant } from "@/lib/catalog-types";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({
    params,
  }): Promise<{
    product: Product;
    category: Category | null;
    variants: Variant[];
    reviews: Review[];
    related: Product[];
  }> => {
    const data = await getProduct({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Product not found — Daisy" }, { name: "robots", content: "noindex" }] };
    }
    const { product } = loaderData;
    const title = `${product.name} — Daisy`;
    const description = product.description.slice(0, 155);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
      ],
    };
  },
  notFoundComponent: () => <p className="p-24 text-center text-sm">That piece is no longer available.</p>,
  errorComponent: () => <p className="p-24 text-center text-sm">This product didn't load. Please refresh.</p>,
  component: ProductPage,
});

function ProductPage() {
  const { product, category, variants, reviews, related } = Route.useLoaderData() as {
    product: Product;
    category: Category | null;
    variants: Variant[];
    reviews: Review[];
    related: Product[];
  };
  const cart = useCart();
  const [size, setSize] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const [added, setAdded] = useState(false);

  const sizes = useMemo<string[]>(() => [...new Set(variants.map((variant) => variant.size))], [variants]);
  const stock = useMemo(
    () => variants.filter((variant) => !size || variant.size === size).reduce((sum, v) => sum + v.stock, 0),
    [variants, size],
  );
  const rating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : null;

  function handleAdd() {
    const chosen = size ?? sizes[0];
    if (!chosen) return;
    cart.add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      size: chosen,
      color: product.subtitle ?? "",
      priceCents: product.price_cents,
      imageUrl: product.image_url,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className={category?.palette === "cool" ? "palette-cool" : undefined}>
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-16 md:flex-row">
        <div className="md:w-3/5">
          <button
            type="button"
            onClick={() => setZoom((value) => !value)}
            aria-label={zoom ? "Zoom out" : "Zoom in"}
            className="block w-full overflow-hidden bg-canvas"
          >
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                width={600}
                height={800}
                className={`aspect-3/4 w-full object-cover transition-transform duration-700 ${zoom ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"}`}
              />
            ) : null}
          </button>
          <p className="label-mono mt-3 text-muted-foreground">Tap image to zoom</p>
        </div>

        <div className="md:w-2/5">
          <div className="md:sticky md:top-28">
            <p className="label-mono mb-3 text-accent">{category?.name}</p>
            <h1 className="font-display text-4xl">{product.name}</h1>
            <p className="label-mono mt-2 text-muted-foreground">{product.subtitle}</p>
            <p className="mt-4 font-mono text-lg">{formatPrice(product.price_cents)}</p>

            {rating ? (
              <p className="label-mono mt-3 text-muted-foreground">
                {"★".repeat(Math.round(rating))} {rating.toFixed(1)} · {reviews.length} reviews
              </p>
            ) : null}

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <p className="label-mono text-muted-foreground">Size</p>
                <Link to="/fitting-room" className="label-mono underline underline-offset-4">
                  Size guide
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSize(option)}
                    aria-pressed={size === option}
                    className={`border px-4 py-2 text-[11px] uppercase transition-colors ${
                      size === option ? "border-foreground bg-foreground text-background" : "border-input"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <p className="label-mono mt-4 text-muted-foreground">
              {stock > 0 ? `In stock · ${stock} available` : "Currently out of stock"}
            </p>

            <button
              type="button"
              onClick={handleAdd}
              disabled={stock === 0}
              className="mt-6 w-full bg-foreground py-4 text-xs uppercase tracking-[0.2em] text-background transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              {added ? "Added to cart" : "Add to cart"}
            </button>

            <div className="mt-8 divide-y divide-border border-y border-border">
              <details className="group cursor-pointer py-4">
                <summary className="flex list-none items-center justify-between text-sm font-medium">
                  Description
                  <span className="text-lg leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              </details>
              <details className="group cursor-pointer py-4">
                <summary className="flex list-none items-center justify-between text-sm font-medium">
                  Materials &amp; Care
                  <span className="text-lg leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p>{product.materials}</p>
                  <p>{product.care}</p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      {reviews.length > 0 ? (
        <section className="border-t border-border px-6 py-20">
          <h2 className="mb-10 font-display text-3xl">What people say</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {reviews.map((review) => (
              <article key={review.id} className="border border-border bg-surface p-6">
                <p className="label-mono text-accent">{"★".repeat(review.rating)}</p>
                <h3 className="mt-3 font-display text-xl">{review.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{review.body}</p>
                <p className="label-mono mt-6 text-muted-foreground">
                  {review.author_name}
                  {review.is_verified ? " · Verified purchase" : ""}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="border-t border-border px-6 py-20">
          <h2 className="mb-10 font-display text-3xl">You may also like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4">
            {related.map((item, index) => (
              <ProductCard key={item.id} product={item} index={index} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { listReviews } from "@/lib/catalog.functions";
import type { Review } from "@/lib/catalog-types";

type ReviewProduct = { id: string; slug: string; name: string; image_url: string | null };

export const Route = createFileRoute("/vibe-check")({
  loader: async (): Promise<{ reviews: Review[]; products: ReviewProduct[] }> => listReviews(),
  head: () => ({
    meta: [
      { title: "Vibe Check — Daisy Community Reviews" },
      {
        name: "description",
        content: "Real fit notes and photos from the Daisy community. See how each piece wears in everyday life.",
      },
      { property: "og:title", content: "Vibe Check — Daisy Community Reviews" },
      { property: "og:description", content: "Real fit notes and photos from the Daisy community." },
    ],
  }),
  errorComponent: () => <p className="p-24 text-center text-sm">Reviews didn't load. Please refresh.</p>,
  component: VibeCheckPage,
});

function VibeCheckPage() {
  const { reviews, products } = Route.useLoaderData() as { reviews: Review[]; products: ReviewProduct[] };
  const byId = new Map(products.map((product) => [product.id, product]));

  return (
    <div className="px-6 py-20">
      <header className="mb-16 max-w-2xl">
        <p className="label-mono mb-4 text-accent">Community</p>
        <h1 className="font-display text-5xl md:text-6xl">Vibe Check</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Fit notes, styling and honest opinions from people wearing Daisy in the world.
        </p>
      </header>

      {reviews.length === 0 ? (
        <p className="py-24 text-center text-sm text-muted-foreground">No reviews published yet.</p>
      ) : (
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
          {reviews.map((review) => {
            const product = review.product_id ? byId.get(review.product_id) : undefined;
            return (
              <article key={review.id} className="break-inside-avoid border border-border bg-surface p-6">
                <p className="label-mono text-accent">{"★".repeat(review.rating)}</p>
                {review.title ? <h2 className="mt-3 font-display text-xl">{review.title}</h2> : null}
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{review.body}</p>
                <div className="mt-6 flex items-center justify-between gap-4">
                  <p className="label-mono text-muted-foreground">
                    {review.author_name}
                    {review.is_verified ? " · Verified" : ""}
                  </p>
                  {product ? (
                    <Link
                      to="/product/$slug"
                      params={{ slug: product.slug }}
                      className="label-mono underline underline-offset-4"
                    >
                      {product.name}
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

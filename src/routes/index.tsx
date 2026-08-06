import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/site/ProductCard";
import { listProducts } from "@/lib/catalog.functions";
import type { Product } from "@/lib/catalog-types";

export const Route = createFileRoute("/")({
  loader: async (): Promise<{ products: Product[] }> => ({
    products: await listProducts({ data: { limit: 4 } }),
  }),
  head: () => ({
    meta: [
      { title: "Daisy — Premium Fashion, Quietly Made" },
      {
        name: "description",
        content:
          "Daisy is a modern fashion house of fluid tailoring, considered materials and pieces designed to outlast the season. Shop women, men and objects.",
      },
      { property: "og:title", content: "Daisy — Premium Fashion, Quietly Made" },
      {
        property: "og:description",
        content: "Fluid tailoring, considered materials, and pieces designed to outlast the season.",
      },
    ],
  }),
  errorComponent: () => <p className="p-24 text-center text-sm">This page didn't load. Please refresh.</p>,
  component: Index,
});

function Index() {
  const { products } = Route.useLoaderData();

  return (
    <>
      <section className="relative flex flex-col md:h-[90vh] md:flex-row">
        <div className="relative h-[70vh] overflow-hidden md:h-full md:w-1/2">
          <img
            src="/images/hero-women.jpg"
            alt="Model wearing an oversized linen suit from the Daisy summer collection"
            width={1080}
            height={1600}
            className="animate-reveal h-full w-full object-cover"
          />
          <div className="animate-slide absolute bottom-12 left-6 max-w-sm md:left-12" style={{ animationDelay: "400ms" }}>
            <p className="label-mono mb-4 text-accent">New Collection 2026</p>
            <h1 className="mb-6 text-balance font-display text-5xl leading-[0.9] md:text-7xl">
              The Architecture of <span className="italic">Softness</span>
            </h1>
            <Link
              to="/collections/$slug"
              params={{ slug: "women" }}
              className="inline-block bg-foreground px-8 py-3 text-xs uppercase tracking-widest text-background transition-all hover:bg-accent"
            >
              Shop Women
            </Link>
          </div>
        </div>
        <div className="hidden h-full flex-col items-center justify-center bg-canvas p-24 md:flex md:w-1/2">
          <img
            src="/images/fabric-detail.jpg"
            alt="Close detail of undyed linen fabric"
            loading="lazy"
            width={800}
            height={1000}
            className="animate-reveal mb-8 aspect-4/5 w-full object-cover"
            style={{ animationDelay: "200ms" }}
          />
          <p className="max-w-xs text-pretty text-center text-sm leading-relaxed text-muted-foreground">
            Inspired by the movement of raw silk against structural silhouettes. A study in contrast and quiet luxury.
          </p>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mb-12 flex items-end justify-between border-b border-border pb-4">
          <h2 className="font-display text-3xl">Selected Objects</h2>
          <Link
            to="/collections/$slug"
            params={{ slug: "women" }}
            className="label-mono text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            View All New Arrivals
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </section>

      <section className="palette-cool flex flex-col items-center gap-16 px-6 py-32 md:flex-row">
        <div className="order-2 md:order-1 md:w-1/2">
          <img
            src="/images/mens-lifestyle.jpg"
            alt="Man wearing a navy field jacket from the Daisy Homme collection"
            loading="lazy"
            width={1200}
            height={1200}
            className="aspect-square w-full object-cover ring-1 ring-border"
          />
        </div>
        <div className="order-1 md:order-2 md:w-1/2">
          <h2 className="mb-8 font-display text-5xl leading-none md:text-7xl">
            Daisy <span className="italic">Homme</span>
          </h2>
          <p className="mb-10 max-w-sm font-medium text-muted-foreground">
            Utility meets refinement. Our menswear collection redefines everyday essentials with architectural
            precision.
          </p>
          <Link
            to="/collections/$slug"
            params={{ slug: "men" }}
            className="inline-block border border-foreground px-8 py-4 text-xs uppercase tracking-widest transition-all hover:bg-foreground hover:text-background"
          >
            Explore Collection
          </Link>
        </div>
      </section>

      <section className="bg-surface px-6 py-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-20 md:flex-row">
          <div className="flex-1">
            <img
              src="/images/packaging.jpg"
              alt="Daisy garment tags and tissue packaging"
              loading="lazy"
              width={1000}
              height={1200}
              className="aspect-4/5 w-full object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col justify-center">
            <span className="label-mono mb-4 text-accent">Smart Concierge</span>
            <h2 className="mb-6 font-display text-4xl">Daisy AI Fitting Room</h2>
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
              Eliminate the guesswork of sizing. Share your measurements and our fitting engine recommends the
              silhouette that's uniquely yours.
            </p>
            <div className="space-y-4">
              <Link
                to="/fitting-room"
                className="block w-full bg-accent py-4 text-center text-xs font-medium uppercase tracking-[0.2em] text-accent-foreground transition-all hover:brightness-110"
              >
                Try Virtual Fitting
              </Link>
              <p className="label-mono text-center text-muted-foreground">Personalised in under a minute</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

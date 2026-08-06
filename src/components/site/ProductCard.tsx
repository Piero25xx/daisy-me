import { Link } from "@tanstack/react-router";
import { formatPrice, type Product } from "@/lib/catalog-types";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group animate-slide block"
      style={{ animationDelay: `${Math.min(index, 6) * 100}ms` }}
    >
      <div className="relative mb-4 aspect-3/4 overflow-hidden bg-canvas">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            width={600}
            height={800}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : null}
        {product.is_new ? (
          <span className="label-mono absolute left-3 top-3 bg-background/90 px-2 py-1">New</span>
        ) : null}
        <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-foreground/20 text-[10px]">
            +
          </div>
        </div>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-tight">{product.name}</p>
          <p className="label-mono text-muted-foreground">{product.subtitle}</p>
        </div>
        <p className="font-mono text-xs">{formatPrice(product.price_cents)}</p>
      </div>
    </Link>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog-types";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag — Daisy" },
      { name: "description", content: "Review the pieces in your Daisy bag before checkout." },
      { property: "og:title", content: "Your Bag — Daisy" },
      { property: "og:description", content: "Review the pieces in your Daisy bag before checkout." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, subtotalCents, setQuantity, remove } = useCart();

  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="mb-12 font-display text-5xl">Your Bag</h1>

      {lines.length === 0 ? (
        <div className="border border-border p-16 text-center">
          <p className="text-sm text-muted-foreground">Your bag is empty.</p>
          <Link
            to="/collections/$slug"
            params={{ slug: "women" }}
            className="mt-6 inline-block bg-foreground px-8 py-3 text-xs uppercase tracking-widest text-background"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border border-y border-border">
            {lines.map((line) => (
              <li key={`${line.productId}-${line.size}`} className="flex gap-6 py-6">
                <Link to="/product/$slug" params={{ slug: line.slug }} className="w-24 shrink-0">
                  {line.imageUrl ? (
                    <img
                      src={line.imageUrl}
                      alt={line.name}
                      loading="lazy"
                      width={200}
                      height={266}
                      className="aspect-3/4 w-full object-cover"
                    />
                  ) : null}
                </Link>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{line.name}</p>
                      <p className="label-mono text-muted-foreground">
                        {line.color} · Size {line.size}
                      </p>
                    </div>
                    <p className="font-mono text-xs">{formatPrice(line.priceCents * line.quantity)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-input">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => setQuantity(line.productId, line.size, line.quantity - 1)}
                        className="px-3 py-1 text-xs"
                      >
                        −
                      </button>
                      <span className="px-3 text-xs">{line.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => setQuantity(line.productId, line.size, line.quantity + 1)}
                        className="px-3 py-1 text-xs"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(line.productId, line.size)}
                      className="label-mono text-muted-foreground underline underline-offset-4"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col items-end gap-4">
            <div className="flex w-full max-w-xs justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">{formatPrice(subtotalCents)}</span>
            </div>
            <p className="label-mono text-muted-foreground">Shipping and taxes calculated at checkout.</p>
            <button
              type="button"
              className="w-full max-w-xs bg-foreground py-4 text-xs uppercase tracking-[0.2em] text-background transition-colors hover:bg-accent"
            >
              Proceed to checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";

const MESSAGES = [
  "Complimentary Worldwide Shipping on orders over $300",
  "New Arrivals: The Summer Edit 01",
];

export function PromoMarquee() {
  return (
    <div className="overflow-hidden border-b border-border bg-foreground py-2 text-background">
      <div className="flex w-max animate-marquee whitespace-nowrap label-mono">
        {[...MESSAGES, ...MESSAGES, ...MESSAGES, ...MESSAGES].map((message, index) => (
          <span key={index} className="px-8">
            {message}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Header() {
  const { count } = useCart();

  return (
    <>
      <PromoMarquee />
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/80 px-6 py-4 backdrop-blur-md">
        <div className="flex gap-6 text-xs font-medium uppercase tracking-tighter">
          <Link to="/collections/$slug" params={{ slug: "women" }} className="transition-colors hover:text-accent">
            Women
          </Link>
          <Link to="/collections/$slug" params={{ slug: "men" }} className="transition-colors hover:text-accent">
            Men
          </Link>
          <Link to="/collections/$slug" params={{ slug: "objects" }} className="transition-colors hover:text-accent">
            Objects
          </Link>
        </div>
        <Link
          to="/"
          className="absolute left-1/2 -translate-x-1/2 font-display text-2xl italic tracking-tight"
          aria-label="Daisy home"
        >
          Daisy
        </Link>
        <div className="flex gap-6 text-xs font-medium uppercase tracking-tighter">
          <Link to="/vibe-check" className="hidden hover:text-accent sm:inline">
            Vibe Check
          </Link>
          <Link to="/auth" className="hover:text-accent">
            Account
          </Link>
          <Link to="/cart" className="hover:text-accent">
            Cart ({count})
          </Link>
        </div>
      </nav>
    </>
  );
}

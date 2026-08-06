import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  size: string;
  color: string;
  priceCents: number;
  imageUrl: string | null;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  remove: (productId: string, size: string) => void;
  setQuantity: (productId: string, size: string, quantity: number) => void;
  clear: () => void;
};

const STORAGE_KEY = "daisy.cart.v1";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const key = (productId: string, size: string) => `${productId}::${size}`;
    return {
      lines,
      count: lines.reduce((total, line) => total + line.quantity, 0),
      subtotalCents: lines.reduce((total, line) => total + line.quantity * line.priceCents, 0),
      add: (line, quantity = 1) =>
        setLines((current) => {
          const existing = current.find((item) => key(item.productId, item.size) === key(line.productId, line.size));
          if (existing) {
            return current.map((item) =>
              item === existing ? { ...item, quantity: item.quantity + quantity } : item,
            );
          }
          return [...current, { ...line, quantity }];
        }),
      remove: (productId, size) =>
        setLines((current) => current.filter((item) => key(item.productId, item.size) !== key(productId, size))),
      setQuantity: (productId, size, quantity) =>
        setLines((current) =>
          quantity <= 0
            ? current.filter((item) => key(item.productId, item.size) !== key(productId, size))
            : current.map((item) =>
                key(item.productId, item.size) === key(productId, size) ? { ...item, quantity } : item,
              ),
        ),
      clear: () => setLines([]),
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  CART_STORAGE_KEY,
  MAX_ITEM_QUANTITY,
  calculateCartTotals,
  normalizeCartItems,
  resolveCartLines,
} from "@/lib/commerce/cart";
import type {
  CartItem,
  CartLine,
  CartTotals,
} from "@/types/commerce";

type CartContextValue = {
  hydrated: boolean;
  items: CartItem[];
  lines: CartLine[];
  totals: CartTotals;
  itemCount: number;
  addItem: (slug: string, variantId: string, quantity?: number) => void;
  updateQuantity: (slug: string, variantId: string, quantity: number) => void;
  removeItem: (slug: string, variantId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadStoredCart() {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return normalizeCartItems(stored ? JSON.parse(stored) : []);
  } catch {
    return [];
  }
}

function subscribeToHydration() {
  return () => undefined;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadStoredCart);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // La compra demo sigue funcionando en memoria si Storage está bloqueado.
    }
  }, [hydrated, items]);

  const addItem = useCallback(
    (slug: string, variantId: string, quantity = 1) => {
      setItems((current) => {
        const existing = current.find(
          (item) => item.slug === slug && item.variantId === variantId,
        );
        if (!existing) {
          return normalizeCartItems([
            ...current,
            { slug, variantId, quantity },
          ]);
        }
        return current.map((item) =>
          item.slug === slug && item.variantId === variantId
            ? {
                ...item,
                quantity: Math.min(
                  MAX_ITEM_QUANTITY,
                  item.quantity + quantity,
                ),
              }
            : item,
        );
      });
    },
    [],
  );

  const updateQuantity = useCallback(
    (slug: string, variantId: string, quantity: number) => {
      if (quantity < 1) {
        setItems((current) =>
          current.filter(
            (item) => item.slug !== slug || item.variantId !== variantId,
          ),
        );
        return;
      }
      setItems((current) =>
        current.map((item) =>
          item.slug === slug && item.variantId === variantId
            ? {
                ...item,
                quantity: Math.min(
                  MAX_ITEM_QUANTITY,
                  Math.max(1, Math.floor(quantity)),
                ),
              }
            : item,
        ),
      );
    },
    [],
  );

  const removeItem = useCallback((slug: string, variantId: string) => {
    setItems((current) =>
      current.filter(
        (item) => item.slug !== slug || item.variantId !== variantId,
      ),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const lines = useMemo(() => resolveCartLines(items), [items]);
  const totals = useMemo(() => calculateCartTotals(lines), [lines]);
  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      hydrated,
      items,
      lines,
      totals,
      itemCount,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [
      addItem,
      clearCart,
      hydrated,
      itemCount,
      items,
      lines,
      removeItem,
      totals,
      updateQuantity,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe utilizarse dentro de CartProvider.");
  }
  return context;
}

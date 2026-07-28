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
  CartConfiguration,
  CartLine,
  CartTotals,
} from "@/types/commerce";

type CartContextValue = {
  hydrated: boolean;
  items: CartItem[];
  lines: CartLine[];
  totals: CartTotals;
  itemCount: number;
  addItem: (
    slug: string,
    variantId: string,
    quantity?: number,
    configuration?: CartConfiguration,
  ) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
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
    (
      slug: string,
      variantId: string,
      quantity = 1,
      configuration?: CartConfiguration,
    ) => {
      const id = configuration?.id ?? `${slug}:${variantId}`;
      setItems((current) => {
        const existing = current.find((item) => item.id === id);
        if (!existing) {
          return normalizeCartItems([
            ...current,
            { id, slug, variantId, quantity, configuration },
          ]);
        }
        return current.map((item) =>
          item.id === id
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
    (id: string, quantity: number) => {
      if (quantity < 1) {
        setItems((current) => current.filter((item) => item.id !== id));
        return;
      }
      setItems((current) =>
        current.map((item) =>
          item.id === id
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

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
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

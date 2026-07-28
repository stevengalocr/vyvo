"use client";

import Link from "next/link";
import { useState } from "react";
import { formatMoney } from "@/lib/commerce/cart";
import type { StorefrontProduct } from "@/types/commerce";
import { useCart } from "./cart-provider";
import { Icon } from "./icon";

export function ProductPurchasePanel({
  product,
}: {
  product: StorefrontProduct;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const variant = product.commerce.variants[0];

  if (!variant?.price) return null;

  return (
    <div className="purchase-panel">
      <div className="purchase-panel__price">
        <span>Precio demostrativo</span>
        <strong>{formatMoney(variant.price)}</strong>
      </div>
      <p>
        Sirve para probar el recorrido de compra. No representa una oferta ni
        generará un cobro real.
      </p>
      <div className="purchase-panel__actions">
        <button
          className="button button--purple"
          type="button"
          onClick={() => {
            addItem(product.slug, variant.id);
            setAdded(true);
          }}
        >
          {added ? "Agregado al carrito" : "Agregar al carrito"}
          <Icon name={added ? "check" : "cart"} />
        </button>
        {added ? (
          <Link className="button button--ghost" href="/carrito">
            Ver carrito <Icon name="arrow" />
          </Link>
        ) : null}
      </div>
      <div className="purchase-panel__trust">
        <span><Icon name="shield" size={16} /> Sin cobro real</span>
        <span><Icon name="package" size={16} /> Entrega simulada</span>
      </div>
    </div>
  );
}

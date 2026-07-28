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

  if (product.customization) {
    return (
      <div className="purchase-panel">
        <div className="purchase-panel__price">
          <span>Precio demostrativo base</span>
          <strong>{formatMoney(variant.price)}</strong>
        </div>
        <p>
          Prepará primero la dirección de tu pieza. El precio final dependerá
          del alcance, materiales y detalles que se validen después.
        </p>
        <div className="purchase-panel__actions">
          <Link
            className="button button--purple"
            href={`/personalizar/${product.slug}`}
          >
            Configurar {product.name} <Icon name="arrow" />
          </Link>
        </div>
        <div className="purchase-panel__trust">
          <span><Icon name="lock" size={16} /> Brief local y privado</span>
          <span><Icon name="shield" size={16} /> Sin cotización automática</span>
        </div>
      </div>
    );
  }

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
          disabled={added}
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

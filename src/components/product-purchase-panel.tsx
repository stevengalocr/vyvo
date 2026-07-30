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
  const { addItem, mode } = useCart();
  const [added, setAdded] = useState(false);
  const variant = product.commerce.variants[0];

  if (!variant?.price) return null;
  const isLive = mode === "bilbildin";
  const unavailable = isLive && !product.commerce.purchasable;

  if (product.customization) {
    return (
      <div className="purchase-panel" data-purchase-state="configure">
        <div className="purchase-panel__price">
          <span>{isLive ? "Precio base" : "Precio demostrativo base"}</span>
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
            {unavailable ? "Explorar configuración" : `Configurar ${product.name}`}{" "}
            <Icon name="arrow" />
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
    <div
      className="purchase-panel"
      data-purchase-state={added ? "added" : "idle"}
      aria-live="polite"
    >
      <div className="purchase-panel__price">
        <span>{isLive ? "Precio" : "Precio demostrativo"}</span>
        <strong>{formatMoney(variant.price)}</strong>
      </div>
      <p>
        {isLive
          ? unavailable
            ? "Esta pieza está visible, pero todavía no tiene inventario disponible."
            : "La disponibilidad y el precio se validarán nuevamente al confirmar el pedido."
          : "Sirve para probar el recorrido de compra. No representa una oferta ni generará un cobro real."}
      </p>
      <div className="purchase-panel__actions">
        <button
          className="button button--purple"
          type="button"
          disabled={added || unavailable}
          onClick={() => {
            addItem(product.slug, variant.id);
            setAdded(true);
          }}
        >
          {unavailable
            ? "Agotado por el momento"
            : added
              ? "Agregado al carrito"
              : "Agregar al carrito"}
          <Icon name={added ? "check" : "cart"} />
        </button>
        {added ? (
          <Link className="button button--ghost" href="/carrito">
            Ver carrito <Icon name="arrow" />
          </Link>
        ) : null}
      </div>
      <div className="purchase-panel__trust">
        <span>
          <Icon name="shield" size={16} />{" "}
          {isLive ? "Pedido protegido" : "Sin cobro real"}
        </span>
        <span>
          <Icon name="package" size={16} />{" "}
          {isLive ? "Entrega por coordinar" : "Entrega simulada"}
        </span>
      </div>
    </div>
  );
}

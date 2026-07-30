"use client";

import Image from "next/image";
import Link from "next/link";
import { formatMoney, MAX_ITEM_QUANTITY } from "@/lib/commerce/cart";
import { getCommerceExperience } from "@/lib/commerce/experience";
import { useCart } from "./cart-provider";
import { Icon } from "./icon";

export function CartPageClient() {
  const {
    hydrated,
    lines,
    totals,
    itemCount,
    updateQuantity,
    removeItem,
    mode,
  } = useCart();
  const isLive = mode === "bilbildin";
  const experience = getCommerceExperience(mode);

  if (!hydrated) {
    return (
      <div className="cart-loading" role="status">
        <span aria-hidden="true">V</span>
        <p>Preparando tu carrito…</p>
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="empty-cart">
        <span className="empty-cart__icon"><Icon name="cart" size={32} /></span>
        <span className="eyebrow">Tu selección</span>
        <h1>El carrito está esperando una señal.</h1>
        <p>{experience.cart.emptyDescription}</p>
        <Link href="/catalogo" className="button button--purple">
          Explorar catálogo <Icon name="arrow" />
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-layout" data-cart-empty="false">
      <section className="cart-main" aria-labelledby="cart-title">
        <div className="cart-heading">
          <div>
            <span className="eyebrow">
              {isLive ? "Compra VYVO" : "Compra demostrativa"}
            </span>
            <h1 id="cart-title">Tu carrito.</h1>
          </div>
          <span>{itemCount} {itemCount === 1 ? "pieza" : "piezas"}</span>
        </div>

        <div className="cart-lines">
          {lines.map((line) => (
            <article className="cart-line" key={line.id}>
              <Link
                href={`/producto/${line.slug}`}
                className="cart-line__image"
                aria-label={`Ver ${line.product.name}`}
              >
                <Image
                  src={line.product.image}
                  alt=""
                  fill
                  sizes="150px"
                />
              </Link>
              <div className="cart-line__info">
                <span>{line.product.lineLabel}</span>
                <h2>
                  <Link href={`/producto/${line.slug}`}>
                    {line.product.name}
                  </Link>
                </h2>
                <p>
                  {line.configuration?.label ?? line.variant.title} · {line.variant.sku}
                </p>
                {line.configuration ? (
                  <dl className="cart-line__configuration">
                    {line.configuration.details.slice(0, 4).map((detail) => (
                      <div key={detail.label}>
                        <dt>{detail.label}</dt>
                        <dd>{detail.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                <button
                  type="button"
                  className="remove-line"
                  onClick={() => removeItem(line.id)}
                >
                  <Icon name="trash" size={15} /> Eliminar
                </button>
              </div>
              <div className="cart-line__controls">
                <strong>{formatMoney(line.lineTotal)}</strong>
                <div className="quantity-control" aria-label={`Cantidad de ${line.product.name}`}>
                  <button
                    type="button"
                    aria-label={`Reducir cantidad de ${line.product.name}`}
                    disabled={line.quantity <= 1}
                    onClick={() =>
                      updateQuantity(line.id, line.quantity - 1)
                    }
                  >
                    <Icon name="minus" size={15} />
                  </button>
                  <output aria-live="polite">{line.quantity}</output>
                  <button
                    type="button"
                    aria-label={`Aumentar cantidad de ${line.product.name}`}
                    disabled={line.quantity >= MAX_ITEM_QUANTITY}
                    onClick={() =>
                      updateQuantity(line.id, line.quantity + 1)
                    }
                  >
                    <Icon name="plus" size={15} />
                  </button>
                </div>
                <small>{formatMoney(line.unitPrice)} c/u</small>
              </div>
            </article>
          ))}
        </div>

        <Link href="/catalogo" className="text-link">
          <Icon name="chevron" /> Seguir explorando
        </Link>
      </section>

      <aside className="order-summary" aria-labelledby="summary-title">
        <span className="demo-badge">
          {isLive ? "Pedido seguro · CRC" : "Simulación · sin cobro"}
        </span>
        <h2 id="summary-title">Resumen</h2>
        <dl>
          <div><dt>Subtotal</dt><dd>{formatMoney(totals.subtotal)}</dd></div>
          <div>
            <dt>{isLive ? "Entrega" : "Envío demo"}</dt>
            <dd>
              {isLive
                ? "Por coordinar"
                : totals.shipping.amountMinor
                  ? formatMoney(totals.shipping)
                  : "Incluido"}
            </dd>
          </div>
          <div className="order-summary__total">
            <dt>{isLive ? "Total de productos" : "Total demo"}</dt>
            <dd>{formatMoney(totals.total)}</dd>
          </div>
        </dl>
        <Link href="/checkout" className="button button--purple">
          Continuar al checkout <Icon name="arrow" />
        </Link>
        <ul className="summary-trust">
          <li>
            <Icon name="shield" />{" "}
            {isLive ? "Precio validado al confirmar" : "No se procesará ningún pago"}
          </li>
          <li>
            <Icon name="lock" />{" "}
            {isLive ? "Datos enviados de forma segura" : "Tus datos no se almacenan"}
          </li>
          <li>
            <Icon name="package" />{" "}
            {isLive ? "Pago y entrega por coordinar" : "Entrega y stock son simulados"}
          </li>
        </ul>
      </aside>
    </div>
  );
}

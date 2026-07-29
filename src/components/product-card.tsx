import Image from "next/image";
import Link from "next/link";
import { storefrontStageLabel } from "@/data/storefront";
import { formatMoney } from "@/lib/commerce/cart";
import type { StorefrontProduct } from "@/types/commerce";
import { Icon } from "./icon";

export function ProductCard({
  product,
  priority = false,
  revealIndex = 0,
}: {
  product: StorefrontProduct;
  priority?: boolean;
  revealIndex?: number;
}) {
  return (
    <article
      className={`product-card accent-${product.accent}`}
      data-reveal
      data-reveal-index={revealIndex}
    >
      <Link href={`/producto/${product.slug}`} className="product-card__image">
        <span className="product-card__accent" aria-hidden="true" />
        <div className="product-card__badges">
          <span>Render conceptual</span>
          <span>Origins {product.originsNumber}</span>
        </div>
        <Image
          src={product.image}
          alt={product.alt}
          fill
          priority={priority}
          sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 33vw"
        />
        <span className="product-card__arrow" aria-hidden="true">
          <Icon name="arrow" />
        </span>
      </Link>
      <div className="product-card__body">
        <div>
          <p>{product.lineLabel}</p>
          <h3>
            <Link href={`/producto/${product.slug}`}>{product.name}</Link>
          </h3>
        </div>
        <span className="status-dot">{storefrontStageLabel(product.commerce.stage)}</span>
        <p>{product.descriptor}</p>
        {product.commerce.price ? (
          <div className="product-card__price">
            <span>
              {product.commerce.inventory.availableQuantity === null
                ? "Precio demo"
                : "Precio"}
            </span>
            <strong>{formatMoney(product.commerce.price)}</strong>
          </div>
        ) : null}
      </div>
    </article>
  );
}

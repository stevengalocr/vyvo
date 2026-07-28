"use client";

import { useMemo, useState } from "react";
import { productLines } from "@/data/products";
import type { StorefrontProduct } from "@/types/commerce";
import type { Accent, ProductLine } from "@/types/product";
import { ProductCard } from "./product-card";

type LineFilter = ProductLine | "all";
type AccentFilter = Accent | "all";

export function ProductFilters({ products }: { products: StorefrontProduct[] }) {
  const [line, setLine] = useState<LineFilter>("all");
  const [accent, setAccent] = useState<AccentFilter>("all");
  const [customOnly, setCustomOnly] = useState(false);

  const filtered = useMemo(
    () =>
      products.filter((product) => {
        const lineMatch = line === "all" || product.line === line;
        const accentMatch = accent === "all" || product.accent === accent;
        const customMatch = !customOnly || Boolean(product.customization);
        return lineMatch && accentMatch && customMatch;
      }),
    [accent, customOnly, line, products],
  );

  return (
    <>
      <div className="filters" aria-label="Filtros del catálogo">
        <fieldset>
          <legend>Línea</legend>
          <div className="filter-pills">
            {productLines.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={line === item.id}
                onClick={() => setLine(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Acento</legend>
          <div className="color-filters">
            {(["all", "purple", "orange", "green", "white"] as const).map(
              (color) => (
                <button
                  key={color}
                  type="button"
                  aria-pressed={accent === color}
                  onClick={() => setAccent(color)}
                  className={`color-filter color-filter--${color}`}
                >
                  <span />
                  {color === "all"
                    ? "Todos"
                    : color === "purple"
                      ? "Morado"
                      : color === "orange"
                        ? "Naranja"
                        : color === "green"
                          ? "Verde"
                          : "Blanco"}
                </button>
              ),
            )}
          </div>
        </fieldset>
        <label className="toggle">
          <input
            type="checkbox"
            checked={customOnly}
            onChange={(event) => setCustomOnly(event.target.checked)}
          />
          <span />
          Personalizables
        </label>
      </div>
      <div className="results-count" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
      </div>
      {filtered.length ? (
        <div className="product-grid">
          {filtered.map((product) => (
            <ProductCard product={product} key={product.slug} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No hay productos con esa combinación.</h2>
          <p>Probá cambiando un filtro para volver a explorar Origins.</p>
          <button
            className="button button--dark"
            type="button"
            onClick={() => {
              setLine("all");
              setAccent("all");
              setCustomOnly(false);
            }}
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </>
  );
}

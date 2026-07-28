"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { StorefrontProduct } from "@/types/commerce";
import { Icon } from "./icon";
import { ProductCard } from "./product-card";

type Segment = "all" | "collectible" | "custom" | "drop";
type SortMode = "featured" | "price-asc" | "price-desc";

const segments: { id: Segment; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "collectible", label: "Coleccionables" },
  { id: "custom", label: "Personalizables" },
  { id: "drop", label: "Drops" },
];

function matchesSegment(product: StorefrontProduct, segment: Segment) {
  if (segment === "all") return true;
  if (segment === "collectible") return product.line === "mini";
  if (segment === "drop") return product.line === "drop";
  return Boolean(product.customization);
}

export function ProductFilters({
  products,
}: {
  products: StorefrontProduct[];
}) {
  const [segment, setSegment] = useState<Segment>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("featured");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase("es"));

  const filtered = useMemo(() => {
    const result = products.filter((product) => {
      if (!matchesSegment(product, segment)) return false;
      if (!deferredQuery) return true;
      const searchable = [
        product.name,
        product.descriptor,
        product.shortDescription,
        product.lineLabel,
        ...product.tags,
      ]
        .join(" ")
        .toLocaleLowerCase("es");
      return searchable.includes(deferredQuery);
    });

    return [...result].sort((first, second) => {
      if (sort === "featured") return first.displayOrder - second.displayOrder;
      const firstPrice = first.commerce.price?.amountMinor ?? 0;
      const secondPrice = second.commerce.price?.amountMinor ?? 0;
      return sort === "price-asc"
        ? firstPrice - secondPrice
        : secondPrice - firstPrice;
    });
  }, [deferredQuery, products, segment, sort]);

  function resetFilters() {
    setSegment("all");
    setQuery("");
    setSort("featured");
  }

  return (
    <>
      <div className="catalog-toolbar">
        <div className="catalog-toolbar__search">
          <Icon name="search" size={18} />
          <label>
            <span>Buscar en el catálogo</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nombre, línea o carácter…"
            />
          </label>
        </div>
        <label className="catalog-toolbar__sort">
          <span>Ordenar</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortMode)}
          >
            <option value="featured">Destacados</option>
            <option value="price-asc">Precio: menor primero</option>
            <option value="price-desc">Precio: mayor primero</option>
          </select>
        </label>
      </div>

      <div className="catalog-segments" aria-label="Categorías del catálogo">
        {segments.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={segment === item.id}
            onClick={() => setSegment(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="catalog-results-heading">
        <p aria-live="polite">
          <strong>{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "producto" : "productos"}
        </p>
        {segment !== "all" || query || sort !== "featured" ? (
          <button type="button" onClick={resetFilters}>
            Limpiar filtros
          </button>
        ) : null}
      </div>

      {filtered.length ? (
        <div className="product-grid">
          {filtered.map((product) => (
            <ProductCard product={product} key={product.slug} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span><Icon name="search" size={28} /></span>
          <h2>No encontramos esa señal.</h2>
          <p>
            Probá otro nombre o volvé a ver todos los productos de VYVO.
          </p>
          <button
            className="button button--dark"
            type="button"
            onClick={resetFilters}
          >
            Ver todo el catálogo
          </button>
        </div>
      )}
    </>
  );
}

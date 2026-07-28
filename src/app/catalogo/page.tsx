import type { Metadata } from "next";
import { ProductFilters } from "@/components/product-filters";
import { storefrontProducts } from "@/data/storefront";

export const metadata: Metadata = {
  title: "Catálogo Origins",
  description:
    "Explorá los nueve productos iniciales de VYVO Origins y su estado comercial actual.",
  alternates: { canonical: "/catalogo" },
};

export default function CatalogPage() {
  return (
    <>
      <header className="page-hero">
        <div className="container page-hero__grid">
          <div>
            <span className="eyebrow">Origins · Catálogo</span>
            <h1>
              Encontrá tu
              <br />
              próxima <span>señal.</span>
            </h1>
          </div>
          <p>
            Nueve productos, cinco líneas y un mismo ADN. La tienda ya modela
            variantes, precio, disponibilidad y entrega; los valores comerciales
            seguirán pendientes hasta conectar sus fuentes reales.
          </p>
        </div>
      </header>
      <section className="catalog-section">
        <div className="container">
          <ProductFilters products={storefrontProducts} />
        </div>
      </section>
    </>
  );
}

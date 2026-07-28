import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { ProductFilters } from "@/components/product-filters";
import { storefrontProducts } from "@/data/storefront";

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Explorá figuras coleccionables, personalizables y drops originales de VYVO.",
  alternates: { canonical: "/catalogo" },
};

export default function CatalogPage() {
  return (
    <>
      <header className="page-hero">
        <div className="container page-hero__grid">
          <div>
            <span className="eyebrow">Catálogo VYVO</span>
            <h1>
              Encontrá la
              <br />
              pieza que <span>habla por vos.</span>
            </h1>
          </div>
          <div className="catalog-hero__aside">
            <p>
              Explorá toda la colección, compará caminos y recorré una compra
              demostrativa clara de principio a fin.
            </p>
            <ul>
              <li><Icon name="check" /> 9 personajes originales</li>
              <li><Icon name="check" /> Opciones personalizables</li>
              <li><Icon name="shield" /> Checkout sin cobro real</li>
            </ul>
          </div>
        </div>
      </header>
      <section className="catalog-section">
        <div className="container">
          <ProductFilters products={storefrontProducts} />
        </div>
      </section>
      <section className="catalog-next">
        <div className="container catalog-next__grid">
          <Link href="/personalizar" className="catalog-next__card accent-purple">
            <span>Tu historia</span>
            <h2>¿No existe todavía? Personalizala.</h2>
            <p>Elegí entre SHIFT, ARENA o NEXO y encontrá la base correcta.</p>
            <strong>Empezar a personalizar <Icon name="arrow" /></strong>
          </Link>
          <Link href="/drops" className="catalog-next__card catalog-next__card--dark">
            <span>Ediciones especiales</span>
            <h2>Buscá lo que aparece una sola vez.</h2>
            <p>Conocé ABYSS y seguí el estado de los próximos drops VYVO.</p>
            <strong>Explorar Drops <Icon name="arrow" /></strong>
          </Link>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { JsonLd } from "@/components/json-ld";
import { ProductFilters } from "@/components/product-filters";
import { getBilbildinMode } from "@/lib/bilbildin/config";
import { getStorefrontCatalog } from "@/lib/bilbildin/provider";
import { getCommerceExperience } from "@/lib/commerce/experience";
import {
  breadcrumbNode,
  buildGraph,
  itemListNode,
} from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Explorá figuras coleccionables, personalizables y drops originales de VYVO.",
  alternates: { canonical: "/catalogo" },
};

export default async function CatalogPage() {
  const catalog = await getStorefrontCatalog();
  const mode = getBilbildinMode(process.env);
  const experience = getCommerceExperience(mode);

  return (
    <>
      <JsonLd
        graph={buildGraph([
          itemListNode(
            catalog,
            { id: "/catalogo#lista", name: "Catálogo VYVO", url: "/catalogo" },
            mode,
          ),
          breadcrumbNode([
            { name: "Inicio", path: "/" },
            { name: "Catálogo", path: "/catalogo" },
          ]),
        ])}
      />

      <header className="page-hero">
        <div className="container page-hero__grid">
          <div data-reveal>
            <span className="eyebrow">Catálogo VYVO</span>
            <h1>
              Encontrá la
              <br />
              pieza que <span>habla por vos.</span>
            </h1>
          </div>
          <div className="catalog-hero__aside" data-reveal data-reveal-index="1">
            <p>
              {experience.catalog.intro}
            </p>
            <ul>
              <li><Icon name="check" /> 9 personajes originales</li>
              <li><Icon name="check" /> Opciones personalizables</li>
              <li><Icon name="shield" /> {experience.catalog.checkoutBenefit}</li>
            </ul>
          </div>
        </div>
      </header>
      <section className="catalog-section">
        <div className="container">
          <ProductFilters products={catalog} />
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

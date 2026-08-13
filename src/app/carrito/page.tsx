import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart-page-client";
import { getBilbildinMode } from "@/lib/bilbildin/config";
import { getCommerceExperience } from "@/lib/commerce/experience";

export function generateMetadata(): Metadata {
  const experience = getCommerceExperience(getBilbildinMode(process.env));
  return {
    title: "Carrito",
    // Sin esto hereda el canonical "/" del layout raíz: inofensivo por el noindex,
    // pero le declara a un rastreador que esta página es el home.
    alternates: { canonical: "/carrito" },
    description: experience.metadata.cartDescription,
    robots: { index: false, follow: false },
  };
}

export default function CartPage() {
  return (
    <section className="commerce-page">
      <div className="container">
        <CartPageClient />
      </div>
    </section>
  );
}

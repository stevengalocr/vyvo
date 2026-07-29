import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart-page-client";
import { getBilbildinMode } from "@/lib/bilbildin/config";
import { getCommerceExperience } from "@/lib/commerce/experience";

export function generateMetadata(): Metadata {
  const experience = getCommerceExperience(getBilbildinMode(process.env));
  return {
    title: "Carrito",
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

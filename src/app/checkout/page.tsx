import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout-client";
import { getBilbildinMode } from "@/lib/bilbildin/config";
import { getCommerceExperience } from "@/lib/commerce/experience";

export function generateMetadata(): Metadata {
  const experience = getCommerceExperience(getBilbildinMode(process.env));
  return {
    title: experience.metadata.checkoutTitle,
    description: experience.metadata.checkoutDescription,
    robots: { index: false, follow: false },
  };
}

export default function CheckoutPage() {
  return (
    <section className="commerce-page commerce-page--checkout">
      <div className="container">
        <CheckoutClient />
      </div>
    </section>
  );
}

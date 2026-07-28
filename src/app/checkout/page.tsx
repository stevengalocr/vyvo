import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout-client";

export const metadata: Metadata = {
  title: "Checkout demostrativo",
  description: "Completá el recorrido de compra VYVO sin procesar un pago real.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <section className="commerce-page commerce-page--checkout">
      <div className="container">
        <CheckoutClient />
      </div>
    </section>
  );
}

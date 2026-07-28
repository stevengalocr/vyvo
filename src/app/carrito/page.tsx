import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart-page-client";

export const metadata: Metadata = {
  title: "Carrito",
  description: "Revisá tu selección VYVO antes de continuar al checkout demostrativo.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <section className="commerce-page">
      <div className="container">
        <CartPageClient />
      </div>
    </section>
  );
}

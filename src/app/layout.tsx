import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/sora";
import "./globals.css";
import "./storefront-refinement.css";
import { CartProvider } from "@/components/cart-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { MotionController } from "@/components/motion-controller";
import { siteConfig } from "@/lib/site";
import { getStorefrontCatalog } from "@/lib/bilbildin/provider";
import { getBilbildinMode } from "@/lib/bilbildin/config";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "VYVO — Lo imaginás. Lo hacemos VYVO.",
    template: "%s | VYVO",
  },
  description: siteConfig.description,
  applicationName: "VYVO",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: "VYVO — Lo imaginás. Lo hacemos VYVO.",
    description: siteConfig.description,
    images: [{ url: "/landing/hero-family-concept-v1.png", width: 1536, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VYVO — Lo imaginás. Lo hacemos VYVO.",
    description: siteConfig.description,
    images: ["/landing/hero-family-concept-v1.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAFAF7",
  colorScheme: "light",
};

export const revalidate = 60;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const catalog = await getStorefrontCatalog();
  const commerceMode = getBilbildinMode(process.env);

  return (
    <html lang="es-CR" data-scroll-behavior="smooth">
      <body>
        <CartProvider catalog={catalog} mode={commerceMode}>
          <a href="#contenido" className="skip-link">
            Saltar al contenido
          </a>
          <Header />
          <main id="contenido">{children}</main>
          <Footer />
          <MotionController />
        </CartProvider>
      </body>
    </html>
  );
}

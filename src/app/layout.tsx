import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "@fontsource-variable/inter";
import "@fontsource-variable/sora";
import "./globals.css";
import "./storefront-refinement.css";
import { CartProvider } from "@/components/cart-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { JsonLd } from "@/components/json-ld";
import { MotionController } from "@/components/motion-controller";
import {
  buildGraph,
  organizationNode,
  websiteNode,
} from "@/lib/seo/structured-data";
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
  // Antes acá iba /landing/hero-family-concept-v1.png: 1.6 MB en 1672x941. Las redes
  // esperan 1200x630 y recortan cualquier otra proporción; además ese peso hace que
  // varias ni generen la vista previa. La versión derivada pesa 57 KB.
  openGraph: {
    type: "website",
    url: "/",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: "VYVO — Lo imaginás. Lo hacemos VYVO.",
    description: siteConfig.description,
    images: [
      {
        url: "/og/vyvo-og.jpg",
        width: 1200,
        height: 630,
        alt: "Figuras coleccionables VYVO diseñadas y terminadas en Costa Rica.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VYVO — Lo imaginás. Lo hacemos VYVO.",
    description: siteConfig.description,
    images: ["/og/vyvo-og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  keywords: [
    "figuras coleccionables Costa Rica",
    "figuras personalizadas Costa Rica",
    "impresión 3D Costa Rica",
    "figuras articuladas",
    "regalos personalizados Costa Rica",
    "coleccionables originales",
    "VYVO",
  ],
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
        {/* Marca y sitio: van en el layout porque describen a VYVO entero, no a una
            ruta. Las páginas agregan encima su propio nodo (Product, ItemList…). */}
        <JsonLd graph={buildGraph([organizationNode(), websiteNode()])} />
        <CartProvider catalog={catalog} mode={commerceMode}>
          <a href="#contenido" className="skip-link">
            Saltar al contenido
          </a>
          <Header />
          <main id="contenido">{children}</main>
          <Footer />
          <MotionController />
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}

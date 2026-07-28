import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/sora";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { siteConfig } from "@/lib/site";

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CR" data-scroll-behavior="smooth">
      <body>
        <CartProvider>
          <a href="#contenido" className="skip-link">
            Saltar al contenido
          </a>
          <Header />
          <main id="contenido">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}

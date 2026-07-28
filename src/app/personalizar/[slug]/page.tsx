import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomizationBuilder } from "@/components/customization-builder";
import {
  customizationProfiles,
  getCustomizationProfile,
} from "@/data/customization";
import { getStorefrontProduct } from "@/data/storefront";

type CustomizationPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return customizationProfiles.map((profile) => ({ slug: profile.slug }));
}

export async function generateMetadata({
  params,
}: CustomizationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getStorefrontProduct(slug);
  const profile = getCustomizationProfile(slug);
  if (!product || !profile) return {};

  return {
    title: profile.title,
    description: `Prepará una configuración demostrativa de ${product.name} y revisala en el carrito VYVO.`,
    alternates: { canonical: `/personalizar/${slug}` },
    robots: { index: false, follow: true },
  };
}

export default async function CustomizationPage({
  params,
}: CustomizationPageProps) {
  const { slug } = await params;
  const product = getStorefrontProduct(slug);
  const profile = getCustomizationProfile(slug);

  if (!product || !profile || !product.customization) notFound();

  return <CustomizationBuilder product={product} profile={profile} />;
}

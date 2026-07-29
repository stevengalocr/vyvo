import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomizationBuilder } from "@/components/customization-builder";
import {
  customizationProfiles,
  getCustomizationProfile,
} from "@/data/customization";
import { getBilbildinMode } from "@/lib/bilbildin/config";
import { getStorefrontProduct } from "@/lib/bilbildin/provider";
import { getCommerceExperience } from "@/lib/commerce/experience";

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
  const product = await getStorefrontProduct(slug);
  const profile = getCustomizationProfile(slug);
  if (!product || !profile) return {};
  const experience = getCommerceExperience(getBilbildinMode(process.env));

  return {
    title: profile.title,
    description: `${experience.customization.metadataPrefix} ${product.name} y revisala en el carrito VYVO.`,
    alternates: { canonical: `/personalizar/${slug}` },
    robots: { index: false, follow: true },
  };
}

export default async function CustomizationPage({
  params,
}: CustomizationPageProps) {
  const { slug } = await params;
  const product = await getStorefrontProduct(slug);
  const profile = getCustomizationProfile(slug);

  if (!product || !profile || !product.customization) notFound();

  return <CustomizationBuilder product={product} profile={profile} />;
}

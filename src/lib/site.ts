export const siteConfig = {
  name: "VYVO",
  description:
    "Figuras, personajes y recuerdos personalizables, articulados y coleccionables, diseñados y terminados en Costa Rica.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "es_CR",
  email: null,
  whatsapp: null,
  socials: {
    instagram: null,
    tiktok: null,
  },
  flags: {
    socialProof: false,
    analytics: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true",
  },
} as const;

export const primaryNavigation = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/personalizar", label: "Personalizar" },
  { href: "/drops", label: "Drops" },
] as const;

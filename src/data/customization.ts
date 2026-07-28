export type CustomizationField = {
  id: string;
  label: string;
  help: string;
  kind: "text" | "select" | "textarea";
  placeholder?: string;
  maxLength?: number;
  options?: readonly string[];
};

export type CustomizationProfile = {
  slug: string;
  title: string;
  intro: string;
  fields: readonly CustomizationField[];
};

export const customizationProfiles: readonly CustomizationProfile[] = [
  {
    slug: "vyvo-shift",
    title: "Configurá tu SHIFT",
    intro:
      "Definí la identidad modular de la pieza. La ingeniería y la disponibilidad final se confirman después del concepto.",
    fields: [
      {
        id: "palette",
        label: "Paleta principal",
        help: "Elegí una dirección inicial; los tonos exactos se validan después.",
        kind: "select",
        options: [
          "Negro + violeta",
          "Blanco + violeta",
          "Negro + naranja",
          "Paleta propia por validar",
        ],
      },
      {
        id: "module",
        label: "Módulo de identidad",
        help: "El elemento que más debe expresar el carácter de tu SHIFT.",
        kind: "select",
        options: ["Exploración", "Movimiento", "Tecnología", "Forma original"],
      },
      {
        id: "symbol",
        label: "Símbolo o inicial",
        help: "No usamos marcas ni personajes protegidos sin autorización.",
        kind: "text",
        placeholder: "Ej. V, SG o una forma propia",
        maxLength: 24,
      },
      {
        id: "shortName",
        label: "Nombre corto",
        help: "Así identificaremos esta configuración.",
        kind: "text",
        placeholder: "Ej. SHIFT VECTOR",
        maxLength: 28,
      },
    ],
  },
  {
    slug: "vyvo-arena",
    title: "Configurá tu ARENA",
    intro:
      "Traducí una pasión deportiva a un personaje original sin depender de escudos o marcas no autorizadas.",
    fields: [
      {
        id: "discipline",
        label: "Disciplina",
        help: "Define la silueta, el gesto y el accesorio inicial.",
        kind: "select",
        options: ["Fútbol", "Baloncesto", "Running", "Ciclismo", "Otra por validar"],
      },
      {
        id: "colors",
        label: "Colores principales",
        help: "Describí hasta tres colores, sin necesidad de indicar un club o marca.",
        kind: "text",
        placeholder: "Ej. verde, negro y blanco",
        maxLength: 48,
      },
      {
        id: "number",
        label: "Número",
        help: "Puede ser un dorsal, una fecha breve o un número significativo.",
        kind: "text",
        placeholder: "Ej. 10",
        maxLength: 4,
      },
      {
        id: "shortName",
        label: "Nombre corto",
        help: "El nombre que aparecería en la tarjeta de configuración.",
        kind: "text",
        placeholder: "Ej. ARENA GALO",
        maxLength: 28,
      },
    ],
  },
  {
    slug: "vyvo-nexo",
    title: "Configurá tu NEXO",
    intro:
      "Convertí el carácter de una mascota en un compañero VYVO original, sin prometer una copia literal.",
    fields: [
      {
        id: "companionName",
        label: "Nombre de tu compañero",
        help: "Nos ayuda a darle identidad a la configuración.",
        kind: "text",
        placeholder: "Ej. Milo",
        maxLength: 28,
      },
      {
        id: "species",
        label: "Tipo de compañero",
        help: "Es el punto de partida para la silueta.",
        kind: "select",
        options: ["Perro", "Gato", "Conejo", "Ave", "Otro por validar"],
      },
      {
        id: "personality",
        label: "Personalidad dominante",
        help: "Elegí la energía que más debería sentirse en la pieza.",
        kind: "select",
        options: ["Curioso", "Protector", "Juguetón", "Sereno", "Aventurero"],
      },
      {
        id: "distinctiveTrait",
        label: "Rasgo que no puede faltar",
        help: "Contanos un detalle físico o de comportamiento realmente importante.",
        kind: "textarea",
        placeholder: "Ej. siempre inclina una oreja cuando escucha su nombre",
        maxLength: 180,
      },
    ],
  },
] as const;

export function getCustomizationProfile(slug: string) {
  return customizationProfiles.find((profile) => profile.slug === slug);
}

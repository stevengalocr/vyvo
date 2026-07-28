export type Accent = "purple" | "orange" | "green" | "white";

export type ProductLine =
  | "mini"
  | "mini_custom"
  | "mini_sport"
  | "companion"
  | "drop";

export type ProductStatus =
  | "concept_approved"
  | "modeling"
  | "prototype"
  | "costing"
  | "photography"
  | "ready_for_sale"
  | "published"
  | "paused"
  | "archived";

export type Availability =
  | "in_stock"
  | "made_to_order"
  | "preorder"
  | "upcoming"
  | "sold_out"
  | "closed_edition";

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  originsNumber: string;
  displayOrder: number;
  line: ProductLine;
  lineLabel: string;
  accent: Accent;
  status: ProductStatus;
  availability: Availability;
  descriptor: string;
  shortDescription: string;
  longDescription: string;
  quote: string;
  cta: string;
  sizeTarget: string;
  image: string;
  alt: string;
  tags: string[];
  included: string[];
  customization?: string[];
  packagingTier: "Essential" | "Signature" | "Collector" | "One";
}

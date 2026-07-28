-- VYVO V1 public schema
-- All tables exposed to the Data API use RLS. No service-role key is required
-- by the public application. Internal costing stays outside the exposed schema.

create extension if not exists pgcrypto;
create schema if not exists private;

create type public.product_status as enum (
  'concept_approved',
  'modeling',
  'prototype',
  'costing',
  'photography',
  'ready_for_sale',
  'published',
  'paused',
  'archived'
);

create type public.availability_mode as enum (
  'in_stock',
  'made_to_order',
  'preorder',
  'upcoming',
  'sold_out',
  'closed_edition'
);

create type public.product_line as enum (
  'mini',
  'mini_custom',
  'mini_sport',
  'companion',
  'drop'
);

create type public.media_kind as enum (
  'catalog_primary',
  'front_three_quarter',
  'rear_three_quarter',
  'side_profile',
  'articulation_macro',
  'material_macro',
  'scale_reference',
  'included_items',
  'packaging',
  'motion_video',
  'social_4x5',
  'story_9x16'
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  accent_color text not null default '#6F2CFF',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collections_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references public.collections(id) on delete set null,
  name text not null,
  slug text not null unique,
  sku_base text not null unique,
  display_order integer not null,
  origins_number integer,
  line public.product_line not null,
  status public.product_status not null default 'concept_approved',
  availability public.availability_mode not null default 'upcoming',
  accent_color text not null,
  short_description text not null,
  long_description text not null,
  character_quote text not null default '',
  size_target text,
  age_recommendation text not null default '14+ provisional',
  packaging_tier text not null,
  included_items jsonb not null default '[]'::jsonb,
  customization_options jsonb not null default '[]'::jsonb,
  seo_title text,
  seo_description text,
  is_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint products_origins_number_valid check (
    origins_number is null or (origins_number > 0 and origins_number <> 7)
  ),
  constraint products_included_array check (jsonb_typeof(included_items) = 'array'),
  constraint products_customization_array check (jsonb_typeof(customization_options) = 'array')
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  sku text not null unique,
  color_name text,
  public_price numeric(12, 2),
  compare_at_price numeric(12, 2),
  availability public.availability_mode not null default 'upcoming',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint variants_price_nonnegative check (
    (public_price is null or public_price >= 0)
    and (compare_at_price is null or compare_at_price >= 0)
  ),
  constraint variants_sale_requires_price check (
    not is_active or public_price is not null
  )
);

create table public.editions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  name text not null,
  edition_size integer,
  edition_status public.availability_mode not null default 'upcoming',
  serial_required boolean not null default false,
  opens_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint editions_positive_size check (edition_size is null or edition_size > 0),
  constraint editions_date_order check (
    closes_at is null or opens_at is null or closes_at > opens_at
  )
);

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  kind public.media_kind not null,
  storage_path text not null,
  alt_text text not null,
  is_concept boolean not null default true,
  display_order integer not null default 0,
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  constraint media_dimensions_positive check (
    (width is null or width > 0) and (height is null or height > 0)
  ),
  unique (product_id, kind, storage_path)
);

create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  product_slug text,
  source text not null default 'website',
  consent_marketing boolean not null default false,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint waitlist_email_shape check (
    char_length(email) between 3 and 254 and email like '%_@_%.__%'
  ),
  constraint waitlist_consent_timestamp check (
    (consent_marketing and consent_at is not null)
    or (not consent_marketing and consent_at is null)
  )
);

create unique index waitlist_email_product_unique
  on public.waitlist_entries (lower(email), coalesce(product_slug, ''));

create table public.customization_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  route text not null,
  status text not null default 'draft',
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customization_route check (route in ('shift', 'arena', 'nexo', 'you', 'one')),
  constraint customization_answers_object check (jsonb_typeof(answers) = 'object')
);

create table public.site_content (
  id uuid primary key default gen_random_uuid(),
  content_key text not null unique,
  locale text not null default 'es-CR',
  payload jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_content_payload_object check (jsonb_typeof(payload) = 'object')
);

create table private.product_costs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  target_price_min numeric(12, 2),
  target_price_max numeric(12, 2),
  calculated_cost numeric(12, 2),
  assumptions jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default now(),
  constraint product_costs_nonnegative check (
    (target_price_min is null or target_price_min >= 0)
    and (target_price_max is null or target_price_max >= 0)
    and (calculated_cost is null or calculated_cost >= 0)
  )
);

create index products_collection_id_idx on public.products(collection_id);
create index products_line_idx on public.products(line);
create index products_visibility_order_idx on public.products(is_visible, display_order);
create index product_variants_product_id_idx on public.product_variants(product_id);
create index editions_product_id_idx on public.editions(product_id);
create index product_media_product_order_idx on public.product_media(product_id, display_order);
create index customization_drafts_user_id_idx on public.customization_drafts(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

create trigger collections_set_updated_at
before update on public.collections
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger variants_set_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

create trigger editions_set_updated_at
before update on public.editions
for each row execute function public.set_updated_at();

create trigger customization_drafts_set_updated_at
before update on public.customization_drafts
for each row execute function public.set_updated_at();

create trigger site_content_set_updated_at
before update on public.site_content
for each row execute function public.set_updated_at();

alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.editions enable row level security;
alter table public.product_media enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.customization_drafts enable row level security;
alter table public.site_content enable row level security;
alter table private.product_costs enable row level security;

create policy "Published collections are public"
on public.collections for select
to anon, authenticated
using (is_published);

create policy "Visible products are public"
on public.products for select
to anon, authenticated
using (is_visible and status not in ('paused', 'archived'));

create policy "Active variants of visible products are public"
on public.product_variants for select
to anon, authenticated
using (
  is_active
  and exists (
    select 1
    from public.products
    where products.id = product_variants.product_id
      and products.is_visible
      and products.status not in ('paused', 'archived')
  )
);

create policy "Editions of visible products are public"
on public.editions for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = editions.product_id
      and products.is_visible
      and products.status not in ('paused', 'archived')
  )
);

create policy "Media of visible products are public"
on public.product_media for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_media.product_id
      and products.is_visible
      and products.status not in ('paused', 'archived')
  )
);

create policy "Anyone may join the waitlist with explicit consent"
on public.waitlist_entries for insert
to anon, authenticated
with check (
  consent_marketing
  and consent_at is not null
  and char_length(email) between 3 and 254
);

create policy "Users can read their own customization drafts"
on public.customization_drafts for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own customization drafts"
on public.customization_drafts for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own customization drafts"
on public.customization_drafts for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own draft customizations"
on public.customization_drafts for delete
to authenticated
using ((select auth.uid()) = user_id and status = 'draft');

create policy "Published site content is public"
on public.site_content for select
to anon, authenticated
using (is_published and published_at is not null);

grant usage on schema public to anon, authenticated;
grant select on public.collections, public.products, public.product_variants,
  public.editions, public.product_media, public.site_content to anon, authenticated;
grant insert on public.waitlist_entries to anon, authenticated;
grant select, insert, update, delete on public.customization_drafts to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'customization-references',
  'customization-references',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can read their own customization references"
on storage.objects for select
to authenticated
using (
  bucket_id = 'customization-references'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can upload their own customization references"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'customization-references'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can update their own customization references"
on storage.objects for update
to authenticated
using (
  bucket_id = 'customization-references'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'customization-references'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can delete their own customization references"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'customization-references'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

insert into public.collections (
  id, name, slug, description, accent_color, is_published
) values (
  '822c6312-32fc-4a87-b803-a2ef2cb5ea01',
  'Origins',
  'origins',
  'La primera transmisión del universo VYVO.',
  '#6F2CFF',
  true
);

insert into public.products (
  id, collection_id, name, slug, sku_base, display_order, origins_number,
  line, status, availability, accent_color, short_description,
  long_description, character_quote, size_target, packaging_tier,
  included_items, customization_options, seo_title, seo_description, is_visible
) values
(
  '14d10531-d6fc-45a9-9c74-1ff15c657001',
  '822c6312-32fc-4a87-b803-a2ef2cb5ea01',
  'CORE', 'vyvo-core', 'VYV-MINI-CORE-001', 1, 1, 'mini',
  'concept_approved', 'upcoming', '#6F2CFF',
  'El primer guardián del universo VYVO.',
  'CORE representa la imaginación justo antes de cobrar vida.',
  'Todo comienza con una idea. CORE la pone en movimiento.',
  '16–18 cm, sujeto a prototipo', 'Signature',
  '["Figura articulada","Módulo posterior","Base","Sticker","Tarjeta"]',
  '[]', 'VYVO CORE — Origins 001', 'Concepto VYVO CORE en desarrollo.', true
),
(
  '14d10531-d6fc-45a9-9c74-1ff15c657002',
  '822c6312-32fc-4a87-b803-a2ef2cb5ea01',
  'RUSH', 'vyvo-rush', 'VYV-MINI-RUSH-002', 2, 2, 'mini',
  'concept_approved', 'upcoming', '#FF5A1F',
  'Energía y movimiento convertidos en personaje.',
  'RUSH crea el camino mientras avanza.',
  'Si existe un camino, RUSH lo recorre. Si no existe, lo crea.',
  '16–18 cm, sujeto a prototipo', 'Signature',
  '["Figura articulada","Módulo RUSH","Base","Sticker","Tarjeta"]',
  '[]', 'VYVO RUSH — Origins 002', 'Concepto VYVO RUSH en desarrollo.', true
),
(
  '14d10531-d6fc-45a9-9c74-1ff15c657003',
  '822c6312-32fc-4a87-b803-a2ef2cb5ea01',
  'WILD', 'vyvo-wild', 'VYV-MINI-WILD-003', 3, 3, 'mini',
  'concept_approved', 'upcoming', '#79C943',
  'El explorador paciente del universo VYVO.',
  'WILD lleva la señal fuera del mapa.',
  'Todo territorio nuevo empieza con un primer paso.',
  '16–18 cm, sujeto a prototipo', 'Signature',
  '["Figura articulada","Módulos de expedición","Base","Sticker","Tarjeta"]',
  '[]', 'VYVO WILD — Origins 003', 'Concepto VYVO WILD en desarrollo.', true
),
(
  '14d10531-d6fc-45a9-9c74-1ff15c657004',
  '822c6312-32fc-4a87-b803-a2ef2cb5ea01',
  'ECHO', 'vyvo-echo', 'VYV-MINI-ECHO-004', 4, 4, 'mini',
  'concept_approved', 'upcoming', '#6F2CFF',
  'Ritmo, señal y conexión en movimiento.',
  'ECHO interpreta el pulso de Origins.',
  'Lo que imaginás también puede resonar.',
  '16–18 cm, sujeto a prototipo', 'Signature',
  '["Figura articulada","Módulos ECHO","Base","Sticker","Tarjeta"]',
  '[]', 'VYVO ECHO — Origins 004', 'Concepto VYVO ECHO en desarrollo.', true
),
(
  '14d10531-d6fc-45a9-9c74-1ff15c657005',
  '822c6312-32fc-4a87-b803-a2ef2cb5ea01',
  'SHIFT', 'vyvo-shift', 'VYV-CUSTOM-SHIFT-005', 5, 5, 'mini_custom',
  'concept_approved', 'upcoming', '#6F2CFF',
  'La plataforma modular de Origins.',
  'SHIFT transforma módulos alrededor de una identidad.',
  'Tu versión no tiene por qué parecerse a ninguna otra.',
  '16–18 cm, sujeto a configuración y prototipo', 'Signature',
  '["Figura modular","Set inicial de piezas","Base","Tarjeta"]',
  '["Paleta aprobada","Módulos exteriores","Símbolo personal","Nombre corto"]',
  'VYVO SHIFT — Origins 005', 'Concepto modular VYVO SHIFT en desarrollo.', true
),
(
  '14d10531-d6fc-45a9-9c74-1ff15c657006',
  '822c6312-32fc-4a87-b803-a2ef2cb5ea01',
  'NOVA', 'vyvo-nova', 'VYV-MINI-NOVA-006', 6, 6, 'mini',
  'concept_approved', 'upcoming', '#FF5A1F',
  'El visionario de Origins.',
  'NOVA mira hacia aquello que todavía no tiene nombre.',
  'El próximo universo empieza donde termina el mapa.',
  '16–18 cm, sujeto a prototipo', 'Signature',
  '["Figura articulada","Accesorios de exploración","Base","Sticker","Tarjeta"]',
  '[]', 'VYVO NOVA — Origins 006', 'Concepto VYVO NOVA en desarrollo.', true
),
(
  '14d10531-d6fc-45a9-9c74-1ff15c657008',
  '822c6312-32fc-4a87-b803-a2ef2cb5ea01',
  'ARENA', 'vyvo-arena', 'VYV-SPORT-ARENA-008', 7, 8, 'mini_sport',
  'concept_approved', 'upcoming', '#79C943',
  'Tu pasión también tiene uniforme.',
  'ARENA convierte movimiento y pertenencia en una pieza personal.',
  'Lo que defendés también puede cobrar vida.',
  '16–18 cm, sujeto a configuración y prototipo', 'Signature',
  '["Figura deportiva","Accesorio de disciplina","Base","Tarjeta"]',
  '["Disciplina","Colores","Número","Nombre corto","Pose objetivo"]',
  'VYVO ARENA — Origins 008', 'Concepto deportivo VYVO ARENA en desarrollo.', true
),
(
  '14d10531-d6fc-45a9-9c74-1ff15c657009',
  '822c6312-32fc-4a87-b803-a2ef2cb5ea01',
  'NEXO', 'vyvo-nexo', 'VYV-COMP-NEXO-009', 8, 9, 'companion',
  'concept_approved', 'upcoming', '#FF5A1F',
  'El primer compañero robótico VYVO.',
  'NEXO interpreta el vínculo con una mascota.',
  'Siempre cerca. Siempre parte de tu historia.',
  '14–17 cm, sujeto a referencias y prototipo', 'Signature',
  '["Figura compañero","Base","Placa de nombre","Tarjeta"]',
  '["Especie y silueta","Rasgos distintivos","Paleta","Nombre","Accesorio autorizado"]',
  'VYVO NEXO — Origins 009', 'Concepto companion VYVO NEXO en desarrollo.', true
),
(
  '14d10531-d6fc-45a9-9c74-1ff15c657010',
  '822c6312-32fc-4a87-b803-a2ef2cb5ea01',
  'ABYSS', 'vyvo-abyss', 'VYV-DROP-ABYSS-010', 9, 10, 'drop',
  'concept_approved', 'upcoming', '#6F2CFF',
  'El guardián premium de Origins.',
  'ABYSS expande el lenguaje VYVO hacia una pieza de mayor presencia.',
  'Algunas ideas no llegan. Emergen.',
  '22–26 cm, sujeto a ingeniería y prototipo', 'Collector',
  '["Figura de escala premium","Base","Tarjeta","Empaque Collector"]',
  '[]', 'VYVO ABYSS — Origins 010', 'Concepto premium VYVO ABYSS en desarrollo.', true
);

insert into public.site_content (
  content_key, payload, is_published, published_at
) values (
  'home.hero',
  jsonb_build_object(
    'eyebrow', 'Figuras hechas en Costa Rica.',
    'title', 'Lo imaginás. Lo hacemos VYVO.',
    'body', 'Personas, mascotas, ideas y universos originales convertidos en figuras.'
  ),
  true,
  now()
);

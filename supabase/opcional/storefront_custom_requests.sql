-- Encargos personalizados de VYVO (pedidos sin precio)
--
-- Contexto. `create_storefront_order` calcula el subtotal desde el precio del catálogo
-- y descuenta inventario, así que solo sirve para piezas que ya existen y ya tienen
-- precio. Un encargo personalizado no tiene ninguna de las dos cosas: el cliente manda
-- su idea, VYVO la revisa y recién ahí define alcance, precio y plazo.
--
-- Por qué una tabla propia y no una fila en `orders`. Un encargo sin precio obligaría a
-- inventar valores para columnas cuyas restricciones (`payment_method`, `status`,
-- `payment_status`) pertenecen al dominio de BilBildin. Escribir ahí a ciegas es la
-- clase de cosa que falla en producción y ensucia los reportes de ventas. Esta tabla es
-- puramente aditiva: no toca ni una estructura existente. Cuando VYVO cotiza el encargo
-- y el cliente acepta, BilBildin puede crear el pedido real por su flujo normal y
-- enlazarlo con `converted_order_id`.
--
-- Aplicar con:  supabase db push   (o pegar en el SQL editor del proyecto)

create table if not exists public.storefront_custom_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.store_customers(id) on delete set null,
  reference text not null unique,
  status text not null default 'pending_review',
  channel text not null default 'web',
  source text not null default 'vyvo-storefront',

  -- Datos de contacto desnormalizados: si el cliente se borra, el encargo sigue siendo
  -- legible para quien lo tenga que atender.
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,

  -- La idea del cliente tal como la escribió, más el producto base si partió de uno.
  brief jsonb not null default '{}'::jsonb,
  -- URLs de las imágenes de referencia que subió (bucket vyvo-custom-references).
  reference_images jsonb not null default '[]'::jsonb,

  converted_order_id uuid references public.orders(id) on delete set null,
  quoted_amount numeric(12, 2),
  quoted_currency text,
  internal_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint storefront_custom_requests_status_check
    check (status in ('pending_review', 'quoted', 'accepted', 'declined', 'archived')),
  constraint storefront_custom_requests_brief_object
    check (jsonb_typeof(brief) = 'object'),
  constraint storefront_custom_requests_images_array
    check (jsonb_typeof(reference_images) = 'array')
);

create index if not exists storefront_custom_requests_business_created_idx
  on public.storefront_custom_requests (business_id, created_at desc);

create index if not exists storefront_custom_requests_status_idx
  on public.storefront_custom_requests (business_id, status);

alter table public.storefront_custom_requests enable row level security;

-- Sin políticas a propósito: nadie llega por PostgREST. El único camino es la función
-- de abajo, que corre como `security definer` y solo puede invocar `service_role`.

comment on table public.storefront_custom_requests is
'Encargos personalizados recibidos desde la tienda pública de VYVO. Llegan sin precio: VYVO cotiza después de revisarlos.';

-- ---------------------------------------------------------------------------

create or replace function public.create_storefront_custom_request(
  p_business_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_id constant uuid := p_business_id;
  v_business record;
  v_customer_id uuid;
  v_request_id uuid;
  v_reference text;
  v_images jsonb;
  v_brief jsonb;
  v_email text;
begin
  if jsonb_typeof(p_payload) <> 'object'
    or jsonb_typeof(p_payload->'customer') <> 'object'
    or jsonb_typeof(p_payload->'brief') <> 'object'
  then
    raise exception 'invalid_custom_request_payload';
  end if;

  select id, account_status
  into v_business
  from public.businesses
  where id = v_business_id
    and account_status = 'active';

  if not found then
    raise exception 'store_not_active';
  end if;

  v_email := lower(trim(p_payload->'customer'->>'email'));
  if v_email is null or v_email = '' or position('@' in v_email) = 0 then
    raise exception 'invalid_custom_request_payload';
  end if;

  if coalesce(length(trim(p_payload->'brief'->>'idea')), 0) < 20 then
    raise exception 'invalid_custom_request_payload';
  end if;

  v_images := coalesce(p_payload->'reference_images', '[]'::jsonb);
  if jsonb_typeof(v_images) <> 'array' or jsonb_array_length(v_images) > 5 then
    raise exception 'invalid_custom_request_payload';
  end if;

  -- Mismo criterio de deduplicación que `create_storefront_order`: un cliente por
  -- correo dentro del negocio.
  select id
  into v_customer_id
  from public.store_customers
  where business_id = v_business_id
    and lower(email) = v_email
  order by created_at
  limit 1;

  if v_customer_id is null then
    insert into public.store_customers (business_id, name, email, phone)
    values (
      v_business_id,
      left(p_payload->'customer'->>'name', 140),
      v_email,
      left(p_payload->'customer'->>'phone', 24)
    )
    returning id into v_customer_id;
  else
    update public.store_customers
    set
      name = left(p_payload->'customer'->>'name', 140),
      phone = left(p_payload->'customer'->>'phone', 24)
    where id = v_customer_id
      and business_id = v_business_id;
  end if;

  v_reference :=
    'VYVO-ENC-' ||
    to_char(timezone('America/Costa_Rica', now()), 'YYYYMMDD') ||
    '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  v_brief := jsonb_strip_nulls(
    jsonb_build_object(
      'idea', left(p_payload->'brief'->>'idea', 4000),
      'recipient', left(p_payload->'brief'->>'recipient', 180),
      'occasion', left(p_payload->'brief'->>'occasion', 180),
      'size_hint', left(p_payload->'brief'->>'size_hint', 180),
      'deadline_hint', left(p_payload->'brief'->>'deadline_hint', 180),
      'base_product_slug', left(p_payload->'brief'->>'base_product_slug', 80),
      'answers', p_payload->'brief'->'answers'
    )
  );

  insert into public.storefront_custom_requests (
    business_id,
    customer_id,
    reference,
    customer_name,
    customer_email,
    customer_phone,
    brief,
    reference_images,
    source
  )
  values (
    v_business_id,
    v_customer_id,
    v_reference,
    left(p_payload->'customer'->>'name', 140),
    v_email,
    left(p_payload->'customer'->>'phone', 24),
    v_brief,
    v_images,
    coalesce(left(p_payload->>'source', 60), 'vyvo-storefront')
  )
  returning id into v_request_id;

  return jsonb_build_object(
    'requestId', v_request_id,
    'reference', v_reference,
    'status', 'pending_review'
  );
end;
$$;

revoke all on function public.create_storefront_custom_request(uuid, jsonb)
from public, anon, authenticated;

grant execute on function public.create_storefront_custom_request(uuid, jsonb)
to service_role;

comment on function public.create_storefront_custom_request(uuid, jsonb) is
'Registra un encargo personalizado de la tienda VYVO. No calcula precio ni toca inventario: VYVO cotiza después de revisar la idea.';

-- ---------------------------------------------------------------------------
-- Almacenamiento de las imágenes de referencia.
--
-- Bucket privado: las fotos las manda gente real (su mascota, su familia) y no tienen
-- por qué quedar expuestas en una URL adivinable. La tienda sube con `service_role`
-- desde el servidor y BilBildin las lee con URL firmada.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vyvo-custom-references',
  'vyvo-custom-references',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

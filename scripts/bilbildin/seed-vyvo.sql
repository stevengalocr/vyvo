begin;

select pg_advisory_xact_lock(
  hashtextextended('bilbildin:seed:vyvo:vyvocr.com', 0)
);

do $$
begin
  if exists (
    select 1
    from public.businesses
    where id <> '14d10531-d6fc-45a9-9c74-1ff15c657099'::uuid
      and (
        lower(owner_email) = 'vyvocr@gmail.com'
        or lower(name) = 'vyvo'
        or lower(coalesce(custom_domain, '')) in ('vyvocr.com', 'www.vyvocr.com')
      )
  ) then
    raise exception 'VYVO already exists under another business id';
  end if;

  if exists (
    select 1
    from public.products
    where id in (
      '14d10531-d6fc-45a9-9c74-1ff15c657001'::uuid,
      '14d10531-d6fc-45a9-9c74-1ff15c657002'::uuid,
      '14d10531-d6fc-45a9-9c74-1ff15c657003'::uuid,
      '14d10531-d6fc-45a9-9c74-1ff15c657004'::uuid,
      '14d10531-d6fc-45a9-9c74-1ff15c657005'::uuid,
      '14d10531-d6fc-45a9-9c74-1ff15c657006'::uuid,
      '14d10531-d6fc-45a9-9c74-1ff15c657008'::uuid,
      '14d10531-d6fc-45a9-9c74-1ff15c657009'::uuid,
      '14d10531-d6fc-45a9-9c74-1ff15c657010'::uuid
    )
      and business_id <> '14d10531-d6fc-45a9-9c74-1ff15c657099'::uuid
  ) then
    raise exception 'One or more VYVO product ids belong to another tenant';
  end if;
end
$$;

insert into public.businesses (
  id,
  name,
  owner_email,
  plan_type,
  plan_status,
  account_status,
  custom_domain,
  theme_config
)
values (
  '14d10531-d6fc-45a9-9c74-1ff15c657099',
  'VYVO',
  'vyvocr@gmail.com',
  'starter',
  'active',
  'pending',
  'vyvocr.com',
  '{
    "brand": {
      "name": "VYVO",
      "site_url": "https://vyvocr.com",
      "primary_color": "#6D35FF",
      "accent_color": "#FF6B2C"
    },
    "commerce": {
      "currency": "CRC",
      "locale": "es-CR",
      "country": "CR",
      "payment_methods": ["sinpe", "transfer", "cash"],
      "payment_coordination_mode": "merchant_contacts_customer",
      "inventory_source": "bilbildin"
    },
    "contact": {
      "email": "vyvocr@gmail.com",
      "whatsapp_e164": "+50672874779"
    },
    "integration": {
      "storefront": "vyvocr.com",
      "client": "vyvo-nextjs",
      "catalog_version": 1
    }
  }'::jsonb
)
on conflict (id) do update
set
  name = excluded.name,
  owner_email = excluded.owner_email,
  plan_type = excluded.plan_type,
  custom_domain = excluded.custom_domain,
  theme_config = public.businesses.theme_config || excluded.theme_config;

insert into public.products (
  id,
  business_id,
  name,
  slug,
  description,
  short_description,
  price,
  cost_price,
  compare_at_price,
  images,
  status,
  category,
  tags,
  attributes,
  featured,
  stock_quantity
)
values
  (
    '14d10531-d6fc-45a9-9c74-1ff15c657001',
    '14d10531-d6fc-45a9-9c74-1ff15c657099',
    'CORE',
    'vyvo-core',
    'VYVO CORE representa la imaginación justo antes de cobrar vida. Su casco de doble V, cuerpo articulado y módulo tecnológico lo convierten en la pieza de entrada al universo Origins.',
    'El primer guardián del universo VYVO: preciso, curioso y listo para poner una idea en movimiento.',
    15000,
    7000,
    null,
    array['https://vyvocr.com/products/core/concept-primary.png'],
    'visible',
    'Collectibles',
    array['Articulado', 'Original VYVO', 'Escritorio'],
    '{"sku":"VYV-MINI-CORE-001","origins_number":"001","display_order":1,"line":"mini","line_label":"VYVO Mini","accent":"purple","sales_model":"standard","size_target":"16–18 cm","included":["Figura articulada","Módulo posterior","Base","Sticker","Tarjeta del personaje"]}'::jsonb,
    true,
    0
  ),
  (
    '14d10531-d6fc-45a9-9c74-1ff15c657002',
    '14d10531-d6fc-45a9-9c74-1ff15c657099',
    'RUSH',
    'vyvo-rush',
    'VYVO RUSH es movimiento convertido en personaje. Su silueta atlética, armadura angular y acentos naranja construyen una identidad dinámica dentro de Origins.',
    'Energía, cultura urbana y movimiento en una figura que crea el camino mientras avanza.',
    16000,
    7100,
    null,
    array['https://vyvocr.com/products/rush/concept-primary.png'],
    'visible',
    'Collectibles',
    array['Articulado', 'Action', 'Cultura urbana'],
    '{"sku":"VYV-MINI-RUSH-002","origins_number":"002","display_order":2,"line":"mini","line_label":"VYVO Mini","accent":"orange","sales_model":"standard","size_target":"16–18 cm","included":["Figura articulada","Módulo RUSH","Base","Sticker","Tarjeta del personaje"]}'::jsonb,
    true,
    0
  ),
  (
    '14d10531-d6fc-45a9-9c74-1ff15c657003',
    '14d10531-d6fc-45a9-9c74-1ff15c657099',
    'WILD',
    'vyvo-wild',
    'WILD lleva el universo VYVO fuera del mapa. Sus módulos de expedición, geometría protectora y energía verde hablan de curiosidad, naturaleza y descubrimiento.',
    'El explorador paciente de VYVO, preparado para adaptarse y encontrar lo que otros todavía no ven.',
    16500,
    7200,
    null,
    array['https://vyvocr.com/products/wild/concept-primary.png'],
    'visible',
    'Collectibles',
    array['Exploración', 'Articulado', 'Naturaleza'],
    '{"sku":"VYV-MINI-WILD-003","origins_number":"003","display_order":3,"line":"mini","line_label":"VYVO Mini","accent":"green","sales_model":"standard","size_target":"16–18 cm","included":["Figura articulada","Módulos de expedición","Base","Sticker","Tarjeta"]}'::jsonb,
    false,
    0
  ),
  (
    '14d10531-d6fc-45a9-9c74-1ff15c657004',
    '14d10531-d6fc-45a9-9c74-1ff15c657099',
    'ECHO',
    'vyvo-echo',
    'ECHO interpreta el pulso del universo VYVO. Su lenguaje visual mezcla señal, música y tecnología en una silueta articulada pensada para exhibirse en movimiento.',
    'Ritmo, sonido y conexión traducidos a una figura con módulos expresivos y carácter propio.',
    17000,
    7200,
    null,
    array['https://vyvocr.com/products/echo/concept-primary.png'],
    'visible',
    'Collectibles',
    array['Ritmo', 'Articulado', 'Tecnología'],
    '{"sku":"VYV-MINI-ECHO-004","origins_number":"004","display_order":4,"line":"mini","line_label":"VYVO Mini","accent":"purple","sales_model":"standard","size_target":"16–18 cm","included":["Figura articulada","Módulos ECHO","Base","Sticker","Tarjeta"]}'::jsonb,
    false,
    0
  ),
  (
    '14d10531-d6fc-45a9-9c74-1ff15c657005',
    '14d10531-d6fc-45a9-9c74-1ff15c657099',
    'SHIFT',
    'vyvo-shift',
    'SHIFT abre la puerta a una personalización por módulos, no a un simple cambio de color. Sus piezas, símbolos y acentos se combinan dentro de límites fabricables y aprobables.',
    'La plataforma modular de Origins: una base VYVO que se transforma alrededor de tu identidad.',
    20500,
    7800,
    null,
    array['https://vyvocr.com/products/shift/concept-primary.png'],
    'visible',
    'Personalizables',
    array['Modular', 'Personalizable', 'Bajo pedido'],
    '{"sku":"VYV-CUSTOM-SHIFT-005","origins_number":"005","display_order":5,"line":"mini_custom","line_label":"VYVO Mini Custom","accent":"white","sales_model":"made_to_order","size_target":"16–18 cm","included":["Figura modular","Set inicial de piezas","Base","Tarjeta de configuración"],"customization":["Paleta aprobada","Módulos exteriores","Símbolo personal","Nombre corto"]}'::jsonb,
    true,
    0
  ),
  (
    '14d10531-d6fc-45a9-9c74-1ff15c657006',
    '14d10531-d6fc-45a9-9c74-1ff15c657099',
    'NOVA',
    'vyvo-nova',
    'NOVA dirige su mirada hacia lo desconocido. Su silueta de exploración cósmica y accesorios técnicos celebran la ambición de convertir nuevas preguntas en objetos reales.',
    'El visionario de Origins, creado para explorar lo que todavía no tiene nombre.',
    18000,
    7400,
    null,
    array['https://vyvocr.com/products/nova/concept-primary.png'],
    'visible',
    'Collectibles',
    array['Exploración', 'Articulado', 'Cosmos'],
    '{"sku":"VYV-MINI-NOVA-006","origins_number":"006","display_order":6,"line":"mini","line_label":"VYVO Mini","accent":"orange","sales_model":"standard","size_target":"16–18 cm","included":["Figura articulada","Accesorios de exploración","Base","Sticker","Tarjeta"]}'::jsonb,
    false,
    0
  ),
  (
    '14d10531-d6fc-45a9-9c74-1ff15c657008',
    '14d10531-d6fc-45a9-9c74-1ff15c657099',
    'ARENA',
    'vyvo-arena',
    'ARENA celebra el movimiento y la pertenencia. Su flujo de personalización contempla disciplina, uniforme, dorsal y detalles aprobados sin depender de escudos o marcas sin licencia.',
    'Una figura deportiva que convierte colores, número y energía de equipo en una pieza personal.',
    22000,
    7800,
    null,
    array['https://vyvocr.com/products/arena/concept-primary.png'],
    'visible',
    'Personalizables',
    array['Deporte', 'Personalizable', 'Articulado'],
    '{"sku":"VYV-SPORT-ARENA-008","origins_number":"008","display_order":7,"line":"mini_sport","line_label":"VYVO Mini Sport","accent":"green","sales_model":"made_to_order","size_target":"16–18 cm","included":["Figura deportiva","Accesorio de disciplina","Base","Tarjeta personalizada"],"customization":["Disciplina","Colores","Número","Nombre corto","Pose objetivo"]}'::jsonb,
    true,
    0
  ),
  (
    '14d10531-d6fc-45a9-9c74-1ff15c657009',
    '14d10531-d6fc-45a9-9c74-1ff15c657099',
    'NEXO',
    'vyvo-nexo',
    'NEXO transforma el vínculo con una mascota en un compañero original del universo VYVO. El flujo parte de referencias privadas y busca carácter, no una promesa de semejanza absoluta.',
    'El primer compañero robótico VYVO, inspirado en la energía y los rasgos que hacen única a una mascota.',
    23500,
    8000,
    null,
    array['https://vyvocr.com/products/nexo/concept-primary.png'],
    'visible',
    'Personalizables',
    array['Mascotas', 'Compañero', 'Personalizable'],
    '{"sku":"VYV-COMP-NEXO-009","origins_number":"009","display_order":8,"line":"companion","line_label":"VYVO Companions","accent":"orange","sales_model":"made_to_order","size_target":"14–17 cm","included":["Figura compañero","Base","Placa de nombre","Tarjeta de historia"],"customization":["Especie y silueta","Rasgos distintivos","Paleta","Nombre","Accesorio autorizado"]}'::jsonb,
    true,
    0
  ),
  (
    '14d10531-d6fc-45a9-9c74-1ff15c657010',
    '14d10531-d6fc-45a9-9c74-1ff15c657099',
    'ABYSS',
    'vyvo-abyss',
    'ABYSS expande el lenguaje VYVO hacia una pieza de mayor presencia. Su edición, cantidad y seriales solo se activarán cuando producción y costeo reales lo permitan.',
    'El guardián premium de Origins: escala, misterio y seis extremidades en un concepto de drop.',
    25000,
    8000,
    null,
    array['https://vyvocr.com/products/abyss/concept-primary.png'],
    'visible',
    'Drops',
    array['Drop', 'Premium', 'Edición futura'],
    '{"sku":"VYV-DROP-ABYSS-010","origins_number":"010","display_order":9,"line":"drop","line_label":"VYVO Drops","accent":"purple","sales_model":"limited_drop","size_target":"22–26 cm","included":["Figura de escala premium","Base","Tarjeta de personaje","Empaque Collector"]}'::jsonb,
    true,
    0
  )
on conflict (id) do update
set
  business_id = excluded.business_id,
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  short_description = excluded.short_description,
  price = excluded.price,
  cost_price = excluded.cost_price,
  compare_at_price = excluded.compare_at_price,
  images = excluded.images,
  status = excluded.status,
  category = excluded.category,
  tags = excluded.tags,
  attributes = excluded.attributes,
  featured = excluded.featured,
  stock_quantity = excluded.stock_quantity,
  updated_at = now();

commit;

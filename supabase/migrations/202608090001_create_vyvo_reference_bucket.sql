-- Bucket para las fotos de referencia de encargos personalizados.
--
-- Es lo único que el flujo de encargos necesita en Supabase. El pedido en sí viaja por
-- `create_storefront_order_idempotent`, que ya existe: el encargo se cobra contra un
-- producto "VYVO You · Encargo personalizado" en ₡0 y llega a la lista de pedidos
-- normal de BilBildin, que es donde VYVO trabaja todos los días.
--
-- Privado a propósito. Son fotos que manda gente real —su mascota, su familia, un
-- dibujo de su hijo— y no tienen por qué quedar en una URL adivinable. La tienda sube
-- desde el servidor con `service_role`; BilBildin las abre con URL firmada.
--
-- Si preferís no correr migraciones, este bucket se crea igual desde
-- Supabase → Storage → New bucket, con estos mismos valores.

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

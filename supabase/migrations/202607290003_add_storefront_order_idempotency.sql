create table if not exists public.storefront_order_requests (
  business_id uuid not null references public.businesses(id),
  idempotency_key uuid not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (business_id, idempotency_key)
);

alter table public.storefront_order_requests enable row level security;

create or replace function public.create_storefront_order_idempotent(
  p_business_id uuid,
  p_idempotency_key uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(
      'storefront-order:' || p_business_id::text || ':' || p_idempotency_key::text,
      0
    )
  );

  select result
  into v_result
  from public.storefront_order_requests
  where business_id = p_business_id
    and idempotency_key = p_idempotency_key;

  if v_result is not null then
    return v_result;
  end if;

  v_result := public.create_storefront_order(p_business_id, p_payload);

  insert into public.storefront_order_requests (
    business_id,
    idempotency_key,
    result
  )
  values (
    p_business_id,
    p_idempotency_key,
    v_result
  );

  return v_result;
end;
$$;

revoke all on table public.storefront_order_requests
from public, anon, authenticated;

revoke all on function public.create_storefront_order_idempotent(uuid, uuid, jsonb)
from public, anon, authenticated;

grant execute on function public.create_storefront_order_idempotent(uuid, uuid, jsonb)
to service_role;

comment on table public.storefront_order_requests is
'Server-only idempotency ledger for storefront order attempts.';

comment on function public.create_storefront_order_idempotent(uuid, uuid, jsonb) is
'Serializes retries and returns the original atomic order result for the same tenant and key.';

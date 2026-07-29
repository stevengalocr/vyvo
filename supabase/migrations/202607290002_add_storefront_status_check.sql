create or replace function public.is_storefront_business_active(
  p_business_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.businesses
    where id = p_business_id
      and account_status = 'active'
      and plan_status = 'active'
  );
$$;

revoke all on function public.is_storefront_business_active(uuid)
from public, authenticated;

grant execute on function public.is_storefront_business_active(uuid)
to anon, service_role;

comment on function public.is_storefront_business_active(uuid) is
'Returns only whether a storefront tenant is active; it exposes no business fields.';

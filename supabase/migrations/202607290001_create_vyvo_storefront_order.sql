create or replace function public.create_storefront_order(
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
  v_order_id uuid;
  v_order_number text;
  v_payment_method text;
  v_item jsonb;
  v_product record;
  v_product_id uuid;
  v_quantity integer;
  v_requested_quantity integer;
  v_subtotal numeric := 0;
  v_total_cost numeric := 0;
  v_configurations jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_payload) <> 'object'
    or jsonb_typeof(p_payload->'customer') <> 'object'
    or jsonb_typeof(p_payload->'shipping_address') <> 'object'
    or jsonb_typeof(p_payload->'items') <> 'array'
    or jsonb_array_length(p_payload->'items') not between 1 and 20
  then
    raise exception 'invalid_checkout_payload';
  end if;

  select id, account_status
  into v_business
  from public.businesses
  where id = v_business_id
    and account_status = 'active';

  if not found then
    raise exception 'store_not_active';
  end if;

  v_payment_method := p_payload->>'payment_method';
  if v_payment_method not in ('sinpe', 'transfer', 'cash') then
    raise exception 'invalid_payment_method';
  end if;

  for v_item in
    select value
    from jsonb_array_elements(p_payload->'items')
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity not between 1 and 8 then
      raise exception 'invalid_quantity';
    end if;

    select coalesce(sum((candidate->>'quantity')::integer), 0)
    into v_requested_quantity
    from jsonb_array_elements(p_payload->'items') candidate
    where candidate->>'product_id' = v_product_id::text;

    select
      id,
      name,
      price,
      cost_price,
      images,
      status,
      stock_quantity
    into v_product
    from public.products
    where id = v_product_id
      and business_id = v_business_id
      and status = 'visible'
    for update;

    if not found then
      raise exception 'product_unavailable';
    end if;
    if v_product.stock_quantity < v_requested_quantity then
      raise exception 'insufficient_stock';
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_quantity);
    v_total_cost := v_total_cost + (v_product.cost_price * v_quantity);
  end loop;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'product_id', candidate->>'product_id',
        'configuration', candidate->'configuration'
      )
    ) filter (where candidate ? 'configuration'),
    '[]'::jsonb
  )
  into v_configurations
  from jsonb_array_elements(p_payload->'items') candidate;

  select id
  into v_customer_id
  from public.store_customers
  where business_id = v_business_id
    and lower(email) = lower(p_payload->'customer'->>'email')
  order by created_at
  limit 1;

  if v_customer_id is null then
    insert into public.store_customers (
      business_id,
      name,
      email,
      phone
    )
    values (
      v_business_id,
      left(p_payload->'customer'->>'name', 140),
      lower(p_payload->'customer'->>'email'),
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

  v_order_number :=
    'VYVO-' ||
    to_char(timezone('America/Costa_Rica', now()), 'YYYYMMDD') ||
    '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.orders (
    business_id,
    customer_id,
    order_number,
    status,
    subtotal,
    total,
    total_cost,
    payment_method,
    payment_status,
    shipping_address,
    billing_address,
    notes
  )
  values (
    v_business_id,
    v_customer_id,
    v_order_number,
    'pending',
    v_subtotal,
    v_subtotal,
    v_total_cost,
    v_payment_method,
    'pending',
    p_payload->'shipping_address',
    p_payload->'shipping_address',
    jsonb_build_object(
      'source', 'vyvo-storefront',
      'payment_coordination', 'merchant_contacts_customer',
      'configurations', v_configurations
    )::text
  )
  returning id into v_order_id;

  for v_item in
    select value
    from jsonb_array_elements(p_payload->'items')
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    select
      id,
      name,
      price,
      cost_price,
      images,
      stock_quantity
    into v_product
    from public.products
    where id = v_product_id
      and business_id = v_business_id;

    insert into public.order_items (
      order_id,
      product_id,
      variant_id,
      product_name,
      product_image,
      quantity,
      unit_price,
      unit_cost,
      subtotal
    )
    values (
      v_order_id,
      v_product.id,
      null,
      v_product.name,
      v_product.images[1],
      v_quantity,
      v_product.price,
      v_product.cost_price,
      v_product.price * v_quantity
    );

    update public.products
    set
      stock_quantity = stock_quantity - v_quantity,
      updated_at = now()
    where id = v_product.id
      and business_id = v_business_id;

    insert into public.inventory_movements (
      business_id,
      product_id,
      variant_id,
      movement_type,
      quantity_change,
      stock_before,
      stock_after,
      notes
    )
    values (
      v_business_id,
      v_product.id,
      null,
      'sale',
      -v_quantity,
      v_product.stock_quantity,
      v_product.stock_quantity - v_quantity,
      'Pedido ' || v_order_number || ' creado desde vyvocr.com'
    );
  end loop;

  update public.store_customers
  set
    total_orders = coalesce(total_orders, 0) + 1,
    total_spent = coalesce(total_spent, 0) + v_subtotal
  where id = v_customer_id
    and business_id = v_business_id;

  insert into public.order_tracking (
    order_id,
    status,
    title,
    description,
    location
  )
  values (
    v_order_id,
    'pending',
    'Pedido recibido',
    'VYVO recibió el pedido y contactará al cliente para coordinar pago y entrega.',
    'Costa Rica'
  );

  return jsonb_build_object(
    'orderId', v_order_id,
    'orderNumber', v_order_number,
    'status', 'pending',
    'total', v_subtotal,
    'currency', 'CRC'
  );
end;
$$;

revoke all on function public.create_storefront_order(uuid, jsonb)
from public, anon, authenticated;

grant execute on function public.create_storefront_order(uuid, jsonb)
to service_role;

comment on function public.create_storefront_order(uuid, jsonb) is
'Creates a tenant-scoped storefront order atomically. Prices, costs, tenant and stock are resolved inside PostgreSQL.';

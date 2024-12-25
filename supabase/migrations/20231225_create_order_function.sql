-- Create a function to handle order creation and items atomically
create or replace function create_order_with_items(
  p_session_id text,
  p_user_id bigint,
  p_total_amount numeric,
  p_customer_email text,
  p_customer_phone text,
  p_meal_details jsonb
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_order_id bigint;
  v_meal record;
begin
  -- Check if order already exists
  select id into v_order_id
  from orders
  where session_id = p_session_id;

  if found then
    return jsonb_build_object(
      'id', v_order_id,
      'status', 'already_exists'
    );
  end if;

  -- Create the order
  insert into orders (
    user_id,
    total_amount,
    payment_status,
    created_at,
    customer_email,
    customer_phone,
    status,
    session_id
  ) values (
    p_user_id,
    p_total_amount,
    'paid',
    now(),
    p_customer_email,
    p_customer_phone,
    'pending',
    p_session_id
  ) returning id into v_order_id;

  -- Create order items and update meal quantities
  for v_meal in select * from jsonb_array_elements(p_meal_details)
  loop
    -- Create order item
    insert into order_items (
      order_id,
      meal_id,
      quantity,
      price,
      pickup_time,
      pickup_date,
      created_at
    ) values (
      v_order_id,
      (v_meal->>'id')::bigint,
      (v_meal->>'quantity')::integer,
      (v_meal->>'price')::numeric,
      v_meal->>'time',
      v_meal->>'date',
      now()
    );

    -- Update meal quantity
    update meals
    set 
      available_quantity = greatest(0, available_quantity - (v_meal->>'quantity')::integer),
      updated_at = now()
    where id = (v_meal->>'id')::bigint;
  end loop;

  return jsonb_build_object(
    'id', v_order_id,
    'status', 'created'
  );
end;
$$;

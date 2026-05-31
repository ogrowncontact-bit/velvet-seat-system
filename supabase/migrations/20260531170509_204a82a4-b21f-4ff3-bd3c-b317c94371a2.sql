
-- Create owner user
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  new_restaurant_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'euclides.pereirasilvaneto@gmail.com',
    crypt('07122018N', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Euclides"}'::jsonb,
    now(), now(), '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', 'euclides.pereirasilvaneto@gmail.com', 'email_verified', true),
    'email',
    new_user_id::text,
    now(), now(), now()
  );

  INSERT INTO public.profiles (id, full_name, current_restaurant_id)
  VALUES (new_user_id, 'Euclides', new_restaurant_id)
  ON CONFLICT (id) DO UPDATE SET current_restaurant_id = EXCLUDED.current_restaurant_id;

  INSERT INTO public.restaurants (id, name, created_by)
  VALUES (new_restaurant_id, 'teste 1', new_user_id);

  INSERT INTO public.restaurant_members (user_id, restaurant_id, role)
  VALUES (new_user_id, new_restaurant_id, 'owner');

  INSERT INTO public.rooms (restaurant_id, name, sort_order)
  VALUES (new_restaurant_id, 'Salão Principal', 0);
END $$;

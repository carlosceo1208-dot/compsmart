-- Test handle_new_user trigger via DO block to surface real error
DO $$
DECLARE
  test_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.profiles (id, full_name, email, root_company_id)
  VALUES (test_id, 'Test User', 'test_diag_'||test_id||'@example.com', 'b4ef7367-2068-4939-b455-f61ad9d7bc8c'::uuid);
  RAISE NOTICE 'Insert profile OK for %', test_id;
  DELETE FROM public.profiles WHERE id = test_id;
END $$;
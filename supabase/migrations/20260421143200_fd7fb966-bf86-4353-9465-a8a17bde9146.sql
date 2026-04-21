-- Remove broad listing policies on public buckets (objects can still be fetched via direct URL)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND cmd = 'SELECT'
      AND (qual ILIKE '%company-logos%' OR qual ILIKE '%avatars%' OR qual ILIKE '%videos%' OR qual = 'true')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Allow users to list/view only their own files in user-scoped buckets
CREATE POLICY "Users view own avatar files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users view own video files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Company logos: any authenticated user from same company can list
CREATE POLICY "Company members view company logos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND (storage.foldername(name))[1] = public.get_user_company_id()::text
  );

-- Public read via direct URL (anon role) for these buckets remains available because they are marked public=true
-- but enumeration via storage.objects SELECT is now blocked for anon role.
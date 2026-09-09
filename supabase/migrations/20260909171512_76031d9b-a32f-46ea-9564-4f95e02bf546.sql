
CREATE POLICY "restaurant photos are readable"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'restaurant-photos');

CREATE POLICY "managers upload restaurant photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'restaurant-photos'
  AND (
    public.is_platform_admin(auth.uid())
    OR public.is_manager_or_owner(auth.uid(), NULLIF((storage.foldername(name))[1], '')::uuid)
  )
);

CREATE POLICY "managers update restaurant photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'restaurant-photos'
  AND (
    public.is_platform_admin(auth.uid())
    OR public.is_manager_or_owner(auth.uid(), NULLIF((storage.foldername(name))[1], '')::uuid)
  )
);

CREATE POLICY "managers delete restaurant photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'restaurant-photos'
  AND (
    public.is_platform_admin(auth.uid())
    OR public.is_manager_or_owner(auth.uid(), NULLIF((storage.foldername(name))[1], '')::uuid)
  )
);

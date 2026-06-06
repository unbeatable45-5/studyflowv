
-- 1. Fix group_memberships privilege escalation: split INSERT policy
DROP POLICY IF EXISTS "Users can join groups or admins can add members" ON public.group_memberships;

CREATE POLICY "Users can join groups as member"
ON public.group_memberships FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'member');

CREATE POLICY "Admins can add members with any role"
ON public.group_memberships FOR INSERT TO authenticated
WITH CHECK (public.is_group_admin(auth.uid(), group_id));

-- Also restrict role escalation on UPDATE — only admins can change roles
DROP POLICY IF EXISTS "Group owners and admins can update memberships" ON public.group_memberships;
CREATE POLICY "Group admins can update memberships"
ON public.group_memberships FOR UPDATE TO authenticated
USING (public.is_group_admin(auth.uid(), group_id))
WITH CHECK (public.is_group_admin(auth.uid(), group_id));

-- 2. Restrict profiles SELECT to owner only
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 3. saved_outputs — change roles from public to authenticated
DROP POLICY IF EXISTS "Users can view their own outputs" ON public.saved_outputs;
DROP POLICY IF EXISTS "Users can insert their own outputs" ON public.saved_outputs;
DROP POLICY IF EXISTS "Users can delete their own outputs" ON public.saved_outputs;

CREATE POLICY "Users can view their own outputs"
ON public.saved_outputs FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own outputs"
ON public.saved_outputs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outputs"
ON public.saved_outputs FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- 4. Revoke EXECUTE on SECURITY DEFINER helper functions from public/anon
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_mind_maps_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_group_owner_as_member() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 5. Remove broad SELECT (listing) on avatars bucket — public CDN access still works for direct URLs
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

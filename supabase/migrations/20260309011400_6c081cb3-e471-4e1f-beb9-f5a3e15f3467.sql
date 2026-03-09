-- Fix study_groups policies: change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Users can create groups" ON public.study_groups;
CREATE POLICY "Users can create groups" ON public.study_groups
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.study_groups;
CREATE POLICY "Users can view groups they are members of" ON public.study_groups
  FOR SELECT TO authenticated
  USING (is_group_member(auth.uid(), id));

DROP POLICY IF EXISTS "Group owners and admins can update groups" ON public.study_groups;
CREATE POLICY "Group owners and admins can update groups" ON public.study_groups
  FOR UPDATE TO authenticated
  USING (is_group_admin(auth.uid(), id));

DROP POLICY IF EXISTS "Group owners can delete groups" ON public.study_groups;
CREATE POLICY "Group owners can delete groups" ON public.study_groups
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Fix group_memberships policies
DROP POLICY IF EXISTS "Users can join groups or admins can add members" ON public.group_memberships;
CREATE POLICY "Users can join groups or admins can add members" ON public.group_memberships
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id) OR is_group_admin(auth.uid(), group_id));

DROP POLICY IF EXISTS "Users can view memberships of groups they belong to" ON public.group_memberships;
CREATE POLICY "Users can view memberships of groups they belong to" ON public.group_memberships
  FOR SELECT TO authenticated
  USING (is_group_member(auth.uid(), group_id));

DROP POLICY IF EXISTS "Group owners and admins can update memberships" ON public.group_memberships;
CREATE POLICY "Group owners and admins can update memberships" ON public.group_memberships
  FOR UPDATE TO authenticated
  USING (is_group_admin(auth.uid(), group_id));

DROP POLICY IF EXISTS "Users can leave groups or admins can remove" ON public.group_memberships;
CREATE POLICY "Users can leave groups or admins can remove" ON public.group_memberships
  FOR DELETE TO authenticated
  USING ((user_id = auth.uid()) OR is_group_admin(auth.uid(), group_id));

-- Fix group_messages policies
DROP POLICY IF EXISTS "Group members can send messages" ON public.group_messages;
CREATE POLICY "Group members can send messages" ON public.group_messages
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id) AND is_group_member(auth.uid(), group_id));

DROP POLICY IF EXISTS "Group members can view messages" ON public.group_messages;
CREATE POLICY "Group members can view messages" ON public.group_messages
  FOR SELECT TO authenticated
  USING (is_group_member(auth.uid(), group_id));

DROP POLICY IF EXISTS "Users can delete their own messages" ON public.group_messages;
CREATE POLICY "Users can delete their own messages" ON public.group_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Fix profiles SELECT to allow group members to see each other's profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
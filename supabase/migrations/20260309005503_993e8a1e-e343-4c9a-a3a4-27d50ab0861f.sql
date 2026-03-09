
-- Drop ALL existing policies on study_groups
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.study_groups;
DROP POLICY IF EXISTS "Users can create groups" ON public.study_groups;
DROP POLICY IF EXISTS "Group owners and admins can update groups" ON public.study_groups;
DROP POLICY IF EXISTS "Group owners can delete groups" ON public.study_groups;

-- Drop ALL existing policies on group_memberships
DROP POLICY IF EXISTS "Users can view memberships of groups they belong to" ON public.group_memberships;
DROP POLICY IF EXISTS "Users can join groups or admins can add members" ON public.group_memberships;
DROP POLICY IF EXISTS "Group owners and admins can update memberships" ON public.group_memberships;
DROP POLICY IF EXISTS "Users can leave groups or admins can remove" ON public.group_memberships;

-- Recreate study_groups policies as PERMISSIVE
CREATE POLICY "Users can create groups"
ON public.study_groups AS PERMISSIVE
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view groups they are members of"
ON public.study_groups AS PERMISSIVE
FOR SELECT TO authenticated
USING (public.is_group_member(auth.uid(), id));

CREATE POLICY "Group owners and admins can update groups"
ON public.study_groups AS PERMISSIVE
FOR UPDATE TO authenticated
USING (public.is_group_admin(auth.uid(), id));

CREATE POLICY "Group owners can delete groups"
ON public.study_groups AS PERMISSIVE
FOR DELETE TO authenticated
USING (owner_id = auth.uid());

-- Recreate group_memberships policies as PERMISSIVE
CREATE POLICY "Users can view memberships of groups they belong to"
ON public.group_memberships AS PERMISSIVE
FOR SELECT TO authenticated
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Users can join groups or admins can add members"
ON public.group_memberships AS PERMISSIVE
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Group owners and admins can update memberships"
ON public.group_memberships AS PERMISSIVE
FOR UPDATE TO authenticated
USING (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Users can leave groups or admins can remove"
ON public.group_memberships AS PERMISSIVE
FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_group_admin(auth.uid(), group_id));

-- Recreate trigger for auto-adding owner as member
DROP TRIGGER IF EXISTS on_group_created ON public.study_groups;
CREATE TRIGGER on_group_created
AFTER INSERT ON public.study_groups
FOR EACH ROW
EXECUTE FUNCTION public.add_group_owner_as_member();

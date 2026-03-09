-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view memberships of groups they belong to" ON public.group_memberships;
DROP POLICY IF EXISTS "Users can join groups or admins can add members" ON public.group_memberships;
DROP POLICY IF EXISTS "Group owners and admins can update memberships" ON public.group_memberships;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_memberships;
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.study_groups;
DROP POLICY IF EXISTS "Group owners and admins can update groups" ON public.study_groups;

-- Create security definer functions to check group membership without recursion
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_memberships
    WHERE user_id = _user_id
      AND group_id = _group_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_memberships
    WHERE user_id = _user_id
      AND group_id = _group_id
      AND role IN ('owner', 'admin')
  )
$$;

-- Recreate policies using the security definer functions
CREATE POLICY "Users can view memberships of groups they belong to"
ON public.group_memberships
FOR SELECT
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Users can join groups or admins can add members"
ON public.group_memberships
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR public.is_group_admin(auth.uid(), group_id)
);

CREATE POLICY "Group owners and admins can update memberships"
ON public.group_memberships
FOR UPDATE
USING (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Users can leave groups or admins can remove"
ON public.group_memberships
FOR DELETE
USING (
  user_id = auth.uid()
  OR public.is_group_admin(auth.uid(), group_id)
);

CREATE POLICY "Users can view groups they are members of"
ON public.study_groups
FOR SELECT
USING (public.is_group_member(auth.uid(), id));

CREATE POLICY "Group owners and admins can update groups"
ON public.study_groups
FOR UPDATE
USING (public.is_group_admin(auth.uid(), id));

-- Create trigger to automatically add owner as member when creating group
CREATE OR REPLACE FUNCTION public.add_group_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_memberships (group_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_group_created
AFTER INSERT ON public.study_groups
FOR EACH ROW
EXECUTE FUNCTION public.add_group_owner_as_member();
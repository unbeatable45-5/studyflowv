-- Allow users to join groups themselves (via invite link)
DROP POLICY IF EXISTS "Group owners and admins can add members" ON public.group_memberships;

CREATE POLICY "Users can join groups or admins can add members"
ON public.group_memberships
FOR INSERT
WITH CHECK (
  -- User can add themselves
  (auth.uid() = user_id)
  OR
  -- Or group owner/admin can add others
  (EXISTS (
    SELECT 1 FROM public.group_memberships gm
    WHERE gm.group_id = group_memberships.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
  ))
);
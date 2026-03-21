
-- Create a security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- Fix groups: replace member policy to use the function
DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;
CREATE POLICY "Members can view their groups"
ON public.groups FOR SELECT
TO authenticated
USING (public.is_group_member(auth.uid(), id));

-- Fix group_members: replace recursive policy
DROP POLICY IF EXISTS "Members can view own group members" ON public.group_members;
CREATE POLICY "Members can view own group members"
ON public.group_members FOR SELECT
TO authenticated
USING (public.is_group_member(auth.uid(), group_id));


-- Fix groups policies: drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Admin can manage groups" ON public.groups;
DROP POLICY IF EXISTS "Parents can view their groups" ON public.groups;
DROP POLICY IF EXISTS "Students can view their groups" ON public.groups;
DROP POLICY IF EXISTS "Teachers can view their groups" ON public.groups;

CREATE POLICY "Admin can manage groups"
ON public.groups FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can view their groups"
ON public.groups FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
  )
);

-- Fix group_members policies: drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Admin can manage group members" ON public.group_members;
DROP POLICY IF EXISTS "Members can view own group members" ON public.group_members;

CREATE POLICY "Admin can manage group members"
ON public.group_members FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can view own group members"
ON public.group_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
  )
);

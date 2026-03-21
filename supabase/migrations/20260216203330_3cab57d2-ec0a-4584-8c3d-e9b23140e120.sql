
-- Drop ALL existing policies on exercise_assignments
DROP POLICY IF EXISTS "Teachers view own assignments" ON public.exercise_assignments;
DROP POLICY IF EXISTS "Teachers create assignments" ON public.exercise_assignments;
DROP POLICY IF EXISTS "Teachers update assignments" ON public.exercise_assignments;
DROP POLICY IF EXISTS "Teachers delete assignments" ON public.exercise_assignments;
DROP POLICY IF EXISTS "Students view own assignments" ON public.exercise_assignments;
DROP POLICY IF EXISTS "Students update own assignments" ON public.exercise_assignments;
DROP POLICY IF EXISTS "Parents view children assignments" ON public.exercise_assignments;

-- 1) ADMIN: full access
CREATE POLICY "Admin full access exercise_assignments"
ON public.exercise_assignments FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2) TEACHER SELECT: can see assignments where assigned_by = self, or student is in teacher's course group
CREATE POLICY "Teacher select exercise_assignments"
ON public.exercise_assignments FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND (
    assigned_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm_t
      JOIN public.group_members gm_s ON gm_s.group_id = gm_t.group_id AND gm_s.user_id = exercise_assignments.student_id AND gm_s.member_role = 'student'
      JOIN public.groups g ON g.id = gm_t.group_id AND g.group_type = 'course'
      WHERE gm_t.user_id = auth.uid() AND gm_t.member_role = 'teacher'
    )
  )
);

-- 3) TEACHER INSERT: assigned_by must be self, student must be in teacher's course group
CREATE POLICY "Teacher insert exercise_assignments"
ON public.exercise_assignments FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'teacher'::app_role)
  AND assigned_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.group_members gm_t
    JOIN public.group_members gm_s ON gm_s.group_id = gm_t.group_id AND gm_s.user_id = exercise_assignments.student_id AND gm_s.member_role = 'student'
    JOIN public.groups g ON g.id = gm_t.group_id AND g.group_type = 'course'
    WHERE gm_t.user_id = auth.uid() AND gm_t.member_role = 'teacher'
  )
);

-- 4) TEACHER UPDATE: can update assignments they created
CREATE POLICY "Teacher update exercise_assignments"
ON public.exercise_assignments FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND assigned_by = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'teacher'::app_role) AND assigned_by = auth.uid()
);

-- 5) TEACHER DELETE
CREATE POLICY "Teacher delete exercise_assignments"
ON public.exercise_assignments FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND assigned_by = auth.uid()
);

-- 6) STUDENT SELECT: own rows only
CREATE POLICY "Student select own exercise_assignments"
ON public.exercise_assignments FOR SELECT TO authenticated
USING (student_id = auth.uid());

-- 7) STUDENT UPDATE: own rows only, cannot change assigned_by
CREATE POLICY "Student update own exercise_assignments"
ON public.exercise_assignments FOR UPDATE TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- 8) PARENT SELECT: children via family group
CREATE POLICY "Parent select children exercise_assignments"
ON public.exercise_assignments FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'parent'::app_role) AND EXISTS (
    SELECT 1 FROM public.group_members gm_parent
    JOIN public.group_members gm_child ON gm_child.group_id = gm_parent.group_id
      AND gm_child.user_id = exercise_assignments.student_id
      AND gm_child.member_role = 'student'
    JOIN public.groups g ON g.id = gm_parent.group_id AND g.group_type = 'family'
    WHERE gm_parent.user_id = auth.uid() AND gm_parent.member_role = 'parent'
  )
);

-- Also ensure students can see their own group_members rows and groups
-- Check existing policies first - add student SELECT if missing
DROP POLICY IF EXISTS "Students can view own group memberships" ON public.group_members;
CREATE POLICY "Students can view own group memberships"
ON public.group_members FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Students can view their groups" ON public.groups;
CREATE POLICY "Students can view their groups"
ON public.groups FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid()
  )
);

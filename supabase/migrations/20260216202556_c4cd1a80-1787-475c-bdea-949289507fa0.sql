
-- Drop activities tables (remove the old feature)
DROP TABLE IF EXISTS public.activity_assignments CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;

-- Create exercise_assignments table
CREATE TABLE public.exercise_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  score integer,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  UNIQUE(exercise_id, student_id)
);

ALTER TABLE public.exercise_assignments ENABLE ROW LEVEL SECURITY;

-- Teachers can view assignments they created
CREATE POLICY "Teachers view own assignments"
ON public.exercise_assignments FOR SELECT TO authenticated
USING (
  assigned_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Teachers can create assignments
CREATE POLICY "Teachers create assignments"
ON public.exercise_assignments FOR INSERT TO authenticated
WITH CHECK (
  assigned_by = auth.uid()
  AND (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Teachers/admin can update assignments
CREATE POLICY "Teachers update assignments"
ON public.exercise_assignments FOR UPDATE TO authenticated
USING (
  assigned_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Teachers/admin can delete assignments
CREATE POLICY "Teachers delete assignments"
ON public.exercise_assignments FOR DELETE TO authenticated
USING (
  assigned_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Students can view own assignments
CREATE POLICY "Students view own assignments"
ON public.exercise_assignments FOR SELECT TO authenticated
USING (student_id = auth.uid());

-- Students can update own assignment (mark complete)
CREATE POLICY "Students update own assignments"
ON public.exercise_assignments FOR UPDATE TO authenticated
USING (student_id = auth.uid());

-- Parents can view their children's assignments via family groups
CREATE POLICY "Parents view children assignments"
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

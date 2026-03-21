
-- Create activities table
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  section text DEFAULT 'general',
  due_date timestamp with time zone,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create activity_assignments table
CREATE TABLE public.activity_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  score integer,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(activity_id, student_id)
);

ALTER TABLE public.activity_assignments ENABLE ROW LEVEL SECURITY;

-- Activities RLS
CREATE POLICY "Teachers can view own activities"
ON public.activities FOR SELECT TO authenticated
USING (teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can create activities"
ON public.activities FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role) AND teacher_id = auth.uid());

CREATE POLICY "Teachers can update own activities"
ON public.activities FOR UPDATE TO authenticated
USING (teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can delete own activities"
ON public.activities FOR DELETE TO authenticated
USING (teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view assigned activities"
ON public.activities FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.activity_assignments aa
  WHERE aa.activity_id = activities.id AND aa.student_id = auth.uid()
));

CREATE POLICY "Parents can view children activities"
ON public.activities FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'parent'::app_role) AND EXISTS (
    SELECT 1 FROM public.activity_assignments aa
    JOIN public.group_members gm_parent ON gm_parent.user_id = auth.uid() AND gm_parent.member_role = 'parent'
    JOIN public.group_members gm_child ON gm_child.group_id = gm_parent.group_id AND gm_child.user_id = aa.student_id AND gm_child.member_role = 'student'
    JOIN public.groups g ON g.id = gm_parent.group_id AND g.group_type = 'family'
    WHERE aa.activity_id = activities.id
  )
);

-- Activity assignments RLS
CREATE POLICY "Teachers can view own activity assignments"
ON public.activity_assignments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.activities a WHERE a.id = activity_id AND (a.teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Teachers can create assignments"
ON public.activity_assignments FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.activities a WHERE a.id = activity_id AND a.teacher_id = auth.uid()
));

CREATE POLICY "Teachers can update assignments"
ON public.activity_assignments FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.activities a WHERE a.id = activity_id AND (a.teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Teachers can delete assignments"
ON public.activity_assignments FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.activities a WHERE a.id = activity_id AND (a.teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Students can view own assignments"
ON public.activity_assignments FOR SELECT TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Students can update own assignments"
ON public.activity_assignments FOR UPDATE TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Parents can view children assignments"
ON public.activity_assignments FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'parent'::app_role) AND EXISTS (
    SELECT 1 FROM public.group_members gm_parent
    JOIN public.group_members gm_child ON gm_child.group_id = gm_parent.group_id AND gm_child.user_id = activity_assignments.student_id AND gm_child.member_role = 'student'
    JOIN public.groups g ON g.id = gm_parent.group_id AND g.group_type = 'family'
    WHERE gm_parent.user_id = auth.uid() AND gm_parent.member_role = 'parent'
  )
);

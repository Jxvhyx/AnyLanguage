
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'parent', 'student');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'student',
  UNIQUE(user_id, role)
);

-- Memberships (teacher-student, parent-student relationships)
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('teacher-student', 'parent-student')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lessons table
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exercises table
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  exercise_type TEXT NOT NULL DEFAULT 'multiple_choice' CHECK (exercise_type IN ('multiple_choice', 'fill_blank', 'true_false', 'matching')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student progress
CREATE TABLE public.student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  score INTEGER DEFAULT 0,
  answer TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, exercise_id)
);

-- Reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  generated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL DEFAULT 'progress' CHECK (report_type IN ('progress', 'performance', 'attendance')),
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Helper function: check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON public.exercises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_student_progress_updated_at BEFORE UPDATE ON public.student_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===== RLS POLICIES =====

-- Profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admin can manage profiles" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User roles
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Memberships
CREATE POLICY "Users can view own memberships" ON public.memberships FOR SELECT TO authenticated 
  USING (teacher_id = auth.uid() OR parent_id = auth.uid() OR student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can manage memberships" ON public.memberships FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers can create teacher-student memberships" ON public.memberships FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'teacher') AND relationship_type = 'teacher-student' AND teacher_id = auth.uid());
CREATE POLICY "Parents can create parent-student memberships" ON public.memberships FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'parent') AND relationship_type = 'parent-student' AND parent_id = auth.uid());

-- Lessons
CREATE POLICY "Anyone authenticated can view published lessons" ON public.lessons FOR SELECT TO authenticated USING (is_published = true OR teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers can create lessons" ON public.lessons FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'teacher') AND teacher_id = auth.uid());
CREATE POLICY "Teachers can update own lessons" ON public.lessons FOR UPDATE TO authenticated USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers can delete own lessons" ON public.lessons FOR DELETE TO authenticated USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can manage lessons" ON public.lessons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Exercises
CREATE POLICY "Anyone can view exercises of accessible lessons" ON public.exercises FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.lessons WHERE lessons.id = exercises.lesson_id AND (lessons.is_published = true OR lessons.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Teachers can create exercises" ON public.exercises FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.lessons WHERE lessons.id = lesson_id AND lessons.teacher_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Teachers can update own exercises" ON public.exercises FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.lessons WHERE lessons.id = exercises.lesson_id AND lessons.teacher_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Teachers can delete own exercises" ON public.exercises FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.lessons WHERE lessons.id = exercises.lesson_id AND lessons.teacher_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);

-- Student progress
CREATE POLICY "Students can view own progress" ON public.student_progress FOR SELECT TO authenticated 
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR 
    (public.has_role(auth.uid(), 'teacher') AND EXISTS (SELECT 1 FROM public.memberships WHERE memberships.teacher_id = auth.uid() AND memberships.student_id = student_progress.student_id)) OR
    (public.has_role(auth.uid(), 'parent') AND EXISTS (SELECT 1 FROM public.memberships WHERE memberships.parent_id = auth.uid() AND memberships.student_id = student_progress.student_id))
  );
CREATE POLICY "Students can insert own progress" ON public.student_progress FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can update own progress" ON public.student_progress FOR UPDATE TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Admin can manage progress" ON public.student_progress FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Reports
CREATE POLICY "View reports" ON public.reports FOR SELECT TO authenticated 
  USING (student_id = auth.uid() OR generated_by = auth.uid() OR public.has_role(auth.uid(), 'admin') OR
    (public.has_role(auth.uid(), 'parent') AND EXISTS (SELECT 1 FROM public.memberships WHERE memberships.parent_id = auth.uid() AND memberships.student_id = reports.student_id))
  );
CREATE POLICY "Create reports" ON public.reports FOR INSERT TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Admin can manage reports" ON public.reports FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

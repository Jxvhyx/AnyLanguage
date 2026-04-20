import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, BarChart3, Trophy, Dumbbell, Star, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <Card className="shadow-card border-0 hover:shadow-elevated transition-shadow">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-body">{label}</p>
          <p className="text-2xl font-display text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { role, profile } = useAuth();
  const [stats, setStats] = useState({ lessons: 0, exercises: 0, students: 0, completed: 0 });

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        const [lessonsRes, exercisesRes] = await Promise.all([
          supabase.from("lessons").select("id", { count: "exact", head: true }),
          supabase.from("exercises").select("id", { count: "exact", head: true }),
        ]);

        if (lessonsRes.error) {
          console.error("Error loading lessons stats:", lessonsRes.error);
        }

        if (exercisesRes.error) {
          console.error("Error loading exercises stats:", exercisesRes.error);
        }

        if (!mounted) return;

        setStats((s) => ({
          ...s,
          lessons: lessonsRes.count ?? 0,
          exercises: exercisesRes.count ?? 0,
        }));
      } catch (error) {
        console.error("Dashboard fetchStats failed:", error);
      }
    };

    fetchStats();

    return () => {
      mounted = false;
    };
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <DashboardLayout>
      <div className="animate-slide-up">
        <div className="mb-8">
          <h1 className="text-3xl font-display text-foreground mb-2">
            {greeting()}, {profile?.full_name || "Friend"}! 👋
          </h1>
          <p className="text-muted-foreground text-lg font-body">
            {role === "admin" && "Here's an overview of your platform."}
            {role === "teacher" && "Ready to inspire your students today?"}
            {role === "parent" && "See how your children are doing."}
            {role === "student" && "Let's learn something new today! 🌟"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={BookOpen} label="Lessons" value={stats.lessons} color="bg-primary/10 text-primary" />
          <StatCard icon={Dumbbell} label="Exercises" value={stats.exercises} color="bg-secondary/10 text-secondary" />
          <StatCard icon={Users} label="Students" value={stats.students} color="bg-info/10 text-info" />
          <StatCard icon={Trophy} label="Completed" value={stats.completed} color="bg-success/10 text-success" />
        </div>

        {role === "student" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Star className="w-5 h-5 text-accent" /> Recent Lessons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-body">Start a lesson to begin learning! Your lessons will appear here.</p>
              </CardContent>
            </Card>
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" /> Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-body">Complete exercises to track your progress! 🚀</p>
              </CardContent>
            </Card>
          </div>
        )}

        {(role === "admin" || role === "teacher") && (
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link
                to="/lessons"
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-body font-bold hover:opacity-90 transition-opacity"
              >
                + New Lesson
              </Link>

              <Link
                to="/exercises"
                className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-body font-bold hover:opacity-90 transition-opacity"
              >
                + New Exercise
              </Link>

              {role === "admin" && (
                <Link
                  to="/users"
                  className="px-4 py-2 rounded-xl bg-info text-info-foreground font-body font-bold hover:opacity-90 transition-opacity"
                >
                  Manage Users
                </Link>
              )}

              <Link
                to="/dictionary"
                className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-body font-bold hover:opacity-90 transition-opacity"
              >
                📚 Diccionario
              </Link>

              <Link
                to="/minigames"
                className="px-4 py-2 rounded-xl bg-success text-success-foreground font-body font-bold hover:opacity-90 transition-opacity"
              >
                🎮 Minigames
              </Link>

            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout >
  );
}

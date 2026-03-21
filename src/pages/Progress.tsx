import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Trophy, Target, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProgressItem {
  id: string;
  student_id: string;
  exercise_id: string;
  status: string;
  score: number | null;
  completed_at: string | null;
}

export default function ProgressPage() {
  const { user, role } = useAuth();
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      let query = supabase.from("student_progress").select("*").order("created_at", { ascending: false });
      if (role === "student") query = query.eq("student_id", user!.id);
      const { data } = await query;
      setProgress(data || []);
      setLoading(false);
    };
    fetch();
  }, [user, role]);

  const completed = progress.filter(p => p.status === "completed").length;
  const totalScore = progress.reduce((sum, p) => sum + (p.score || 0), 0);
  const completionRate = progress.length > 0 ? Math.round((completed / progress.length) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="animate-slide-up">
        <h1 className="text-3xl font-display text-foreground flex items-center gap-2 mb-6">
          <BarChart3 className="w-8 h-8 text-primary" /> {role === "student" ? "My Progress" : "Student Progress"}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="shadow-card border-0">
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 mx-auto text-info mb-2" />
              <p className="text-3xl font-display text-foreground">{progress.length}</p>
              <p className="text-sm text-muted-foreground">Total Exercises</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto text-success mb-2" />
              <p className="text-3xl font-display text-foreground">{completed}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0">
            <CardContent className="p-6 text-center">
              <Trophy className="w-8 h-8 mx-auto text-accent mb-2" />
              <p className="text-3xl font-display text-foreground">{totalScore}</p>
              <p className="text-sm text-muted-foreground">Total Score</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card border-0 mb-6">
          <CardHeader>
            <CardTitle className="font-display">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Progress value={completionRate} className="flex-1 h-4" />
              <span className="font-display text-xl text-foreground">{completionRate}%</span>
            </div>
          </CardContent>
        </Card>

        {loading ? <p className="text-muted-foreground">Loading...</p> : progress.length === 0 ? (
          <Card className="shadow-card border-0 text-center py-12">
            <CardContent>
              <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-lg font-body text-muted-foreground">No progress data yet. Start practicing!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {progress.map(p => (
              <Card key={p.id} className="shadow-card border-0">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${p.status === "completed" ? "bg-success" : p.status === "in_progress" ? "bg-warning" : "bg-muted"}`} />
                  <div className="flex-1">
                    <p className="font-body text-sm text-foreground">Exercise</p>
                  </div>
                  <Badge variant="secondary">{p.status.replace("_", " ")}</Badge>
                  <span className="font-display text-foreground">{p.score || 0} pts</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

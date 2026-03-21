import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Dumbbell, CheckCircle2, Clock, Users, Send } from "lucide-react";

interface AssignedExercise {
  assignment_id: string;
  exercise_id: string;
  status: string;
  score: number | null;
  assigned_at: string;
  completed_at: string | null;
  question: string;
  exercise_type: string;
  options: any;
  correct_answer: string;
  points: number;
}

interface StudentGroup {
  id: string;
  name: string;
  group_type: string;
}

export default function StudentExercisesPage() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<AssignedExercise[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [solveOpen, setSolveOpen] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<AssignedExercise | null>(null);
  const [answer, setAnswer] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) return;

    // Fetch student's groups
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id);

    if (memberships && memberships.length > 0) {
      const { data: grps } = await supabase
        .from("groups")
        .select("id, name, group_type")
        .in("id", memberships.map(m => m.group_id));
      setGroups(grps || []);
    }

    // Fetch assigned exercises
    const { data: assigns } = await supabase
      .from("exercise_assignments")
      .select("id, exercise_id, status, score, assigned_at, completed_at")
      .eq("student_id", user.id)
      .order("assigned_at", { ascending: false });

    if (assigns && assigns.length > 0) {
      const exerciseIds = [...new Set(assigns.map(a => a.exercise_id))];
      const { data: exData } = await supabase
        .from("exercises")
        .select("id, question, exercise_type, options, correct_answer, points")
        .in("id", exerciseIds);

      const exMap = Object.fromEntries((exData || []).map(e => [e.id, e]));

      setExercises(assigns.map(a => ({
        assignment_id: a.id,
        exercise_id: a.exercise_id,
        status: a.status,
        score: a.score,
        assigned_at: a.assigned_at,
        completed_at: a.completed_at,
        question: exMap[a.exercise_id]?.question || "Unknown",
        exercise_type: exMap[a.exercise_id]?.exercise_type || "unknown",
        options: exMap[a.exercise_id]?.options,
        correct_answer: exMap[a.exercise_id]?.correct_answer || "",
        points: exMap[a.exercise_id]?.points || 0,
      })));
    } else {
      setExercises([]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openSolve = (ex: AssignedExercise) => {
    setCurrentExercise(ex);
    setAnswer("");
    setSolveOpen(true);
  };

  const handleSubmit = async () => {
    if (!currentExercise || !answer.trim()) {
      toast({ title: "Please provide an answer", variant: "destructive" });
      return;
    }

    const isCorrect = answer.trim().toLowerCase() === currentExercise.correct_answer.trim().toLowerCase();
    const score = isCorrect ? currentExercise.points : 0;

    const { error } = await supabase
      .from("exercise_assignments")
      .update({
        status: "completed",
        score,
        completed_at: new Date().toISOString(),
      })
      .eq("id", currentExercise.assignment_id);

    if (error) {
      toast({ title: "Error submitting", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: isCorrect ? "Correct! 🎉" : "Submitted",
      description: isCorrect ? `You earned ${score} points!` : `The correct answer was: ${currentExercise.correct_answer}`,
    });

    setSolveOpen(false);
    fetchData();
  };

  const total = exercises.length;
  const completed = exercises.filter(e => e.status === "completed").length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const typeEmoji = (t: string) => {
    const map: Record<string, string> = { multiple_choice: "🔘", fill_blank: "✍️", true_false: "✅", matching: "🔗" };
    return map[t] || "❓";
  };

  return (
    <DashboardLayout>
      <div className="animate-slide-up">
        <h1 className="text-3xl font-display text-foreground flex items-center gap-2 mb-6">
          <Dumbbell className="w-8 h-8 text-secondary" /> My Exercises
        </h1>

        {/* Groups */}
        {groups.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Users className="w-5 h-5 text-muted-foreground" />
            {groups.map(g => (
              <Badge key={g.id} variant="outline" className="text-xs capitalize">
                {g.name} ({g.group_type})
              </Badge>
            ))}
          </div>
        )}

        {/* Progress */}
        <Card className="shadow-card border-0 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground font-body">My Progress</span>
              <span className="font-bold font-body">{completed}/{total} completed ({progress}%)</span>
            </div>
            <Progress value={progress} className="h-3" />
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-muted-foreground font-body">Loading…</p>
        ) : exercises.length === 0 ? (
          <Card className="shadow-card border-0 text-center py-12">
            <CardContent>
              <Dumbbell className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-lg font-body text-muted-foreground">No exercises assigned to you yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {exercises.map(ex => (
              <Card key={ex.assignment_id} className="shadow-card border-0 hover:shadow-elevated transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                  <span className="text-2xl">{typeEmoji(ex.exercise_type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-bold text-foreground truncate">{ex.question}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{ex.exercise_type.replace("_", " ")}</Badge>
                      <span className="text-xs text-muted-foreground">{ex.points} pts</span>
                      {ex.score !== null && <Badge className="text-xs">Score: {ex.score}</Badge>}
                    </div>
                  </div>
                  {ex.status === "completed" ? (
                    <div className="flex items-center gap-1 text-success">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-xs font-bold">Done</span>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => openSolve(ex)}>
                      <Send className="w-4 h-4 mr-1" /> Solve
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Solve Dialog */}
        <Dialog open={solveOpen} onOpenChange={setSolveOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">Solve Exercise</DialogTitle>
            </DialogHeader>
            {currentExercise && (
              <div className="space-y-4">
                <div>
                  <p className="font-body font-bold text-foreground text-lg">{currentExercise.question}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{currentExercise.exercise_type.replace("_", " ")}</Badge>
                    <span className="text-xs text-muted-foreground">{currentExercise.points} pts</span>
                  </div>
                </div>

                {currentExercise.options && Array.isArray(currentExercise.options) && (
                  <div className="space-y-2">
                    <Label>Options</Label>
                    <div className="grid gap-2">
                      {(currentExercise.options as string[]).map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => setAnswer(opt)}
                          className={`text-left px-4 py-3 rounded-xl border transition-all font-body ${
                            answer === opt
                              ? "border-primary bg-primary/10 font-bold"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(!currentExercise.options || !Array.isArray(currentExercise.options)) && (
                  <div>
                    <Label>Your Answer</Label>
                    <Input
                      value={answer}
                      onChange={e => setAnswer(e.target.value)}
                      placeholder="Type your answer..."
                    />
                  </div>
                )}

                {currentExercise.options && Array.isArray(currentExercise.options) && !answer && (
                  <p className="text-xs text-muted-foreground">Select an option above</p>
                )}

                <Button onClick={handleSubmit} className="w-full font-bold" disabled={!answer.trim()}>
                  <Send className="w-4 h-4 mr-2" /> Submit Answer
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

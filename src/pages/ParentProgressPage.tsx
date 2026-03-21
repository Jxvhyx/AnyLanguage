import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Baby, BarChart3, ChevronDown, ChevronUp } from "lucide-react";

interface ChildProgress {
  id: string;
  full_name: string;
  assignments: {
    id: string;
    exercise_question: string;
    status: string;
    score: number | null;
    completed_at: string | null;
  }[];
  total: number;
  completed: number;
  progress: number;
}

export default function ParentProgressPage() {
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChild, setExpandedChild] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const { data: myMemberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id)
      .eq("member_role", "parent");

    if (!myMemberships || myMemberships.length === 0) { setLoading(false); return; }

    const { data: familyGroups } = await supabase
      .from("groups")
      .select("id")
      .in("id", myMemberships.map(m => m.group_id))
      .eq("group_type", "family");

    if (!familyGroups || familyGroups.length === 0) { setLoading(false); return; }

    const { data: studentMembers } = await supabase
      .from("group_members")
      .select("user_id")
      .in("group_id", familyGroups.map(g => g.id))
      .eq("member_role", "student");

    const childIds = [...new Set((studentMembers || []).map(m => m.user_id))];
    if (childIds.length === 0) { setLoading(false); return; }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", childIds);

    // Get exercise assignments for all children
    const { data: assignmentsData } = await supabase
      .from("exercise_assignments")
      .select("id, exercise_id, student_id, status, score, completed_at")
      .in("student_id", childIds);

    // Get exercise questions
    const exerciseIds = [...new Set((assignmentsData || []).map(a => a.exercise_id))];
    const { data: exercisesData } = exerciseIds.length > 0
      ? await supabase.from("exercises").select("id, question").in("id", exerciseIds)
      : { data: [] };
    const exMap = Object.fromEntries((exercisesData || []).map(e => [e.id, e.question]));

    const result: ChildProgress[] = (profiles || []).map(p => {
      const childAssignments = (assignmentsData || []).filter(a => a.student_id === p.id);
      const total = childAssignments.length;
      const completed = childAssignments.filter(a => a.status === "completed").length;
      return {
        id: p.id,
        full_name: p.full_name,
        assignments: childAssignments.map(a => ({
          id: a.id,
          exercise_question: exMap[a.exercise_id] || "Unknown Exercise",
          status: a.status,
          score: a.score,
          completed_at: a.completed_at,
        })),
        total,
        completed,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    setChildren(result);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const statusColor = (s: string) => s === "completed" ? "default" : "outline";

  return (
    <DashboardLayout>
      <div className="animate-slide-up">
        <h1 className="text-3xl font-display text-foreground flex items-center gap-2 mb-6">
          <BarChart3 className="w-8 h-8 text-primary" /> Children's Progress
        </h1>

        {loading ? (
          <p className="text-muted-foreground font-body">Loading…</p>
        ) : children.length === 0 ? (
          <Card className="shadow-card border-0 text-center py-12">
            <CardContent>
              <Baby className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-lg font-body text-muted-foreground">No children linked to your account yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {children.map(child => {
              const isExpanded = expandedChild === child.id;
              return (
                <Card key={child.id} className="shadow-card border-0">
                  <CardHeader
                    className="cursor-pointer pb-2"
                    onClick={() => setExpandedChild(isExpanded ? null : child.id)}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-display text-lg flex items-center gap-2">
                        <Baby className="w-5 h-5 text-success" /> {child.full_name}
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{child.completed}/{child.total} completed</Badge>
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground font-body">Overall Progress</span>
                        <span className="font-bold font-body">{child.progress}%</span>
                      </div>
                      <Progress value={child.progress} className="h-3" />
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent>
                      {child.assignments.length === 0 ? (
                        <p className="text-sm text-muted-foreground font-body">No exercises assigned yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {child.assignments.map(a => (
                            <div key={a.id} className="flex items-center justify-between bg-muted/50 rounded-xl px-4 py-3">
                              <div>
                                <p className="font-body font-bold text-sm text-foreground">{a.exercise_question}</p>
                                {a.completed_at && (
                                  <p className="text-xs text-muted-foreground">Completed: {new Date(a.completed_at).toLocaleDateString()}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={statusColor(a.status)} className="capitalize text-xs">
                                  {a.status}
                                </Badge>
                                {a.score !== null && (
                                  <Badge className="text-xs">Score: {a.score}</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

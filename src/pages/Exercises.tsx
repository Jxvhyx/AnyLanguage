import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Dumbbell, Search, UserCheck, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Exercise {
  id: string;
  lesson_id: string;
  question: string;
  options: any;
  correct_answer: string;
  points: number;
  exercise_type: string;
  created_at: string;
}

interface LessonOption {
  id: string;
  title: string;
}

interface Assignment {
  id: string;
  exercise_id: string;
  student_id: string;
  status: string;
  score: number | null;
  assigned_at: string;
  completed_at: string | null;
  student_name?: string;
  exercise_question?: string;
}

interface GroupWithStudents {
  id: string;
  name: string;
  students: { id: string; full_name: string }[];
}

export default function Exercises() {
  const { user, role } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [lessonOptions, setLessonOptions] = useState<LessonOption[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [groups, setGroups] = useState<GroupWithStudents[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Create/edit form
  const [lessonId, setLessonId] = useState("");
  const [question, setQuestion] = useState("");
  const [optionsStr, setOptionsStr] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [points, setPoints] = useState(10);
  const [exerciseType, setExerciseType] = useState("multiple_choice");

  // Assign form
  const [assignMode, setAssignMode] = useState<"group" | "students">("group");
  const [assignGroupId, setAssignGroupId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const canEdit = role === "admin" || role === "teacher";
  const isTeacherOrAdmin = role === "admin" || role === "teacher";

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [exRes, lesRes] = await Promise.all([
      supabase.from("exercises").select("*").order("created_at", { ascending: false }),
      supabase.from("lessons").select("id, title"),
    ]);

    let filtered = exRes.data || [];
    if (filterType !== "all") filtered = filtered.filter(e => e.exercise_type === filterType);
    if (search) filtered = filtered.filter(e => e.question.toLowerCase().includes(search.toLowerCase()));
    setExercises(filtered);
    setLessonOptions(lesRes.data || []);

    // Fetch groups for teacher/admin
    if (isTeacherOrAdmin) {
      const { data: myMemberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id)
        .eq("member_role", role === "admin" ? "admin" : "teacher");

      // For admin, also get all course groups
      let courseGroups: { id: string; name: string }[] = [];
      if (role === "admin") {
        const { data } = await supabase.from("groups").select("id, name").eq("group_type", "course");
        courseGroups = data || [];
      } else {
        const groupIds = (myMemberships || []).map(m => m.group_id);
        if (groupIds.length > 0) {
          const { data } = await supabase.from("groups").select("id, name").in("id", groupIds).eq("group_type", "course");
          courseGroups = data || [];
        }
      }

      if (courseGroups.length > 0) {
        const { data: studentMembers } = await supabase
          .from("group_members")
          .select("group_id, user_id")
          .in("group_id", courseGroups.map(g => g.id))
          .eq("member_role", "student");

        const studentIds = [...new Set((studentMembers || []).map(m => m.user_id))];
        const { data: profiles } = studentIds.length > 0
          ? await supabase.from("profiles").select("id, full_name").in("id", studentIds)
          : { data: [] };
        const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

        setGroups(courseGroups.map(g => ({
          id: g.id,
          name: g.name,
          students: (studentMembers || [])
            .filter(m => m.group_id === g.id)
            .map(m => profileMap[m.user_id])
            .filter(Boolean),
        })));
      }

      // Fetch assignments
      const { data: assigns } = await supabase
        .from("exercise_assignments")
        .select("*")
        .order("assigned_at", { ascending: false });

      if (assigns && assigns.length > 0) {
        const sIds = [...new Set(assigns.map(a => a.student_id))];
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", sIds);
        const pm = Object.fromEntries((profs || []).map(p => [p.id, p]));
        const allExercises = exRes.data || [];
        const exMap = Object.fromEntries(allExercises.map(e => [e.id, e.question]));
        setAssignments(assigns.map(a => ({
          ...a,
          student_name: pm[a.student_id]?.full_name || "Unknown",
          exercise_question: exMap[a.exercise_id] || "Unknown",
        })));
      } else {
        setAssignments([]);
      }
    }

    setLoading(false);
  }, [user, filterType, search, role, isTeacherOrAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setLessonId(""); setQuestion(""); setOptionsStr(""); setCorrectAnswer(""); setPoints(10); setExerciseType("multiple_choice");
    setDialogOpen(true);
  };

  const openEdit = (ex: Exercise) => {
    setEditing(ex);
    setLessonId(ex.lesson_id);
    setQuestion(ex.question);
    setOptionsStr(ex.options ? JSON.stringify(ex.options) : "");
    setCorrectAnswer(ex.correct_answer);
    setPoints(ex.points);
    setExerciseType(ex.exercise_type);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!question.trim() || !lessonId || !correctAnswer.trim()) {
      toast({ variant: "destructive", title: "Fill in all required fields" }); return;
    }
    let parsedOptions = null;
    if (optionsStr.trim()) {
      try { parsedOptions = JSON.parse(optionsStr); } catch { toast({ variant: "destructive", title: "Invalid options JSON" }); return; }
    }
    const data = { lesson_id: lessonId, question: question.trim(), options: parsedOptions, correct_answer: correctAnswer.trim(), points, exercise_type: exerciseType };
    if (editing) {
      const { error } = await supabase.from("exercises").update(data).eq("id", editing.id);
      if (error) { toast({ variant: "destructive", title: error.message }); return; }
      toast({ title: "Exercise updated! ✏️" });
    } else {
      const { error } = await supabase.from("exercises").insert(data);
      if (error) { toast({ variant: "destructive", title: error.message }); return; }
      toast({ title: "Exercise created! 🎉" });
    }
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("exercises").delete().eq("id", id);
    toast({ title: "Exercise deleted" });
    fetchData();
  };

  const openAssign = (ex: Exercise) => {
    setSelectedExercise(ex);
    setAssignMode("group");
    setAssignGroupId("");
    setSelectedStudentIds([]);
    setAssignOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedExercise || !user) return;
    let studentIds: string[] = [];

    if (assignMode === "group" && assignGroupId) {
      const group = groups.find(g => g.id === assignGroupId);
      studentIds = group?.students.map(s => s.id) || [];
    } else {
      studentIds = selectedStudentIds;
    }

    if (studentIds.length === 0) { toast({ title: "No students selected", variant: "destructive" }); return; }

    const rows = studentIds.map(sid => ({
      exercise_id: selectedExercise.id,
      student_id: sid,
      assigned_by: user.id,
      status: "pending" as const,
    }));

    const { error } = await supabase.from("exercise_assignments").insert(rows);
    if (error) { toast({ title: "Error assigning", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Assigned to ${studentIds.length} student(s)` });
    setAssignOpen(false);
    fetchData();
  };

  const handleScoreUpdate = async (assignmentId: string, score: number) => {
    await supabase.from("exercise_assignments").update({ score }).eq("id", assignmentId);
    fetchData();
  };

  const allStudents = [...new Map(groups.flatMap(g => g.students).map(s => [s.id, s])).values()];

  const typeEmoji = (t: string) => {
    const map: Record<string, string> = { multiple_choice: "🔘", fill_blank: "✍️", true_false: "✅", matching: "🔗" };
    return map[t] || "❓";
  };

  const statusColor = (s: string) => s === "completed" ? "default" : "outline";

  return (
    <DashboardLayout>
      <div className="animate-slide-up">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-display text-foreground flex items-center gap-2">
            <Dumbbell className="w-8 h-8 text-secondary" /> Exercises
          </h1>
          {canEdit && <Button onClick={openCreate} className="font-bold"><Plus className="w-4 h-4 mr-2" /> New Exercise</Button>}
        </div>

        {isTeacherOrAdmin ? (
          <Tabs defaultValue="exercises" className="space-y-4">
            <TabsList>
              <TabsTrigger value="exercises">Exercises</TabsTrigger>
              <TabsTrigger value="assignments">Assigned ({assignments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="exercises">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search exercises..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="fill_blank">Fill Blank</SelectItem>
                    <SelectItem value="true_false">True/False</SelectItem>
                    <SelectItem value="matching">Matching</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? <p className="text-muted-foreground">Loading...</p> : exercises.length === 0 ? (
                <Card className="shadow-card border-0 text-center py-12">
                  <CardContent>
                    <Dumbbell className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-lg font-body text-muted-foreground">No exercises yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {exercises.map(ex => (
                    <Card key={ex.id} className="shadow-card border-0 hover:shadow-elevated transition-all group">
                      <CardContent className="p-4 flex items-center gap-4">
                        <span className="text-2xl">{typeEmoji(ex.exercise_type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-bold text-foreground truncate">{ex.question}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">{ex.exercise_type.replace("_", " ")}</Badge>
                            <span className="text-xs text-muted-foreground">{ex.points} pts</span>
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openAssign(ex)} className="p-1.5 rounded-lg hover:bg-primary/10" title="Assign">
                              <UserCheck className="w-4 h-4 text-primary" />
                            </button>
                            <button onClick={() => openEdit(ex)} className="p-1.5 rounded-lg hover:bg-muted"><Edit className="w-4 h-4 text-muted-foreground" /></button>
                            <button onClick={() => handleDelete(ex.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-4 h-4 text-destructive" /></button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="assignments">
              {assignments.length === 0 ? (
                <Card className="shadow-card border-0 text-center py-12">
                  <CardContent>
                    <UserCheck className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-lg font-body text-muted-foreground">No assignments yet. Assign exercises to students!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {assignments.map(a => (
                    <Card key={a.id} className="shadow-card border-0">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-bold text-sm text-foreground truncate">{a.exercise_question}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            → {a.student_name} · {new Date(a.assigned_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusColor(a.status)} className="capitalize text-xs">{a.status}</Badge>
                          <Input
                            type="number"
                            placeholder="Score"
                            className="w-20 h-8 text-xs"
                            defaultValue={a.score ?? ""}
                            onBlur={e => {
                              const v = parseInt(e.target.value);
                              if (!isNaN(v)) handleScoreUpdate(a.id, v);
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search exercises..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem value="fill_blank">Fill Blank</SelectItem>
                  <SelectItem value="true_false">True/False</SelectItem>
                  <SelectItem value="matching">Matching</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {loading ? <p className="text-muted-foreground">Loading...</p> : exercises.length === 0 ? (
              <Card className="shadow-card border-0 text-center py-12">
                <CardContent>
                  <Dumbbell className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-body text-muted-foreground">No exercises yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {exercises.map(ex => (
                  <Card key={ex.id} className="shadow-card border-0">
                    <CardContent className="p-4 flex items-center gap-4">
                      <span className="text-2xl">{typeEmoji(ex.exercise_type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-bold text-foreground truncate">{ex.question}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{ex.exercise_type.replace("_", " ")}</Badge>
                          <span className="text-xs text-muted-foreground">{ex.points} pts</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle className="font-display">{editing ? "Edit Exercise" : "Create Exercise"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Lesson</Label>
                <Select value={lessonId} onValueChange={setLessonId}>
                  <SelectTrigger><SelectValue placeholder="Select lesson" /></SelectTrigger>
                  <SelectContent>{lessonOptions.map(l => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={exerciseType} onValueChange={setExerciseType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="fill_blank">Fill Blank</SelectItem>
                    <SelectItem value="true_false">True/False</SelectItem>
                    <SelectItem value="matching">Matching</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Question</Label><Input value={question} onChange={e => setQuestion(e.target.value)} maxLength={500} /></div>
              <div><Label>Options (JSON array)</Label><Input value={optionsStr} onChange={e => setOptionsStr(e.target.value)} placeholder='["option1","option2"]' /></div>
              <div><Label>Correct Answer</Label><Input value={correctAnswer} onChange={e => setCorrectAnswer(e.target.value)} maxLength={200} /></div>
              <div><Label>Points</Label><Input type="number" value={points} onChange={e => setPoints(Number(e.target.value))} min={1} max={100} /></div>
              <Button onClick={handleSave} className="w-full font-bold">{editing ? "Save" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assign Dialog */}
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Assign Exercise</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground font-body mb-2 truncate">"{selectedExercise?.question}"</p>
            <div className="space-y-4">
              <div>
                <Label>Assign to</Label>
                <Select value={assignMode} onValueChange={v => setAssignMode(v as "group" | "students")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">Entire Course Group</SelectItem>
                    <SelectItem value="students">Select Students</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {assignMode === "group" ? (
                <div>
                  <Label>Course Group</Label>
                  <Select value={assignGroupId} onValueChange={setAssignGroupId}>
                    <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                    <SelectContent>
                      {groups.map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name} ({g.students.length} students)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  <Label>Students</Label>
                  {allStudents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No students in your course groups.</p>
                  ) : allStudents.map(s => (
                    <div key={s.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedStudentIds.includes(s.id)}
                        onCheckedChange={checked => {
                          setSelectedStudentIds(prev =>
                            checked ? [...prev, s.id] : prev.filter(id => id !== s.id)
                          );
                        }}
                      />
                      <span className="text-sm font-body">{s.full_name}</span>
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={handleAssign} className="w-full">Assign</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

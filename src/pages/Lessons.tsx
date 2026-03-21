import { useEffect, useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, BookOpen, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  difficulty: string;
  is_published: boolean;
  teacher_id: string;
  created_at: string;
}

export default function Lessons() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [search, setSearch] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("all");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [isPublished, setIsPublished] = useState(false);

  const canEdit = role === "admin" || role === "teacher";

  const fetchLessons = async () => {
    setLoading(true);
    let query = supabase.from("lessons").select("*").order("created_at", { ascending: false });
    if (filterDifficulty !== "all") query = query.eq("difficulty", filterDifficulty);
    if (search) query = query.ilike("title", `%${search}%`);
    const { data } = await query;
    setLessons(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLessons(); }, [filterDifficulty, search]);

  const openCreate = () => {
    setEditing(null);
    setTitle(""); setDescription(""); setContent(""); setDifficulty("beginner"); setIsPublished(false);
    setDialogOpen(true);
  };

  const openEdit = (lesson: Lesson) => {
    setEditing(lesson);
    setTitle(lesson.title);
    setDescription(lesson.description || "");
    setContent(lesson.content || "");
    setDifficulty(lesson.difficulty);
    setIsPublished(lesson.is_published);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast({ variant: "destructive", title: "Title is required" }); return; }
    if (editing) {
      const { error } = await supabase.from("lessons").update({ title: title.trim(), description, content, difficulty, is_published: isPublished }).eq("id", editing.id);
      if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
      toast({ title: "Lesson updated! ✏️" });
    } else {
      const { error } = await supabase.from("lessons").insert({ title: title.trim(), description, content, difficulty, is_published: isPublished, teacher_id: user!.id });
      if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
      toast({ title: "Lesson created! 🎉" });
    }
    setDialogOpen(false);
    fetchLessons();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    toast({ title: "Lesson deleted" });
    fetchLessons();
  };

  const difficultyColor = (d: string) => {
    if (d === "beginner") return "bg-success/10 text-success";
    if (d === "intermediate") return "bg-warning/10 text-warning";
    return "bg-destructive/10 text-destructive";
  };

  return (
    <DashboardLayout>
      <div className="animate-slide-up">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-display text-foreground flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" /> Lessons
          </h1>
          {canEdit && (
            <Button onClick={openCreate} className="font-bold">
              <Plus className="w-4 h-4 mr-2" /> New Lesson
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search lessons..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
            <SelectTrigger className="w-full sm:w-44">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground font-body">Loading lessons...</p>
        ) : lessons.length === 0 ? (
          <Card className="shadow-card border-0 text-center py-12">
            <CardContent>
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-lg font-body text-muted-foreground">No lessons yet. Create your first one!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessons.map(lesson => (
              <Card key={lesson.id} className="shadow-card border-0 hover:shadow-elevated transition-all group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="font-display text-lg">{lesson.title}</CardTitle>
                    {canEdit && (lesson.teacher_id === user?.id || role === "admin") && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(lesson)} className="p-1.5 rounded-lg hover:bg-muted"><Edit className="w-4 h-4 text-muted-foreground" /></button>
                        <button onClick={() => handleDelete(lesson.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-4 h-4 text-destructive" /></button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2 font-body">{lesson.description || "No description"}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={difficultyColor(lesson.difficulty)}>{lesson.difficulty}</Badge>
                    <Badge variant={lesson.is_published ? "default" : "outline"}>
                      {lesson.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">{editing ? "Edit Lesson" : "Create Lesson"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Lesson title" maxLength={200} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description" maxLength={500} />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Lesson content" rows={4} maxLength={5000} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="rounded" />
                    <span className="text-sm font-body">Published</span>
                  </label>
                </div>
              </div>
              <Button onClick={handleSave} className="w-full font-bold">{editing ? "Save Changes" : "Create Lesson"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

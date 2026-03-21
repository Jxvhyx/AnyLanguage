import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, Edit, Trash2, Plus, Shield, GraduationCap, Baby } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  role?: string;
  email?: string;
}

export default function UsersPage() {
  const { role: myRole } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");

  const fetchUsers = async () => {
  setLoading(true);

  const { data: { session } } = await supabase.auth.getSession();

  const [{ data: profiles }, { data: roles }, emailsRes] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
    supabase.functions.invoke("list-user-emails", {
      headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {},
    }),
  ]);

  const roleMap = new Map((roles || []).map(r => [r.user_id, r.role]));
  const emailMap: Record<string, string> = emailsRes.data?.emails || {};

  let result = (profiles || []).map(p => ({
    ...p,
    role: roleMap.get(p.id) || "student",
    email: emailMap[p.id] || "",
  }));

  if (search) {
    result = result.filter(
      u =>
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(search.toLowerCase())
    );
  }

  if (filterRole !== "all") {
    result = result.filter(u => u.role === filterRole);
  }

  setUsers(result);
  setLoading(false);
};

  useEffect(() => { fetchUsers(); }, [search, filterRole]);

  const openEdit = (u: UserProfile) => {
    setEditUser(u);
    setEditName(u.full_name);
    setEditRole(u.role || "student");
  };

  const handleSave = async () => {
    if (!editUser) return;
    await supabase.from("profiles").update({ full_name: editName.trim() }).eq("id", editUser.id);
    // Update role
    await supabase.from("user_roles").update({ role: editRole as any }).eq("user_id", editUser.id);
    toast({ title: "User updated! ✅" });
    setEditUser(null);
    fetchUsers();
  };

  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

const confirmDelete = async () => {
  if (!deleteTarget) return;
  setDeleting(true);

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("No active session found");
    }

    const res = await supabase.functions.invoke("delete-user", {
      body: { user_id: deleteTarget.id },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (res.error) throw res.error;
    if (res.data?.error) throw new Error(res.data.error);

    toast({ title: "Account deleted permanently ✅" });
    setDeleteTarget(null);
    fetchUsers();
  } catch (e: any) {
    toast({
      title: "Error",
      description: e.message,
      variant: "destructive",
    });
  } finally {
    setDeleting(false);
  }
};

  const roleIcon = (r: string) => {
    const map: Record<string, React.ReactNode> = {
      admin: <Shield className="w-4 h-4" />,
      teacher: <Users className="w-4 h-4" />,
      parent: <Baby className="w-4 h-4" />,
      student: <GraduationCap className="w-4 h-4" />,
    };
    return map[r] || null;
  };

  if (myRole !== "admin") return <DashboardLayout><p className="text-muted-foreground">Access denied.</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="animate-slide-up">
        <h1 className="text-3xl font-display text-foreground flex items-center gap-2 mb-6">
          <Users className="w-8 h-8 text-info" /> Users
        </h1>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="parent">Parent</SelectItem>
              <SelectItem value="student">Student</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? <p className="text-muted-foreground">Loading...</p> : (
          <div className="space-y-2">
            {users.map(u => (
              <Card key={u.id} className="shadow-card border-0 hover:shadow-elevated transition-all group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full gradient-fun flex items-center justify-center text-sm font-bold text-primary-foreground">
                    {u.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-bold text-foreground">{u.full_name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email || "No email"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1 capitalize">
                    {roleIcon(u.role || "student")} {u.role}
                  </Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-muted"><Edit className="w-4 h-4 text-muted-foreground" /></button>
                    <button onClick={() => setDeleteTarget(u)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-4 h-4 text-destructive" /></button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Edit User</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={editName} onChange={e => setEditName(e.target.value)} maxLength={100} /></div>
              <div>
                <Label>Role</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full font-bold">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display text-destructive">Delete Account</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">
              This will permanently delete <strong>{deleteTarget?.full_name}</strong>'s account. They will need to register again. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Permanently"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
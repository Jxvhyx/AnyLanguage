import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Pencil, Trash2, UserPlus, X } from "lucide-react";

interface Group {
  id: string;
  name: string;
  description: string | null;
  group_type: "course" | "family";
  created_at: string;
}

interface GroupMember {
  id: string;
  user_id: string;
  member_role: string;
  profile?: { full_name: string };
}

interface Profile {
  id: string;
  full_name: string;
}

interface UserWithRole extends Profile {
  role?: string;
}

export default function GroupsPage() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [groupType, setGroupType] = useState<"course" | "family">("course");

  // Members dialog
  const [membersOpen, setMembersOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [allUsers, setAllUsers] = useState<UserWithRole[]>([]);
  const [addUserId, setAddUserId] = useState("");
  const [addRole, setAddRole] = useState("student");

  // Filter
  const [filterType, setFilterType] = useState<"all" | "course" | "family">("all");
  const [search, setSearch] = useState("");

  const fetchGroups = async () => {
    setLoading(true);
    const { data } = await supabase.from("groups").select("*").order("created_at", { ascending: false });
    setGroups((data as Group[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, []);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setGroupType("course");
    setFormOpen(true);
  };

  const openEdit = (g: Group) => {
    setEditing(g);
    setName(g.name);
    setDescription(g.description || "");
    setGroupType(g.group_type);
    setFormOpen(true);
  };

  const saveGroup = async () => {
    if (!name.trim()) return;
    if (editing) {
      await supabase.from("groups").update({ name, description, group_type: groupType }).eq("id", editing.id);
      toast({ title: "Group updated" });
    } else {
      await supabase.from("groups").insert({ name, description, group_type: groupType });
      toast({ title: "Group created" });
    }
    setFormOpen(false);
    fetchGroups();
  };

  const deleteGroup = async (id: string) => {
    await supabase.from("groups").delete().eq("id", id);
    toast({ title: "Group deleted" });
    fetchGroups();
  };

  // Members management
  const openMembers = async (g: Group) => {
    setSelectedGroup(g);
    setMembersOpen(true);
    await Promise.all([fetchMembers(g.id), fetchAllUsers()]);
  };

  const fetchMembers = async (groupId: string) => {
    const { data } = await supabase.from("group_members").select("id, user_id, member_role").eq("group_id", groupId);
    if (data) {
      const ids = data.map(m => m.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
      setMembers(data.map(m => ({ ...m, profile: profileMap[m.user_id] })));
    }
  };

  const fetchAllUsers = async () => {
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const roleMap = Object.fromEntries((rolesRes.data || []).map(r => [r.user_id, r.role]));
    setAllUsers((profilesRes.data || []).map(p => ({ ...p, role: roleMap[p.id] })));
  };

  const addMember = async () => {
    if (!addUserId || !selectedGroup) return;
    const { error } = await supabase.from("group_members").insert({
      group_id: selectedGroup.id,
      user_id: addUserId,
      member_role: addRole,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Member added" });
      fetchMembers(selectedGroup.id);
      setAddUserId("");
    }
  };

  const removeMember = async (memberId: string) => {
    if (!selectedGroup) return;
    await supabase.from("group_members").delete().eq("id", memberId);
    toast({ title: "Member removed" });
    fetchMembers(selectedGroup.id);
  };

  const availableRoles = selectedGroup?.group_type === "course"
    ? ["teacher", "student"]
    : ["parent", "student"];

  const filtered = groups.filter(g => {
    if (filterType !== "all" && g.group_type !== filterType) return false;
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="animate-slide-up">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-display text-foreground flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" /> Groups
          </h1>
          <Button onClick={openCreate} className="rounded-xl font-body font-bold">
            <Plus className="w-4 h-4 mr-2" /> New Group
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input
            placeholder="Search groups…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs rounded-xl"
          />
          <Select value={filterType} onValueChange={v => setFilterType(v as any)}>
            <SelectTrigger className="w-40 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="course">Course</SelectItem>
              <SelectItem value="family">Family</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground font-body">Loading…</p>
        ) : filtered.length === 0 ? (
          <Card className="shadow-card border-0 text-center py-12">
            <CardContent>
              <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-lg font-body text-muted-foreground">No groups found. Create your first group!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(g => (
              <Card key={g.id} className="shadow-card border-0 hover:shadow-elevated transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display text-lg">{g.name}</CardTitle>
                    <Badge variant={g.group_type === "course" ? "default" : "secondary"} className="capitalize">
                      {g.group_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {g.description && <p className="text-sm text-muted-foreground font-body mb-4">{g.description}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => openMembers(g)}>
                      <UserPlus className="w-4 h-4 mr-1" /> Members
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => openEdit(g)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-xl text-destructive" onClick={() => deleteGroup(g.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Edit Group" : "Create Group"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Group name" value={name} onChange={e => setName(e.target.value)} className="rounded-xl" />
            <Input placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} className="rounded-xl" />
            <Select value={groupType} onValueChange={v => setGroupType(v as "course" | "family")}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="course">Course</SelectItem>
                <SelectItem value="family">Family</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={saveGroup} className="rounded-xl font-body font-bold">{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Members Dialog */}
      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              Members — {selectedGroup?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {members.length === 0 ? (
              <p className="text-muted-foreground text-sm font-body">No members yet.</p>
            ) : members.map(m => (
              <div key={m.id} className="flex items-center justify-between bg-muted/50 rounded-xl px-3 py-2">
                <div>
                  <span className="font-body font-bold text-foreground">{m.profile?.full_name || "Unknown"}</span>
                  <Badge variant="outline" className="ml-2 capitalize text-xs">{m.member_role}</Badge>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeMember(m.id)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-body font-bold text-foreground">Add Member</p>
            <Select value={addUserId} onValueChange={setAddUserId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select user…" />
              </SelectTrigger>
              <SelectContent>
                {allUsers
                  .filter(u => !members.some(m => m.user_id === u.id))
                  .map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name} {u.role ? `(${u.role})` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select value={addRole} onValueChange={setAddRole}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(r => (
                  <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={addMember} className="w-full rounded-xl font-body font-bold">
              <UserPlus className="w-4 h-4 mr-2" /> Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users } from "lucide-react";

interface GroupWithStudents {
  id: string;
  name: string;
  students: { id: string; full_name: string }[];
}

export default function StudentsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupWithStudents[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroupStudents = async () => {
      // Get course groups where this teacher is a member
      const { data: myMemberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user!.id)
        .eq("member_role", "teacher");

      if (!myMemberships || myMemberships.length === 0) {
        setLoading(false);
        return;
      }

      const groupIds = myMemberships.map(m => m.group_id);

      // Get group info
      const { data: groupsData } = await supabase
        .from("groups")
        .select("id, name")
        .in("id", groupIds)
        .eq("group_type", "course");

      if (!groupsData || groupsData.length === 0) {
        setLoading(false);
        return;
      }

      // Get student members of those groups
      const { data: studentMembers } = await supabase
        .from("group_members")
        .select("group_id, user_id")
        .in("group_id", groupsData.map(g => g.id))
        .eq("member_role", "student");

      const studentIds = [...new Set((studentMembers || []).map(m => m.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", studentIds.length > 0 ? studentIds : ["none"]);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

      setGroups(groupsData.map(g => ({
        id: g.id,
        name: g.name,
        students: (studentMembers || [])
          .filter(m => m.group_id === g.id)
          .map(m => profileMap[m.user_id])
          .filter(Boolean),
      })));
      setLoading(false);
    };
    fetchGroupStudents();
  }, [user]);

  const totalStudents = groups.reduce((sum, g) => sum + g.students.length, 0);

  return (
    <DashboardLayout>
      <div className="animate-slide-up">
        <h1 className="text-3xl font-display text-foreground flex items-center gap-2 mb-6">
          <GraduationCap className="w-8 h-8 text-info" /> My Students
        </h1>

        {loading ? (
          <p className="text-muted-foreground font-body">Loading…</p>
        ) : groups.length === 0 ? (
          <Card className="shadow-card border-0 text-center py-12">
            <CardContent>
              <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-lg font-body text-muted-foreground">You're not assigned to any course groups yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Badge variant="outline" className="text-sm font-body">
              {totalStudents} student{totalStudents !== 1 ? "s" : ""} across {groups.length} group{groups.length !== 1 ? "s" : ""}
            </Badge>
            {groups.map(g => (
              <Card key={g.id} className="shadow-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" /> {g.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {g.students.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-body">No students in this group.</p>
                  ) : (
                    <div className="space-y-2">
                      {g.students.map(s => (
                        <div key={s.id} className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-2">
                          <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center">
                            <GraduationCap className="w-4 h-4 text-info" />
                          </div>
                          <p className="font-body font-bold text-foreground">{s.full_name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

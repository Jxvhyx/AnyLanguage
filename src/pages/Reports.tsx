import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Report {
  id: string;
  student_id: string;
  generated_by: string;
  report_type: string;
  data: any;
  created_at: string;
}

export default function Reports() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
    setReports(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const generateReport = async () => {
    // Fetch student progress and create a report
    const { data: progress } = await supabase.from("student_progress").select("*");
    const reportData = {
      total_exercises: progress?.length || 0,
      completed: progress?.filter(p => p.status === "completed").length || 0,
      total_score: progress?.reduce((s, p) => s + (p.score || 0), 0) || 0,
      generated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("reports").insert({
      student_id: user!.id,
      generated_by: user!.id,
      report_type: "progress",
      data: reportData,
    });
    if (error) { toast({ variant: "destructive", title: error.message }); return; }
    toast({ title: "Report generated! 📊" });
    fetchReports();
  };

  const exportToCSV = (report: Report) => {
    const d = report.data || {};
    const csv = `Report Type,${report.report_type}\nGenerated,${report.created_at}\nTotal Exercises,${d.total_exercises || 0}\nCompleted,${d.completed || 0}\nTotal Score,${d.total_score || 0}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${report.id.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const canGenerate = role === "admin" || role === "teacher";

  return (
    <DashboardLayout>
      <div className="animate-slide-up">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-display text-foreground flex items-center gap-2">
            <FileText className="w-8 h-8 text-accent" /> Reports
          </h1>
          {canGenerate && (
            <Button onClick={generateReport} className="font-bold">
              <Plus className="w-4 h-4 mr-2" /> Generate Report
            </Button>
          )}
        </div>

        {loading ? <p className="text-muted-foreground">Loading...</p> : reports.length === 0 ? (
          <Card className="shadow-card border-0 text-center py-12">
            <CardContent>
              <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-lg font-body text-muted-foreground">No reports yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map(r => (
              <Card key={r.id} className="shadow-card border-0 hover:shadow-elevated transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-body font-bold text-foreground capitalize">{r.report_type} Report</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  {r.data && (
                    <div className="hidden sm:flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{r.data.completed || 0}/{r.data.total_exercises || 0} done</span>
                      <span>{r.data.total_score || 0} pts</span>
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={() => exportToCSV(r)}>
                    <Download className="w-4 h-4 mr-1" /> Export
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

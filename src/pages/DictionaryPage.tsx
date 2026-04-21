import Dictionary from "@/components/Dictionary";
import DashboardLayout from "@/components/DashboardLayout";

export default function DictionaryPage() {
  return (
    <DashboardLayout>
      <div className="animate-slide-up">
        <Dictionary />
      </div>
    </DashboardLayout>
  );
}
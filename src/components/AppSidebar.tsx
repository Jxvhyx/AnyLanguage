import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, GraduationCap, FileText, Users,
  BarChart3, LogOut, Dumbbell, Baby, Settings, BookOpen, Gamepad2
} from "lucide-react";
import logo from "@/assets/logo.png";


const navByRole = {
  admin: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/users", icon: Users, label: "Users" },
    { to: "/groups", icon: Users, label: "Groups" },
    { to: "/lessons", icon: BookOpen, label: "Lessons" },
    { to: "/exercises", icon: Dumbbell, label: "Exercises" },
    { to: "/progress", icon: BarChart3, label: "Progress" },
    { to: "/dictionary", icon: BookOpen, label: "Dictionary" },
    { to: "/minigames", icon: Gamepad2, label: "Minigames" },
    { to: "/reports", icon: FileText, label: "Reports" },
    { to: "/account", icon: Settings, label: "My Account" }
  ],
  teacher: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/lessons", icon: BookOpen, label: "My Lessons" },
    { to: "/exercises", icon: Dumbbell, label: "Exercises" },
    { to: "/students", icon: GraduationCap, label: "My Students" },
    { to: "/progress", icon: BarChart3, label: "Progress" },
    { to: "/dictionary", icon: BookOpen, label: "Dictionary" },
    { to: "/reports", icon: FileText, label: "Reports" },
    { to: "/account", icon: Settings, label: "My Account" }
  ],
  parent: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/children", icon: Baby, label: "My Children" },
    { to: "/parent-progress", icon: BarChart3, label: "Progress" },
    { to: "/dictionary", icon: BookOpen, label: "Dictionary" },
    { to: "/reports", icon: FileText, label: "Reports" },
    { to: "/account", icon: Settings, label: "My Account" }
  ],
  student: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/my-exercises", icon: Dumbbell, label: "My Exercises" },
    { to: "/lessons", icon: BookOpen, label: "Lessons" },
    { to: "/dictionary", icon: BookOpen, label: "Dictionary" },
    { to: "/progress", icon: BarChart3, label: "My Progress" },
    { to: "/minigames", icon: Gamepad2, label: "Minigames" },
    { to: "/account", icon: Settings, label: "My Account" }
  ],

};

export default function AppSidebar() {
  const { role, profile, signOut } = useAuth();
  const location = useLocation();
  const items = navByRole[role || "student"];

  return (
    <aside className="w-64 h-screen bg-sidebar flex flex-col shrink-0 sticky top-0">      <div className="p-6">
      <Link to="/dashboard" className="flex items-center gap-3">
        <img src={logo} alt="AnyLanguage logo" className="w-10 h-10 rounded-xl object-cover" />
        <span className="text-xl font-display text-sidebar-foreground">AnyLanguage</span>
      </Link>
    </div>

      <nav className="flex-1 px-3 space-y-1">
        {items.map(item => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-body font-semibold transition-all ${active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-9 h-9 rounded-full gradient-fun flex items-center justify-center text-sm font-bold text-primary-foreground">
            {profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-sidebar-foreground truncate">{profile?.full_name || "User"}</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground font-body font-semibold transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

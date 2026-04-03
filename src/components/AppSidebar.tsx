import { Home, FileText, Bookmark, Settings, Briefcase, Lock } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

const navItems = [
  { to: "/", label: "Home", icon: Home, protected: false },
  { to: "/applied", label: "Job Applied", icon: FileText, protected: true },
  { to: "/saved", label: "Saved Jobs", icon: Bookmark, protected: true },
  { to: "/profile", label: "Profile", icon: Settings, protected: false },
];

export default function AppSidebar() {
  const { isProfileComplete } = useApp();

  const handleProtectedClick = (e: React.MouseEvent, item: typeof navItems[0]) => {
    if (item.protected && !isProfileComplete) {
      e.preventDefault();
      toast.warning("Please complete your profile first");
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-[260px] min-h-screen border-r border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-foreground tracking-tight">Connairo Careers</span>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isLocked = item.protected && !isProfileComplete;
          return (
            <NavLink
              key={item.label}
              to={isLocked ? "/profile" : item.to}
              end={item.to === "/"}
              onClick={(e) => handleProtectedClick(e, item)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium settle-transition ${
                  isLocked
                    ? "text-muted-foreground/50 cursor-not-allowed"
                    : isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
              {item.label}
              {isLocked && <Lock className="w-3.5 h-3.5 ml-auto" />}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground">© 2026 Connairo Careers</p>
      </div>
    </aside>
  );
}

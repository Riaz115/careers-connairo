import { Menu, Bell, AlertCircle, User, LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import MobileNav from "./MobileNav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AppHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isProfileComplete, profile, logout } = useApp();
  const navigate = useNavigate();

  const displayName = profile.fullName || "User";
  const initials = profile.fullName
    ? profile.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-muted settle-transition"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>

        <div className="hidden lg:block" />

        <div className="flex items-center gap-4">
          {!isProfileComplete && (
            <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-warning/15 text-warning-foreground text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              Profile Incomplete
            </span>
          )}
          <button className="p-2 rounded-lg hover:bg-muted settle-transition relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted settle-transition outline-none">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-foreground leading-none">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {profile.email || "Set up your profile"}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => navigate("/profile")}
                className="cursor-pointer gap-2"
              >
                <User className="w-4 h-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

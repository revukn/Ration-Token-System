import { Link, useLocation } from "wouter";
import { 
  useGetCurrentUser, 
  useLogoutUser, 
  getGetCurrentUserQueryKey 
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { LayoutDashboard, Users, Ticket, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useGetCurrentUser();
  const logoutUser = useLogoutUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleLogout = () => {
    logoutUser.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), null);
        setLocation("/admin/login");
        toast({ title: "Logged out successfully" });
      },
    });
  };

  if (isLoading) {
    return <div className="min-h-screen bg-muted/30 animate-pulse" />;
  }

  // Redirect non-admins
  if (user && user.role !== "admin") {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex-shrink-0 flex flex-col hidden md:flex h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Logo compact />
            <span className="font-semibold text-sm tracking-tight">Admin Portal</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <Link 
            href="/admin/dashboard" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              location === "/admin/dashboard" 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link 
            href="/admin/tokens" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              location === "/admin/tokens" 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Ticket className="h-4 w-4" />
            Token Management
          </Link>
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <Avatar className="h-9 w-9 border">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {"GA"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium truncate">GovtAdmin</span>
              <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 md:hidden flex items-center justify-between px-4 border-b bg-card sticky top-0 z-10">
          <Logo compact />
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </header>
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

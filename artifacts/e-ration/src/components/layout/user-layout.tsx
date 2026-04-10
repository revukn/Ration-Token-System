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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, LayoutDashboard, Ticket } from "lucide-react";

export function UserLayout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useGetCurrentUser();
  const logoutUser = useLogoutUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleLogout = () => {
    logoutUser.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), null);
        setLocation("/");
        toast({ title: "Logged out successfully" });
      },
    });
  };

  if (isLoading) {
    return <div className="min-h-screen bg-muted/30 animate-pulse" />;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between mx-auto px-4">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <Logo />
          </Link>

          {user && (
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-muted-foreground">
                <Link href="/dashboard" className="hover:text-foreground transition-colors data-[active=true]:text-primary data-[active=true]:font-semibold">
                  Dashboard
                </Link>
                <Link href="/my-tokens" className="hover:text-foreground transition-colors data-[active=true]:text-primary data-[active=true]:font-semibold">
                  My Tokens
                </Link>
              </nav>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex w-full items-center cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-tokens" className="flex w-full items-center cursor-pointer">
                      <Ticket className="mr-2 h-4 w-4" />
                      <span>My Tokens</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

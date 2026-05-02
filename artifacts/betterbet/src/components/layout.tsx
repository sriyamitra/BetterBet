import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Trophy, Home, PlusCircle, LogOut } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export function Layout({ children, showNav = true }: LayoutProps) {
  const { isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground pb-20 md:pb-0">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link href={isAuthenticated ? "/challenges" : "/"} className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            <Trophy className="h-6 w-6 text-secondary" />
            BetterBet
          </Link>
          {isAuthenticated && (
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto md:px-4 flex flex-col">
        {children}
      </main>

      {isAuthenticated && showNav && (
        <nav className="fixed bottom-0 z-50 w-full border-t border-border bg-background/95 backdrop-blur md:hidden">
          <div className="flex h-16 items-center justify-around px-4">
            <Link href="/challenges" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary focus:text-primary">
              <Home className="h-6 w-6 mb-1" />
              <span className="text-[10px] font-medium">Home</span>
            </Link>
            <div className="relative -top-5">
              <Link href="/challenges/new" className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 focus:ring-4 focus:ring-primary/20 active-elevate-2 transition-all">
                <PlusCircle className="h-8 w-8" />
              </Link>
            </div>
            <Link href="/profile" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary focus:text-primary">
              <Trophy className="h-6 w-6 mb-1" />
              <span className="text-[10px] font-medium">Wins</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}

import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Trophy, Target, Zap, ArrowRight } from "lucide-react";
import { useEffect } from "react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/challenges");
    }
  }, [isAuthenticated, setLocation]);

  return (
    <Layout showNav={false}>
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-12 text-center">
        <div className="mb-8 p-6 bg-secondary/20 rounded-full animate-bounce-sm">
          <Trophy className="w-24 h-24 text-secondary drop-shadow-md" />
        </div>
        
        <h1 className="text-5xl font-extrabold tracking-tighter text-foreground mb-4">
          Accountability<br/>
          <span className="text-primary">Meets Wager</span>
        </h1>
        
        <p className="text-lg text-muted-foreground mb-12 max-w-sm">
          Challenge a friend. Set the stakes. Check in daily with photo proof. Loser pays up.
        </p>

        <div className="grid gap-4 w-full max-w-sm">
          <Link href="/register" className="w-full">
            <Button size="lg" className="w-full h-14 text-lg font-bold shadow-lg hover-elevate">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          <Link href="/login" className="w-full">
            <Button variant="outline" size="lg" className="w-full h-14 text-lg font-semibold">
              Log In
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-6 w-full max-w-sm text-left">
          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold">Set a Goal</h3>
            <p className="text-sm text-muted-foreground">Gym, reading, coding. You pick it.</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-secondary" />
            </div>
            <h3 className="font-bold">Set a Wager</h3>
            <p className="text-sm text-muted-foreground">Dinner, drinks, or cold hard cash.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

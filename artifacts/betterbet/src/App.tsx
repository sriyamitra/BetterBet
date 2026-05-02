import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Challenges from "@/pages/challenges";
import CreateChallenge from "@/pages/challenges/new";
import ChallengeDashboard from "@/pages/challenges/[id]";
import ChallengeCheckin from "@/pages/challenges/[id]/checkin";
import ChallengeResult from "@/pages/challenges/[id]/result";
import JoinChallenge from "@/pages/join";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) return null;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/join/:inviteCode" component={JoinChallenge} />
      
      <Route path="/challenges">
        {() => <ProtectedRoute component={Challenges} />}
      </Route>
      <Route path="/challenges/new">
        {() => <ProtectedRoute component={CreateChallenge} />}
      </Route>
      <Route path="/challenges/:id">
        {() => <ProtectedRoute component={ChallengeDashboard} />}
      </Route>
      <Route path="/challenges/:id/checkin">
        {() => <ProtectedRoute component={ChallengeCheckin} />}
      </Route>
      <Route path="/challenges/:id/result">
        {() => <ProtectedRoute component={ChallengeResult} />}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

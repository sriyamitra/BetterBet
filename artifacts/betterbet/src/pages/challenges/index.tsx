import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useListChallenges, getListChallengesQueryKey } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Trophy, Plus, Users, Clock, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, isPast } from "date-fns";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function Challenges() {
  const { data: challenges, isLoading } = useListChallenges({ query: { queryKey: getListChallengesQueryKey() } });
  const [inviteCode, setInviteCode] = useState("");
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim()) {
      setLocation(`/join/${inviteCode.trim().toUpperCase()}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-primary text-primary-foreground";
      case "pending": return "bg-secondary text-secondary-foreground";
      case "completed": return "bg-green-500 text-white";
      case "cancelled": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="p-4 pt-6 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My Challenges</h1>
          <p className="text-muted-foreground">Welcome back, {user.displayName}</p>
        </div>

        <form onSubmit={handleJoin} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Enter invite code..." 
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="pl-10 h-12 uppercase"
              maxLength={8}
            />
          </div>
          <Button type="submit" className="h-12 font-bold" disabled={!inviteCode.trim()}>
            Join
          </Button>
        </form>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : challenges?.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent text-center py-12 px-4 shadow-none">
            <CardContent className="flex flex-col items-center justify-center p-0">
              <Trophy className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">No active challenges</h3>
              <p className="text-muted-foreground mb-6 max-w-[250px]">
                Create a new challenge and invite a friend to hold each other accountable.
              </p>
              <Link href="/challenges/new">
                <Button size="lg" className="font-bold">
                  <Plus className="mr-2 h-5 w-5" /> Create Challenge
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {challenges?.map((challenge) => {
              const isParticipant = challenge.participants.some(p => p.userId === user.id);
              
              return (
                <Link key={challenge.id} href={`/challenges/${challenge.id}`}>
                  <Card className="hover-elevate cursor-pointer border-border/50 shadow-sm overflow-hidden group transition-all">
                    <div className="flex flex-col md:flex-row h-full">
                      {/* Status strip */}
                      <div className={`h-2 md:h-auto md:w-2 ${
                        challenge.status === 'active' ? 'bg-primary' : 
                        challenge.status === 'pending' ? 'bg-secondary' : 
                        challenge.status === 'completed' ? 'bg-green-500' : 'bg-muted'
                      }`} />
                      
                      <CardContent className="p-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">{challenge.title}</h3>
                          <Badge variant="secondary" className={`${getStatusColor(challenge.status)} uppercase text-[10px] tracking-wider font-bold`}>
                            {challenge.status}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          Goal: {challenge.goal}
                        </p>
                        
                        <div className="mt-auto pt-4 border-t border-border flex justify-between items-center text-xs font-medium">
                          <div className="flex items-center text-amber-600 dark:text-amber-500 font-bold bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                            <Trophy className="h-3.5 w-3.5 mr-1" />
                            {challenge.wager}
                          </div>
                          
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <div className="flex items-center">
                              <Users className="h-3.5 w-3.5 mr-1" />
                              {challenge.participants.length}/2
                            </div>
                            
                            {challenge.endDate && challenge.status === 'active' && (
                              <div className="flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                {isPast(new Date(challenge.endDate)) ? 'Ended' : formatDistanceToNow(new Date(challenge.endDate))} left
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

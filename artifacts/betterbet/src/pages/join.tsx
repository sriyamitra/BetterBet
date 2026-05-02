import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetChallengeByInviteCode, getGetChallengeByInviteCodeQueryKey, useJoinChallenge, getListChallengesQueryKey } from "@workspace/api-client-react";
import { useRoute, useLocation, Link } from "wouter";
import { Trophy, Target, Clock, ArrowLeft, Loader2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

export default function JoinChallenge() {
  const [, params] = useRoute("/join/:inviteCode");
  const inviteCode = params?.inviteCode?.toUpperCase();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: challenge, isLoading, error } = useGetChallengeByInviteCode(inviteCode || "", {
    query: {
      enabled: !!inviteCode,
      queryKey: getGetChallengeByInviteCodeQueryKey(inviteCode || ""),
    }
  });

  const joinMutation = useJoinChallenge();

  const handleJoin = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login or register to join this challenge.",
      });
      setLocation("/login");
      return;
    }

    if (!challenge) return;

    joinMutation.mutate(
      { challengeId: challenge.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListChallengesQueryKey() });
          toast({
            title: "Joined Successfully!",
            description: "You are now part of the challenge.",
          });
          setLocation(`/challenges/${challenge.id}`);
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Could not join",
            description: err.message || "Failed to join challenge",
          });
        }
      }
    );
  };

  if (!inviteCode) {
    setLocation("/");
    return null;
  }

  return (
    <Layout showNav={false}>
      <div className="flex-1 flex flex-col justify-center p-4 py-12">
        <Link href="/" className="mb-6 inline-flex items-center text-muted-foreground hover:text-foreground w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to home
        </Link>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : error || !challenge ? (
          <Card className="border-destructive bg-destructive/5 text-center py-12">
            <CardContent>
              <h3 className="text-xl font-bold text-destructive mb-2">Challenge Not Found</h3>
              <p className="text-muted-foreground">The invite code "{inviteCode}" is invalid or expired.</p>
              <Button variant="outline" className="mt-6" onClick={() => setLocation("/")}>Go Home</Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary/20 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-secondary" />
            <CardContent className="pt-8 px-6 pb-8 text-center space-y-6">
              
              <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
                <Users className="h-8 w-8" />
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                  You've been invited to
                </p>
                <h2 className="text-3xl font-extrabold tracking-tight mb-2">{challenge.title}</h2>
                <p className="text-lg text-muted-foreground">
                  Created by <span className="font-bold text-foreground">{challenge.participants[0]?.displayName || 'Unknown'}</span>
                </p>
              </div>

              <div className="bg-muted rounded-xl p-4 text-left grid gap-4">
                <div className="flex gap-3">
                  <Target className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <span className="text-sm font-bold block">The Goal</span>
                    <span className="text-sm text-muted-foreground">{challenge.goal}</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Trophy className="h-5 w-5 text-secondary shrink-0" />
                  <div>
                    <span className="text-sm font-bold block">The Wager</span>
                    <span className="text-sm text-muted-foreground">{challenge.wager}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <span className="text-sm font-bold block">Duration</span>
                    <span className="text-sm text-muted-foreground">{challenge.durationDays} Days ({challenge.requiredCheckinsPerWeek}x per week)</span>
                  </div>
                </div>
              </div>

              {challenge.status !== "pending" ? (
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg font-bold">
                  This challenge has already started and cannot be joined.
                </div>
              ) : challenge.participants.length >= 2 ? (
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg font-bold">
                  This challenge is full.
                </div>
              ) : (
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg font-bold shadow-lg"
                  onClick={handleJoin}
                  disabled={joinMutation.isPending}
                >
                  {joinMutation.isPending ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Joining...</>
                  ) : "Accept Challenge"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetChallengeSummary, getGetChallengeSummaryQueryKey } from "@workspace/api-client-react";
import { useRoute, useLocation, Link } from "wouter";
import { Trophy, Home, Frown, PartyPopper, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function ChallengeResult() {
  const [, params] = useRoute("/challenges/:id/result");
  const challengeId = parseInt(params?.id || "0", 10);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: summary, isLoading } = useGetChallengeSummary(challengeId, {
    query: {
      enabled: !!challengeId,
      queryKey: getGetChallengeSummaryQueryKey(challengeId),
    },
  });

  if (isLoading || !summary) {
    return <Layout><div className="p-8 text-center">Loading...</div></Layout>;
  }

  // Challenge still in progress — show a friendly screen instead of redirecting
  if (summary.challenge.status !== "completed") {
    return (
      <Layout showNav={false}>
        <div className="flex-1 flex flex-col items-center justify-center p-6 py-16 text-center">
          <div className="mb-6 p-6 bg-primary/10 rounded-full">
            <Clock className="w-20 h-20 text-primary" />
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-3">Still Going!</h1>
          <p className="text-lg text-muted-foreground mb-2">
            This challenge is still <span className="font-bold text-foreground">in progress</span>.
          </p>
          <p className="text-sm text-muted-foreground mb-10">
            Results will be available once all {summary.challenge.durationDays} days are up.
          </p>
          <div className="w-full max-w-xs space-y-3">
            <Button
              size="lg"
              className="w-full h-14 font-bold text-lg"
              onClick={() => setLocation(`/challenges/${challengeId}`)}
            >
              Back to Challenge
            </Button>
            <Link href="/challenges" className="block w-full">
              <Button variant="outline" size="lg" className="w-full h-14 font-bold">
                <Home className="mr-2 h-5 w-5" /> All Challenges
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const { winner, outcome, challenge, progress } = summary;

  const amIWinner = winner === user?.displayName;
  const isTie = winner === null && (outcome === "both_won" || outcome === "both_lost");

  const opponentProgress = progress.find((p) => p.userId !== user?.id);
  const myProgress = progress.find((p) => p.userId === user?.id);

  return (
    <Layout showNav={false}>
      <div className="flex-1 flex flex-col items-center justify-center p-4 py-12 text-center">

        {isTie ? (
          <div className="mb-6 p-6 bg-muted rounded-full animate-in zoom-in">
            <Trophy className="w-20 h-20 text-muted-foreground" />
          </div>
        ) : amIWinner ? (
          <div className="mb-6 p-6 bg-yellow-100 dark:bg-yellow-900/40 rounded-full animate-in zoom-in duration-500">
            <PartyPopper className="w-20 h-20 text-yellow-600 dark:text-yellow-500" />
          </div>
        ) : (
          <div className="mb-6 p-6 bg-destructive/10 rounded-full animate-in slide-in-from-bottom">
            <Frown className="w-20 h-20 text-destructive" />
          </div>
        )}

        <h1 className="text-5xl font-black tracking-tight mb-2 uppercase">
          {isTie ? "It's a Tie!" : amIWinner ? "You Won!" : "You Lost!"}
        </h1>

        <p className="text-xl font-medium text-muted-foreground mb-8">
          {amIWinner ? "You dominated." : isTie ? "Honour among rivals." : "Better luck next time."}
        </p>

        <Card
          className={`w-full max-w-sm mb-8 border-2 shadow-xl ${
            amIWinner
              ? "border-primary bg-primary/5"
              : isTie
              ? "border-border"
              : "border-destructive bg-destructive/5"
          }`}
        >
          <CardContent className="p-6">
            <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">
              The Settlement
            </div>
            {isTie ? (
              <p className="text-lg font-bold">No one pays the wager.</p>
            ) : (
              <div>
                <p className="text-2xl font-black text-foreground mb-1">{challenge.wager}</p>
                <p className="text-sm font-medium">
                  {amIWinner ? (
                    <span className="text-primary">{opponentProgress?.displayName} owes you!</span>
                  ) : (
                    <span className="text-destructive">You owe {opponentProgress?.displayName}!</span>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-12">
          <div className="bg-muted p-4 rounded-xl text-center">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Your Check-ins</p>
            <p className="text-3xl font-black">{myProgress?.totalCheckins || 0}</p>
          </div>
          <div className="bg-muted p-4 rounded-xl text-center">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">
              {opponentProgress?.displayName}&apos;s
            </p>
            <p className="text-3xl font-black">{opponentProgress?.totalCheckins || 0}</p>
          </div>
        </div>

        <Link href="/challenges" className="w-full max-w-sm">
          <Button size="lg" className="w-full h-14 font-bold text-lg">
            <Home className="mr-2 h-5 w-5" /> Back to Dashboard
          </Button>
        </Link>
      </div>
    </Layout>
  );
}

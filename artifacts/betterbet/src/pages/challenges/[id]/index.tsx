import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useGetChallengeSummary,
  getGetChallengeSummaryQueryKey,
  useListCheckins,
  getListCheckinsQueryKey,
  type Checkin,
} from "@workspace/api-client-react";
import { useRoute, useLocation, Link } from "wouter";
import { Trophy, Clock, Image as ImageIcon, Copy, Check, Info, Users, Share2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function ChallengeDashboard() {
  const [, params] = useRoute("/challenges/:id");
  const challengeId = parseInt(params?.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const { data: summary, isLoading, error } = useGetChallengeSummary(challengeId, {
    query: {
      enabled: !!challengeId,
      queryKey: getGetChallengeSummaryQueryKey(challengeId),
      refetchInterval: 10000,
    },
  });

  const { data: checkins } = useListCheckins(challengeId, {
    query: {
      enabled: !!challengeId && summary?.challenge.status !== "pending",
      queryKey: getListCheckinsQueryKey(challengeId),
      refetchInterval: 30000,
    },
  });

  const getInviteUrl = () => {
    const code = summary?.challenge.inviteCode;
    if (!code) return "";
    return `${window.location.origin}/join/${code}`;
  };

  const copyInvite = async () => {
    const url = getInviteUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied!", description: "Send it to your friend." });
  };

  const shareInvite = async () => {
    const url = getInviteUrl();
    const code = summary?.challenge.inviteCode;
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my BetterBet challenge: ${summary?.challenge.title}`,
          text: `I'm challenging you! Use code ${code} or tap the link to accept.`,
          url,
        });
      } catch {
        // user cancelled share — no-op
      }
    } else {
      await copyInvite();
    }
  };

  if (!challengeId || error) {
    return (
      <Layout>
        <div className="p-4 flex flex-col items-center justify-center min-h-[50vh]">
          <h2 className="text-2xl font-bold mb-4">Challenge Not Found</h2>
          <Button onClick={() => setLocation("/challenges")}>Go Back</Button>
        </div>
      </Layout>
    );
  }

  if (isLoading || !summary) {
    return (
      <Layout>
        <div className="p-4 pt-6 space-y-6">
          <Skeleton className="h-12 w-3/4 mb-2" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  const { challenge, progress, daysRemaining } = summary;
  const isPending = challenge.status === "pending";
  const isCompleted = challenge.status === "completed";

  const myProgress = progress.find((p) => p.userId === user?.id);
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const checkedInToday = myProgress?.checkinDates.includes(todayStr);

  const generateGrid = (p: typeof progress[0]) => {
    const totalBoxes = challenge.durationDays;
    const boxes = [];
    for (let i = 0; i < totalBoxes; i++) {
      boxes.push(
        <div key={i} className="w-full aspect-square rounded-sm bg-muted border border-border" />
      );
    }
    for (let i = 0; i < p.totalCheckins; i++) {
      if (boxes[i]) {
        boxes[i] = (
          <div key={i} className="w-full aspect-square rounded-sm bg-primary border-primary shadow-sm" />
        );
      }
    }
    return boxes;
  };

  // Group checkins by userId for the photo gallery
  const checkinsByUser: Record<number, Checkin[]> = {};
  if (checkins) {
    for (const c of checkins) {
      if (!c.photoUrl) continue;
      if (!checkinsByUser[c.userId]) checkinsByUser[c.userId] = [];
      checkinsByUser[c.userId].push(c);
    }
  }
  const hasPhotos = Object.keys(checkinsByUser).length > 0;

  return (
    <Layout>
      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2"
            onClick={() => setLightboxPhoto(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxPhoto}
            alt="Check-in proof"
            className="max-w-full max-h-full rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="p-4 pt-6 pb-24 space-y-6">

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <Badge variant="outline" className="mb-2 font-bold uppercase tracking-wider text-xs">
              {challenge.status}
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight">{challenge.title}</h1>
            <p className="text-muted-foreground">{challenge.goal}</p>
          </div>
          {isCompleted && (
            <Button size="sm" onClick={() => setLocation(`/challenges/${challengeId}/result`)}>
              View Results
            </Button>
          )}
        </div>

        {/* Wager Callout */}
        <Card className="border-secondary bg-secondary/10 shadow-sm relative overflow-hidden">
          <div className="absolute -right-6 -top-6 opacity-20">
            <Trophy className="h-32 w-32 text-secondary" />
          </div>
          <CardContent className="p-5 flex items-center gap-4 relative z-10">
            <div className="bg-secondary text-secondary-foreground p-3 rounded-full shrink-0 shadow-lg">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">The Wager</p>
              <p className="text-xl font-bold">{challenge.wager}</p>
            </div>
          </CardContent>
        </Card>

        {isPending ? (
          <Card className="border-dashed border-2 bg-muted/30">
            <CardContent className="p-6 text-center flex flex-col items-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold mb-2">Waiting for opponent</h3>
              <p className="text-sm text-muted-foreground mb-6">Share this link with a friend so they can join.</p>

              <div className="flex items-center justify-center gap-2 mb-3 bg-background border rounded-lg p-2 w-full max-w-xs mx-auto">
                <span className="text-3xl font-mono font-bold tracking-widest px-4 py-2">{challenge.inviteCode}</span>
              </div>

              <p className="text-xs text-muted-foreground font-mono break-all mb-5 px-2 max-w-xs">
                {getInviteUrl()}
              </p>

              <div className="flex gap-3 w-full max-w-xs">
                <Button variant="outline" onClick={copyInvite} className="flex-1 font-bold">
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
                <Button variant="secondary" onClick={shareInvite} className="flex-1 font-bold">
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Status Bar */}
            <div className="flex items-center justify-between bg-muted rounded-lg p-3 text-sm font-medium">
              <div className="flex items-center text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                {daysRemaining} Days Left
              </div>
              <div className="flex items-center text-muted-foreground">
                <Info className="h-4 w-4 mr-2" />
                Goal: {challenge.requiredCheckinsPerWeek}x / week
              </div>
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-2 gap-4">
              {progress.map((p) => (
                <Card
                  key={p.userId}
                  className={`overflow-hidden border-2 ${p.userId === user?.id ? "border-primary" : "border-border"}`}
                >
                  <CardContent className="p-0 flex flex-col h-full">
                    <div className={`p-3 text-center border-b ${p.userId === user?.id ? "bg-primary/10" : "bg-muted"}`}>
                      <p className="font-bold text-sm truncate">{p.displayName}</p>
                      <p className="text-xs text-muted-foreground">{p.userId === user?.id ? "(You)" : ""}</p>
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase">Streak</p>
                          <p className="text-2xl font-black">
                            {p.streak}
                            <span className="text-sm text-muted-foreground font-normal"> 🔥</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground font-medium uppercase">Total</p>
                          <p className="text-xl font-bold">
                            {p.totalCheckins}
                            <span className="text-sm text-muted-foreground font-normal">/{challenge.durationDays}</span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase mb-2 text-center">
                          Check-ins
                        </p>
                        <div className="grid grid-cols-7 gap-1">{generateGrid(p)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Photo Gallery */}
            {hasPhotos && (
              <div>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" /> Recent Proof
                </h2>
                <div className="space-y-4">
                  {progress.map((p) => {
                    const photos = checkinsByUser[p.userId];
                    if (!photos || photos.length === 0) return null;
                    return (
                      <div key={p.userId}>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                          {p.displayName}
                          {p.userId === user?.id ? " (You)" : ""}
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
                          {photos.slice().reverse().map((c) => (
                            <button
                              key={c.id}
                              className="shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 border-border shadow-sm hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                              onClick={() => setLightboxPhoto(c.photoUrl!)}
                            >
                              <img
                                src={c.photoUrl!}
                                alt={`Check-in ${c.date}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Action Button for Check-in */}
      {!isPending && !isCompleted && challenge.participants.length === 2 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent md:max-w-lg md:mx-auto">
          {checkedInToday ? (
            <Button
              disabled
              className="w-full h-16 text-lg font-bold rounded-2xl shadow-lg border-2 border-primary/20 bg-primary/10 text-primary opacity-100"
            >
              <Check className="mr-2 h-6 w-6" /> You checked in today!
            </Button>
          ) : (
            <Link href={`/challenges/${challengeId}/checkin`} className="block w-full">
              <Button className="w-full h-16 text-lg font-bold rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                <ImageIcon className="mr-2 h-6 w-6" /> Submit Today's Check-in
              </Button>
            </Link>
          )}
        </div>
      )}
    </Layout>
  );
}

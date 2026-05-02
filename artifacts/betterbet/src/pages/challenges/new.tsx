import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateChallenge, getListChallengesQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Trophy, Target, Clock, CalendarCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const createChallengeSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(50, "Title too long"),
  goal: z.string().min(5, "Be specific about the goal").max(100, "Goal too long"),
  wager: z.string().min(2, "What's at stake?").max(50, "Wager too long"),
  durationDays: z.coerce.number().int().min(1, "Must be at least 1 day"),
  requiredCheckinsPerWeek: z.coerce.number().int().min(1, "Min 1").max(7, "Max 7"),
});

type CreateFormValues = z.infer<typeof createChallengeSchema>;

export default function CreateChallenge() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createChallengeSchema),
    defaultValues: {
      title: "",
      goal: "",
      wager: "",
      durationDays: 14,
      requiredCheckinsPerWeek: 7,
    },
  });

  const createMutation = useCreateChallenge();

  const onSubmit = (data: CreateFormValues) => {
    createMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getListChallengesQueryKey() });
          toast({
            title: "Challenge Created!",
            description: "Share the invite code to start.",
          });
          setLocation(`/challenges/${res.id}`);
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Failed to create challenge",
            description: err.message || "An error occurred",
          });
        },
      }
    );
  };

  return (
    <Layout>
      <div className="p-4 pt-6 space-y-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/challenges")} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-extrabold tracking-tight">New Challenge</h1>
        </div>

        <Card className="border-border shadow-lg">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                <div className="space-y-6">
                  <div className="flex items-center font-bold text-lg text-primary border-b pb-2">
                    <Target className="mr-2 h-5 w-5" /> The Basics
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Challenge Name</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g. Summer Shred, Read 10 Books" className="h-12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="goal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">The Goal</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g. Go to the gym every morning" className="h-12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-6">
                  <div className="flex items-center font-bold text-lg text-secondary border-b pb-2">
                    <Trophy className="mr-2 h-5 w-5" /> The Stakes
                  </div>

                  <FormField
                    control={form.control}
                    name="wager"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">The Wager (Loser pays/does...)</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g. Buys steak dinner, pays $50" className="h-12 border-secondary/50 focus-visible:ring-secondary" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-6">
                  <div className="flex items-center font-bold text-lg border-b pb-2">
                    <Clock className="mr-2 h-5 w-5 text-muted-foreground" /> Duration
                  </div>

                  <FormField
                    control={form.control}
                    name="durationDays"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={(val) => field.onChange(parseInt(val))}
                            defaultValue={field.value.toString()}
                            className="grid grid-cols-3 gap-4"
                          >
                            <FormItem>
                              <FormControl>
                                <RadioGroupItem value="7" className="peer sr-only" />
                              </FormControl>
                              <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer">
                                <span className="text-xl font-bold">7</span>
                                <span className="text-xs text-muted-foreground font-medium uppercase">Days</span>
                              </FormLabel>
                            </FormItem>
                            <FormItem>
                              <FormControl>
                                <RadioGroupItem value="14" className="peer sr-only" />
                              </FormControl>
                              <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer">
                                <span className="text-xl font-bold">14</span>
                                <span className="text-xs text-muted-foreground font-medium uppercase">Days</span>
                              </FormLabel>
                            </FormItem>
                            <FormItem>
                              <FormControl>
                                <RadioGroupItem value="30" className="peer sr-only" />
                              </FormControl>
                              <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer">
                                <span className="text-xl font-bold">30</span>
                                <span className="text-xs text-muted-foreground font-medium uppercase">Days</span>
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-6">
                  <div className="flex items-center font-bold text-lg border-b pb-2">
                    <CalendarCheck className="mr-2 h-5 w-5 text-muted-foreground" /> Check-ins
                  </div>

                  <FormField
                    control={form.control}
                    name="requiredCheckinsPerWeek"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="font-semibold">Required check-ins per week</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(val) => field.onChange(parseInt(val))}
                            defaultValue={field.value.toString()}
                            className="flex flex-wrap gap-2"
                          >
                            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                              <FormItem key={num} className="flex-1">
                                <FormControl>
                                  <RadioGroupItem value={num.toString()} className="peer sr-only" />
                                </FormControl>
                                <FormLabel className="flex items-center justify-center rounded-md border border-muted bg-popover py-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground cursor-pointer font-bold">
                                  {num === 7 ? "Everyday" : num}
                                </FormLabel>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg font-bold" 
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating...</>
                  ) : "Create Challenge"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

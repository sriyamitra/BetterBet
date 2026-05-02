import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const registerSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(20, "Display name too long"),
  pin: z.string().length(4, "PIN must be exactly 4 digits").regex(/^\d+$/, "PIN must be numbers only"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const { login: setAuth } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      pin: "",
    },
  });

  const registerMutation = useRegister();

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          setAuth(res.user, res.token);
          setLocation("/challenges");
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Registration failed",
            description: err.message || "Failed to create account",
          });
        },
      }
    );
  };

  return (
    <Layout showNav={false}>
      <div className="flex-1 flex flex-col justify-center p-4">
        <Card className="border-border shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-extrabold tracking-tight text-primary">Create Account</CardTitle>
            <CardDescription className="text-base">Pick a unique display name and a simple 4-digit PIN.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g. Champ99" className="h-12 text-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Create 4-Digit PIN</FormLabel>
                      <FormControl>
                        <div className="flex justify-center">
                          <InputOTP maxLength={4} {...field}>
                            <InputOTPGroup className="gap-2">
                              <InputOTPSlot index={0} className="w-14 h-14 text-2xl font-bold bg-muted rounded-md border-border" />
                              <InputOTPSlot index={1} className="w-14 h-14 text-2xl font-bold bg-muted rounded-md border-border" />
                              <InputOTPSlot index={2} className="w-14 h-14 text-2xl font-bold bg-muted rounded-md border-border" />
                              <InputOTPSlot index={3} className="w-14 h-14 text-2xl font-bold bg-muted rounded-md border-border" />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </FormControl>
                      <FormMessage className="text-center" />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg font-bold" 
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Registering...</>
                  ) : "Join BetterBet"}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="font-bold text-primary hover:underline">
                Log in here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

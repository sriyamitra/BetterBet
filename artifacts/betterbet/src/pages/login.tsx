import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const loginSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  pin: z.string().length(4, "PIN must be exactly 4 digits").regex(/^\d+$/, "PIN must be numbers only"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login: setAuth } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      displayName: "",
      pin: "",
    },
  });

  const loginMutation = useLogin();

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          setAuth(res.user, res.token);
          setLocation("/challenges");
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Login failed",
            description: err.message || "Invalid display name or PIN",
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
            <CardTitle className="text-3xl font-extrabold tracking-tight text-primary">Welcome Back</CardTitle>
            <CardDescription className="text-base">Enter your details to log in</CardDescription>
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
                        <Input placeholder="Enter your display name" className="h-12 text-lg" {...field} />
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
                      <FormLabel className="text-base font-semibold">4-Digit PIN</FormLabel>
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
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Logging in...</>
                  ) : "Log In"}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/register" className="font-bold text-primary hover:underline">
                Register here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

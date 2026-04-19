import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAdminLogin, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { Lock } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const loginMutation = useAdminLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (response) => {
          queryClient.setQueryData(getGetCurrentUserQueryKey(), response.user);
          setLocation("/admin/dashboard");
          toast({ title: "Admin login successful" });
        },
        onError: (error: any) => {
          toast({
            title: "Login failed",
            description: error.message || "Invalid credentials",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center bg-white p-4 rounded-xl shadow-lg w-fit mx-auto">
          <Logo />
        </div>
        <Card className="border-t-4 border-t-primary shadow-2xl">
          <CardHeader className="space-y-1 text-center bg-muted/30 pb-6">
            <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Authorized Personnel</CardTitle>
            <CardDescription>
              Admin Portal Login
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Email</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@karnataka.gov.in" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-semibold" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Authenticating..." : "Login to Dashboard"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="border-t bg-muted/50 px-6 py-4">
            <div className="text-sm text-muted-foreground text-center">
              Need citizen access?
            </div>
            <div className="mt-3">
              <Link href="/">
                <button
                  type="button"
                  className="w-full py-2 px-4 rounded-md border-2 border-primary text-primary font-semibold text-sm hover:bg-primary hover:text-white transition-colors"
                >
                  Citizen Login Portal
                </button>
              </Link>
            </div>
          </CardFooter>
        </Card>
        <div className="text-center text-slate-400 text-xs flex flex-col gap-1">
          <span>Karnataka State Government E-Ration Administration</span>
          <span className="opacity-50">Secure System Access Only</span>
        </div>
      </div>
    </div>
  );
}

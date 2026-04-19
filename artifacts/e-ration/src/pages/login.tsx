import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLoginUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
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
import { RationCardSearch } from "@/components/ui/ration-card-search";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";

const loginSchema = z.object({
  rationCardNumber: z.string().min(10, "Please enter a valid ration card number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const loginMutation = useLoginUser();
  const [rationCardValid, setRationCardValid] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rationCardNumber: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (response) => {
          queryClient.setQueryData(getGetCurrentUserQueryKey(), response.user);
          if (response.user.role === "admin") {
            setLocation("/admin/dashboard");
          } else {
            setLocation("/dashboard");
          }
          toast({ title: "Login successful" });
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
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo />
        </div>
        <Card className="border-t-4 border-t-primary shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">Citizen Login</CardTitle>
            <CardDescription>
              Enter your ration card number and password to access the E-Ration Token System
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="rationCardNumber"
                  render={() => (
                    <FormItem>
                      <FormLabel>Ration Card Number</FormLabel>
                      <FormControl>
                        <RationCardSearch
                          value={form.watch("rationCardNumber")}
                          onChange={(value) => form.setValue("rationCardNumber", value)}
                          onValidation={(valid, message) => setRationCardValid(valid)}
                          allowRegistered
                        />
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
                  className="w-full" 
                  disabled={loginMutation.isPending || !rationCardValid}
                >
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center space-y-3 border-t bg-muted/50 px-6 py-4">
            <div className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Register here
              </Link>
            </div>
            <div className="w-full border-t pt-3">
              <Link href="/admin/login">
                <button
                  type="button"
                  className="w-full py-2 px-4 rounded-md border-2 border-primary text-primary font-semibold text-sm hover:bg-primary hover:text-white transition-colors"
                >
                  Admin Portal Login
                </button>
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

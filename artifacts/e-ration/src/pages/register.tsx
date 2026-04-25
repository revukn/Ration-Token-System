import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegisterUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
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
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { RationCardSearch } from "@/components/ui/ration-card-search";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle2, ArrowLeft } from "lucide-react";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rationCardNumber: z.string().min(10, "Please enter a valid ration card number"),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const registerMutation = useRegisterUser();
  const [rationCardValid, setRationCardValid] = useState(false);
  
  // Email verification states
  const [registrationStep, setRegistrationStep] = useState<'form' | 'verify'>('form');
  const [pendingRegistration, setPendingRegistration] = useState<any>(null);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpValue, setEmailOtpValue] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      rationCardNumber: "",
    },
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    const fullName = values.lastName 
      ? `${values.firstName} ${values.lastName}` 
      : values.firstName;
    
    // Store registration data and move to email verification step
    setPendingRegistration({
      name: fullName,
      email: values.email,
      password: values.password,
      rationCardNumber: values.rationCardNumber,
    });
    
    // Send OTP to email for verification
    // This would call the same OTP endpoint used in verification
    fetch('/api/verification/send-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: values.email })
    })
    .then(res => res.json())
    .then(data => {
      setEmailOtpSent(true);
      setRegistrationStep('verify');
      toast({ 
        title: "Verification Email Sent", 
        description: "Please check your inbox and enter the 6-digit code." 
      });
    })
    .catch(err => {
      toast({
        title: "Failed to Send Verification Email",
        description: "Unable to send verification email. Please try again.",
        variant: "destructive",
      });
    });
  };

  const handleVerifyEmailOtp = () => {
    if (emailOtpValue.length !== 6) return;
    
    // Verify OTP and complete registration
    fetch('/api/verification/verify-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: pendingRegistration.email, 
        otp: emailOtpValue 
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.verified) {
        setEmailVerified(true);
        // Complete the registration
        registerMutation.mutate(
          { data: pendingRegistration },
          {
            onSuccess: (response) => {
              queryClient.setQueryData(getGetCurrentUserQueryKey(), response.user);
              setLocation("/dashboard");
              toast({ title: "Registration successful" });
            },
            onError: (error: any) => {
              toast({
                title: "Registration Failed",
                description: "Unable to create your account. Please check your information and try again.",
                variant: "destructive",
              });
            },
          }
        );
      } else {
        toast({
          title: "Invalid OTP",
          description: "The OTP you entered is incorrect. Please try again.",
          variant: "destructive",
        });
      }
    })
    .catch(err => {
      toast({
        title: "Verification Failed",
        description: "Unable to verify OTP. Please try again.",
        variant: "destructive",
      });
    });
  };

  // Email Verification Step
if (registrationStep === 'verify') {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo />
        </div>
        <Card className="border-t-4 border-t-primary shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">Verify Your Email</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to {pendingRegistration?.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 flex flex-col items-center">
              <div className="text-center space-y-2 mb-2">
                <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm font-semibold">Verification email sent</p>
                <p className="text-xs text-muted-foreground">Check your inbox and enter the 6-digit code below</p>
              </div>

              <InputOTP maxLength={6} value={emailOtpValue} onChange={setEmailOtpValue}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>

              <Button
                className="w-full"
                onClick={handleVerifyEmailOtp}
                disabled={registerMutation.isPending || emailOtpValue.length !== 6}
              >
                {registerMutation.isPending ? "Verifying..." : "Verify Email"}
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { 
                  setRegistrationStep('form'); 
                  setEmailOtpSent(false); 
                  setEmailOtpValue(""); 
                }} 
                className="text-muted-foreground gap-1"
              >
                <ArrowLeft className="h-3 w-3" /> Back to Registration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo />
        </div>
        <Card className="border-t-4 border-t-primary shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">Citizen Registration</CardTitle>
            <CardDescription>
              Create an account to use the E-Ration Token System
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name (optional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email address" {...field} />
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
                        <Input type="password" placeholder="Enter your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    A verification code will be sent to your email address to confirm it's real and not already registered.
                  </AlertDescription>
                </Alert>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={registerMutation.isPending || !rationCardValid}
                >
                  {registerMutation.isPending ? "Sending verification..." : "Send Verification Code"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center space-y-2 border-t bg-muted/50 px-6 py-4">
            <div className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/" className="text-primary hover:underline font-medium">
                Login here
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RationCardSearch } from "@/components/ui/ration-card-search";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/logo";
import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

type Step = "email" | "otp" | "reset" | "success";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("email");
  const [rationCardNumber, setRationCardNumber] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [rationCardValid, setRationCardValid] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!rationCardNumber.trim() || !rationCardValid) {
      toast({
        title: "Invalid Ration Card",
        description: "Please select a valid ration card number from the list",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rationCardNumber: rationCardNumber.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Error",
          description: data.message || "Something went wrong",
          variant: "destructive",
        });
        return;
      }

      setMaskedEmail(data.email || "");
      setStep("otp");
      setCountdown(300);
      toast({ title: "OTP Sent", description: data.message });
    } catch {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    await handleSendOtp();
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rationCardNumber, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Verification Failed",
          description: data.message || "Invalid OTP",
          variant: "destructive",
        });
        return;
      }

      setStep("reset");
      toast({ title: "OTP Verified", description: "Please set your new password" });
    } catch {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rationCardNumber, otp, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Reset Failed",
          description: data.message || "Could not reset password",
          variant: "destructive",
        });
        return;
      }

      setStep("success");
      toast({ title: "Success", description: data.message });
    } catch {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[
        { key: "email", icon: Mail, label: "Email" },
        { key: "otp", icon: ShieldCheck, label: "OTP" },
        { key: "reset", icon: KeyRound, label: "Reset" },
      ].map((s, i) => {
        const stepOrder = ["email", "otp", "reset", "success"];
        const currentIndex = stepOrder.indexOf(step);
        const itemIndex = stepOrder.indexOf(s.key);
        const isActive = itemIndex === currentIndex;
        const isDone = itemIndex < currentIndex;

        return (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`h-0.5 w-8 transition-colors ${
                  isDone ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : isDone
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted bg-muted/50 text-muted-foreground"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <s.icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  isActive
                    ? "text-primary"
                    : isDone
                      ? "text-primary/70"
                      : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo />
        </div>

        <Card className="border-t-4 border-t-primary shadow-lg">
          {step !== "success" && (
            <CardHeader className="space-y-1 text-center pb-2">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Forgot Password
              </CardTitle>
              <CardDescription>
                {step === "email" && "Enter your ration card number to receive a password reset OTP"}
                {step === "otp" && `Enter the 6-digit OTP sent to ${maskedEmail}`}
                {step === "reset" && "Create a new password for your account"}
              </CardDescription>
            </CardHeader>
          )}

          <CardContent className="pt-4">
            {step !== "success" && stepIndicator}

            {/* Step 1: Enter ration card number */}
            {step === "email" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rationCardNumber">Ration Card Number</Label>
                  <RationCardSearch
                    value={rationCardNumber}
                    onChange={setRationCardNumber}
                    onValidation={(valid, message) => setRationCardValid(valid)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleSendOtp}
                  disabled={loading || !rationCardNumber.trim() || !rationCardValid}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send OTP
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Step 2: Enter OTP */}
            {step === "otp" && (
              <div className="space-y-5">
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center w-full">
                    <p className="text-sm text-muted-foreground">
                      OTP sent to <span className="font-semibold text-foreground">{maskedEmail}</span>
                    </p>
                  </div>

                  <div className="space-y-2 w-full flex flex-col items-center">
                    <Label>Enter OTP</Label>
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <div className="text-center">
                    {countdown > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Resend OTP in{" "}
                        <span className="font-semibold text-primary">
                          {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
                        </span>
                      </p>
                    ) : (
                      <button
                        onClick={handleResendOtp}
                        className="text-sm text-primary hover:underline font-medium"
                        disabled={loading}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                    }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Verify OTP
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Reset password */}
            {step === "reset" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password (min 6 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setStep("otp");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleResetPassword}
                    disabled={
                      loading ||
                      newPassword.length < 6 ||
                      newPassword !== confirmPassword
                    }
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Reset Password
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {step === "success" && (
              <div className="flex flex-col items-center text-center space-y-4 py-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-foreground">
                    Password Reset Successful!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your password has been changed. You can now login with your new password.
                  </p>
                </div>
                <Button className="w-full mt-4" onClick={() => setLocation("/")}>
                  Go to Login
                </Button>
              </div>
            )}
          </CardContent>

          {step !== "success" && (
            <CardFooter className="flex items-center justify-center border-t bg-muted/50 px-6 py-4">
              <div className="text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link
                  href="/"
                  className="text-primary hover:underline font-medium"
                >
                  Back to Login
                </Link>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}

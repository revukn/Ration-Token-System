import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { UserLayout } from "@/components/layout/user-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSendOtp, useVerifyOtp, useVerifyFace, useGenerateToken, getGetMyTokensQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Camera, CheckCircle2, ShieldCheck, Smartphone, Ticket } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Verify() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [flowData, setFlowData] = useState<{rationCardNumber: string, selectedMembers: string[]} | null>(null);
  
  // OTP State
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  
  // Face State
  const [faceMemberName, setFaceMemberName] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Common State
  const [isVerified, setIsVerified] = useState(false);
  const [verificationType, setVerificationType] = useState<"otp" | "face">("otp");

  const sendOtpMutation = useSendOtp();
  const verifyOtpMutation = useVerifyOtp();
  const verifyFaceMutation = useVerifyFace();
  const generateTokenMutation = useGenerateToken();

  useEffect(() => {
    const data = sessionStorage.getItem("rationTokenFlow");
    if (!data) {
      setLocation("/dashboard");
      return;
    }
    const parsed = JSON.parse(data);
    setFlowData(parsed);
    if (parsed.selectedMembers.length > 0) {
      setFaceMemberName(parsed.selectedMembers[0]);
    }
  }, [setLocation]);

  const handleSendOtp = () => {
    if (!aadhaarNumber || aadhaarNumber.length < 12) {
      toast({ title: "Invalid Aadhaar", description: "Please enter a valid 12-digit Aadhaar number.", variant: "destructive" });
      return;
    }
    sendOtpMutation.mutate(
      { data: { aadhaarNumber, rationCardNumber: flowData!.rationCardNumber } },
      {
        onSuccess: () => {
          setOtpSent(true);
          toast({ title: "OTP Sent", description: "An OTP has been sent to your registered mobile number." });
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message || "Failed to send OTP", variant: "destructive" });
        }
      }
    );
  };

  const handleVerifyOtp = () => {
    if (otpValue.length !== 6) return;
    
    verifyOtpMutation.mutate(
      { data: { aadhaarNumber, otp: otpValue, rationCardNumber: flowData!.rationCardNumber } },
      {
        onSuccess: (res) => {
          if (res.verified) {
            setIsVerified(true);
            setVerificationType("otp");
            toast({ title: "Verification Successful" });
          } else {
            toast({ title: "Verification Failed", description: res.message, variant: "destructive" });
          }
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  const simulateCapture = () => {
    setCapturedImage("data:image/png;base64,mock-face-data...");
    setCameraActive(false);
  };

  const handleVerifyFace = () => {
    if (!capturedImage) return;
    
    verifyFaceMutation.mutate(
      { data: { 
        rationCardNumber: flowData!.rationCardNumber, 
        memberName: faceMemberName, 
        faceData: capturedImage 
      }},
      {
        onSuccess: (res) => {
          if (res.verified) {
            setIsVerified(true);
            setVerificationType("face");
            toast({ title: "Face Verification Successful" });
          } else {
            toast({ title: "Verification Failed", description: res.message, variant: "destructive" });
            setCapturedImage(null);
          }
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
          setCapturedImage(null);
        }
      }
    );
  };

  const handleGenerateToken = () => {
    generateTokenMutation.mutate(
      { data: {
        rationCardNumber: flowData!.rationCardNumber,
        selectedMembers: flowData!.selectedMembers,
        verificationType: verificationType
      }},
      {
        onSuccess: () => {
          sessionStorage.removeItem("rationTokenFlow");
          queryClient.invalidateQueries({ queryKey: getGetMyTokensQueryKey() });
          setLocation("/my-tokens");
          toast({ title: "Token Generated Successfully", description: "Your ration token is ready." });
        },
        onError: (err: any) => {
          toast({ title: "Error Generating Token", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  if (!flowData) return null;

  if (isVerified) {
    return (
      <UserLayout>
        <div className="max-w-md mx-auto mt-10">
          <Card className="border-primary/50 text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl">Identity Verified</CardTitle>
              <CardDescription>Authentication completed successfully.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 mb-6 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Ration Card:</span>
                  <span className="font-medium">{flowData.rationCardNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Members:</span>
                  <span className="font-medium">{flowData.selectedMembers.length} selected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Method:</span>
                  <span className="font-medium capitalize">{verificationType}</span>
                </div>
              </div>
              <Button 
                size="lg" 
                className="w-full text-lg h-14" 
                onClick={handleGenerateToken}
                disabled={generateTokenMutation.isPending}
              >
                <Ticket className="mr-2 h-5 w-5" />
                {generateTokenMutation.isPending ? "Generating..." : "Generate Token"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Identity Verification</h1>
          <p className="text-muted-foreground">Verify your identity to generate the token.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Choose Verification Method</CardTitle>
            <CardDescription>Select either Aadhaar OTP or Face Recognition to proceed.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="otp" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="otp" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" /> OTP Verification
                </TabsTrigger>
                <TabsTrigger value="face" className="flex items-center gap-2">
                  <Camera className="h-4 w-4" /> Face Recognition
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="otp" className="space-y-6">
                {!otpSent ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="aadhaar">Aadhaar Number</Label>
                      <Input 
                        id="aadhaar" 
                        placeholder="Enter 12-digit Aadhaar Number" 
                        value={aadhaarNumber}
                        onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleSendOtp}
                      disabled={sendOtpMutation.isPending || aadhaarNumber.length < 12}
                    >
                      {sendOtpMutation.isPending ? "Sending..." : "Send OTP"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6 flex flex-col items-center">
                    <div className="text-center space-y-2 mb-4">
                      <ShieldCheck className="h-12 w-12 text-primary mx-auto" />
                      <p className="text-sm font-medium">OTP sent to mobile linked with Aadhaar ending in {aadhaarNumber.slice(-4)}</p>
                    </div>
                    
                    <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
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
                      onClick={handleVerifyOtp}
                      disabled={verifyOtpMutation.isPending || otpValue.length !== 6}
                    >
                      {verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
                    </Button>
                    
                    <Button variant="link" size="sm" onClick={() => setOtpSent(false)} className="text-muted-foreground">
                      Change Aadhaar Number
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="face" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Member for Verification</Label>
                    <select 
                      className="w-full border-input bg-background rounded-md px-3 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={faceMemberName}
                      onChange={(e) => setFaceMemberName(e.target.value)}
                    >
                      {flowData.selectedMembers.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {capturedImage ? (
                    <div className="space-y-4 flex flex-col items-center">
                      <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-primary bg-muted">
                        {/* Mock image - representing captured face */}
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                          <CheckCircle2 className="w-12 h-12 text-primary" />
                        </div>
                      </div>
                      <Alert className="bg-muted">
                        <AlertDescription className="text-center font-medium">
                          Image captured successfully
                        </AlertDescription>
                      </Alert>
                      <div className="flex gap-4 w-full">
                        <Button variant="outline" className="flex-1" onClick={() => setCapturedImage(null)}>
                          Retake
                        </Button>
                        <Button 
                          className="flex-1" 
                          onClick={handleVerifyFace}
                          disabled={verifyFaceMutation.isPending}
                        >
                          {verifyFaceMutation.isPending ? "Verifying..." : "Verify Identity"}
                        </Button>
                      </div>
                    </div>
                  ) : cameraActive ? (
                    <div className="space-y-4 flex flex-col items-center">
                      <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-dashed border-primary/50 relative bg-slate-900">
                        {/* Simulated camera feed */}
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                          <Camera className="w-12 h-12 animate-pulse" />
                        </div>
                        {/* Scanning overlay effect */}
                        <div className="absolute inset-0 bg-primary/10 animate-[scan_2s_ease-in-out_infinite]" />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Please position your face within the frame and look directly at the camera.
                      </p>
                      <div className="flex gap-4 w-full">
                        <Button variant="outline" className="flex-1" onClick={() => setCameraActive(false)}>
                          Cancel
                        </Button>
                        <Button className="flex-1" onClick={simulateCapture}>
                          Capture Image
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 flex flex-col items-center py-6">
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-2">
                        <Camera className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <p className="text-center text-muted-foreground max-w-sm text-sm">
                        For face verification, we'll need access to your camera to capture an image and match it with government records.
                      </p>
                      <Button className="w-full max-w-xs mt-4" onClick={() => setCameraActive(true)}>
                        Open Camera
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}

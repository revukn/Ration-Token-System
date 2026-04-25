import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { UserLayout } from "@/components/layout/user-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSendOtp, useVerifyOtp, useVerifyFace, useGenerateToken, getGetMyTokensQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Camera, CheckCircle2, ShieldCheck, Smartphone, Ticket, Mail, RefreshCw, VideoOff, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Verify() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [flowData, setFlowData] = useState<{ rationCardNumber: string; selectedMembers: string[]; membersWithFaceData: string[] } | null>(null);

  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");

  const [faceMemberName, setFaceMemberName] = useState("");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    const faceMembers = parsed.membersWithFaceData || [];
    if (faceMembers.length > 0) {
      setFaceMemberName(faceMembers[0]);
    } else if (parsed.selectedMembers.length > 0) {
      setFaceMemberName(parsed.selectedMembers[0]);
    }
  }, [setLocation]);

  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraStream]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  }, [cameraStream]);

  const startCamera = async () => {
    setCameraError(null);
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      setCameraStream(stream);
      setCameraActive(true);
    } catch (err: any) {
      let msg = "Could not access camera.";
      if (err.name === "NotAllowedError") msg = "Camera permission denied. Please allow camera access in your browser settings.";
      else if (err.name === "NotFoundError") msg = "No camera found on this device.";
      else if (err.name === "NotReadableError") msg = "Camera is in use by another application.";
      setCameraError(msg);
      toast({ title: "Camera Error", description: msg, variant: "destructive" });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(imageData);
    stopCamera();
    setIsCapturing(false);
  };

  const handleSendOtp = () => {
    if (!aadhaarNumber || aadhaarNumber.length < 12) {
      toast({ title: "Invalid Aadhaar", description: "Please enter a valid 12-digit Aadhaar number.", variant: "destructive" });
      return;
    }
    sendOtpMutation.mutate(
      { data: { aadhaarNumber, rationCardNumber: flowData!.rationCardNumber } },
      {
        onSuccess: (data) => {
          setOtpSent(true);
          toast({ title: "OTP Sent", description: "OTP sent successfully to your email. Please check your inbox." });
        },
        onError: (err: any) => {
          const errorMessage = err.message || "Unable to send OTP. Please check your connection and try again.";
        const errorTitle = errorMessage.includes("Aadhaar") ? "Aadhaar Verification Failed" : "OTP Send Failed";
        toast({ title: errorTitle, description: errorMessage, variant: "destructive" });
        },
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
            toast({ title: "Verification Successful", description: "Aadhaar identity confirmed." });
          } else {
            toast({ title: "Verification Failed", description: res.message, variant: "destructive" });
          }
        },
        onError: (err: any) => {
          toast({ title: "OTP Verification Failed", description: "The OTP you entered is incorrect or expired. Please try again.", variant: "destructive" });
        },
      }
    );
  };

  const handleVerifyFace = () => {
    if (!capturedImage) return;
    verifyFaceMutation.mutate(
      {
        data: {
          rationCardNumber: flowData!.rationCardNumber,
          memberName: faceMemberName,
          faceData: capturedImage,
        },
      },
      {
        onSuccess: (res) => {
          if (res.verified) {
            setIsVerified(true);
            setVerificationType("face");
            toast({ title: "Face Verification Successful", description: "Identity confirmed." });
          } else {
            toast({ title: "Verification Failed", description: res.message, variant: "destructive" });
            setCapturedImage(null);
          }
        },
        onError: (err: any) => {
          toast({ title: "Face Verification Failed", description: "Unable to verify your face. Please try again or use OTP verification.", variant: "destructive" });
          setCapturedImage(null);
        },
      }
    );
  };

  const handleGenerateToken = () => {
    generateTokenMutation.mutate(
      {
        data: {
          rationCardNumber: flowData!.rationCardNumber,
          selectedMembers: flowData!.selectedMembers,
          verificationType: verificationType,
          ...(verificationType === "face" && capturedImage ? { capturedFaceData: capturedImage, faceVerificationMember: faceMemberName } : {}),
        } as any,
      },
      {
        onSuccess: () => {
          sessionStorage.removeItem("rationTokenFlow");
          queryClient.invalidateQueries({ queryKey: getGetMyTokensQueryKey() });
          toast({ title: "Token Generated!", description: "A confirmation has been sent to your registered email." });
          setLocation("/my-tokens");
        },
        onError: (err: any) => {
          toast({ title: "Token Generation Failed", description: "Unable to generate your ration token. Please try again later.", variant: "destructive" });
        },
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
                  <span className="font-medium capitalize">{verificationType === "otp" ? "Aadhaar OTP" : "Face Recognition"}</span>
                </div>
              </div>
              <Alert className="mb-4 bg-blue-50 border-blue-200 text-blue-800">
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  A token confirmation will be sent to your registered email address.
                </AlertDescription>
              </Alert>
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
        <div className="flex items-center gap-4">
          <Button className="w-full gap-2" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Identity Verification</h1>
          <p className="text-muted-foreground">Verify your identity to generate the ration token.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Choose Verification Method</CardTitle>
            <CardDescription>Select Aadhaar OTP (sent to your email) or Face Recognition.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="otp" className="w-full">
              <TabsList className={`grid w-full mb-8 ${(flowData?.membersWithFaceData?.length || 0) > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <TabsTrigger value="otp" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" /> OTP Verification
                </TabsTrigger>
                {(flowData?.membersWithFaceData?.length || 0) > 0 && (
                  <TabsTrigger value="face" className="flex items-center gap-2">
                    <Camera className="h-4 w-4" /> Face Recognition
                  </TabsTrigger>
                )}
              </TabsList>

              {/* OTP Tab */}
              <TabsContent value="otp" className="space-y-6">
                {!otpSent ? (
                  <div className="space-y-4">
                    <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                      <Mail className="h-4 w-4" />
                      <AlertDescription>
                        The OTP will be sent to your registered email address.
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                      <Label htmlFor="aadhaar">Aadhaar Number</Label>
                      <Input
                        id="aadhaar"
                        placeholder="Enter 12-digit Aadhaar Number"
                        value={aadhaarNumber}
                        onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                        maxLength={12}
                      />
                      <p className="text-xs text-muted-foreground">{aadhaarNumber.length}/12 digits entered</p>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleSendOtp}
                      disabled={sendOtpMutation.isPending || aadhaarNumber.length < 12}
                    >
                      {sendOtpMutation.isPending ? "Sending OTP..." : "Send OTP to Email"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6 flex flex-col items-center">
                    <div className="text-center space-y-2 mb-2">
                      <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                        <Mail className="h-7 w-7 text-primary" />
                      </div>
                      <p className="text-sm font-semibold">OTP sent to your registered email</p>
                      <p className="text-xs text-muted-foreground">Check your inbox and enter the 6-digit code below</p>
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
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      {verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
                    </Button>

                    <Button variant="ghost" size="sm" onClick={() => { setOtpSent(false); setOtpValue(""); }} className="text-muted-foreground gap-1">
                      <RefreshCw className="h-3 w-3" /> Resend OTP
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Face Recognition Tab */}
              <TabsContent value="face" className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Member for Verification</Label>
                  <select
                    className="w-full border-input bg-background rounded-md px-3 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={faceMemberName}
                    onChange={(e) => setFaceMemberName(e.target.value)}
                  >
                    {(flowData.membersWithFaceData || []).map((m: string) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Hidden canvas for capture */}
                <canvas ref={canvasRef} className="hidden" />

                {capturedImage ? (
                  <div className="space-y-4 flex flex-col items-center">
                    <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-primary shadow-lg">
                      <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                    </div>
                    <Alert className="bg-green-50 border-green-200 text-green-800">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>Photo captured. Click Verify to confirm identity.</AlertDescription>
                    </Alert>
                    <div className="flex gap-3 w-full">
                      <Button variant="outline" className="flex-1" onClick={() => { setCapturedImage(null); setCameraActive(false); }}>
                        Retake
                      </Button>
                      <Button className="flex-1" onClick={handleVerifyFace} disabled={verifyFaceMutation.isPending}>
                        {verifyFaceMutation.isPending ? "Verifying..." : "Verify Identity"}
                      </Button>
                    </div>
                  </div>
                ) : cameraActive ? (
                  <div className="space-y-4 flex flex-col items-center">
                    <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden border-4 border-primary shadow-lg bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                      {/* Face guide overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-60 border-4 border-white/60 rounded-full" />
                      </div>
                      <div className="absolute bottom-3 left-0 right-0 text-center">
                        <span className="text-white text-xs bg-black/50 px-3 py-1 rounded-full">
                          Position your face in the oval
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3 w-full max-w-sm">
                      <Button variant="outline" className="flex-1 gap-1" onClick={stopCamera}>
                        <VideoOff className="h-4 w-4" /> Cancel
                      </Button>
                      <Button className="flex-1 gap-1" onClick={capturePhoto} disabled={isCapturing}>
                        <Camera className="h-4 w-4" /> {isCapturing ? "Capturing..." : "Capture Photo"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 flex flex-col items-center py-4">
                    {cameraError ? (
                      <Alert className="bg-red-50 border-red-200 text-red-800">
                        <VideoOff className="h-4 w-4" />
                        <AlertDescription>{cameraError}</AlertDescription>
                      </Alert>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                        <Camera className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                    <p className="text-center text-muted-foreground max-w-sm text-sm">
                      We'll access your camera to capture a photo for face-based identity verification.
                    </p>
                    <Button className="w-full max-w-xs gap-2" onClick={startCamera}>
                      <Camera className="h-4 w-4" /> Open Camera
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}

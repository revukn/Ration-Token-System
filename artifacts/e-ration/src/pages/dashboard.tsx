import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { UserLayout } from "@/components/layout/user-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useGetCurrentUser, useVerifyRationCard, useGetMyTokens } from "@workspace/api-client-react";
import { Users, ArrowRight, Info, Zap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: currentUser } = useGetCurrentUser();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hasLoadedFamilyDetails, setHasLoadedFamilyDetails] = useState(false);
  
  const verifyRCMutation = useVerifyRationCard();
  const { data: myTokens } = useGetMyTokens();

  // Load family details once when component mounts with valid user
  useEffect(() => {
    if (currentUser?.rationCardNumber && !hasLoadedFamilyDetails && !verifyRCMutation.isPending) {
      setHasLoadedFamilyDetails(true);
      verifyRCMutation.mutate({
        data: { rationCardNumber: currentUser.rationCardNumber }
      }, {
        onError: (err: any) => {
          toast({
            title: "Ration Card Verification Failed",
            description: "Unable to find your ration card details. Please check your card number and try again.",
            variant: "destructive"
          });
        }
      });
    }
  }, [currentUser?.rationCardNumber, hasLoadedFamilyDetails]);

  const handleMemberToggle = (memberName: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberName) 
        ? prev.filter(n => n !== memberName)
        : [...prev, memberName]
    );
  };

  const handleContinue = () => {
    if (selectedMembers.length === 0) {
      toast({
        title: "No Members Selected",
        description: "Please select at least one family member.",
        variant: "destructive"
      });
      return;
    }
    
    // Store selection in sessionStorage for next step
    const membersWithFaceData = cardDetails?.familyMembers
      .filter((m: any) => selectedMembers.includes(m.name) && m.hasFaceData)
      .map((m: any) => m.name) || [];
    
    sessionStorage.setItem("rationTokenFlow", JSON.stringify({
      rationCardNumber: currentUser?.rationCardNumber,
      selectedMembers,
      membersWithFaceData,
    }));
    
    setIsDialogOpen(false);
    setLocation("/verify");
  };

  const cardDetails = verifyRCMutation.data;

  return (
    <UserLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-2xl w-full space-y-8">
          {/* Welcome Section - Centered */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Welcome to E-Ration Services</h1>
            <p className="text-lg text-muted-foreground">Generate tokens to collect your ration supplies seamlessly.</p>
          </div>

          {/* Family Member Details Card */}
          <Card className="border-t-4 border-t-primary shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Family Member Details
              </CardTitle>
              <CardDescription>Your registered family members information</CardDescription>
            </CardHeader>
            <CardContent>
              {cardDetails ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Card Holder</p>
                      <p className="font-semibold">{cardDetails.holderName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Card Type</p>
                      <p className="font-semibold text-primary">{cardDetails.cardType}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wider">Family Members</h3>
                    <div className="space-y-3">
                      {cardDetails.familyMembers.map((member) => (
                        <div key={member.id} className="flex flex-row items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="grid gap-1.5 leading-none flex-1">
                            <div className="text-sm font-medium">
                              {member.name} <span className="text-muted-foreground font-normal ml-2">({member.relation})</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Aadhaar: ****{member.aadharCardNumber?.slice(-4)} | Age: {member.age}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : verifyRCMutation.isPending ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-3">
                  <Users className="h-12 w-12 opacity-20 animate-pulse" />
                  <p>Loading your family members...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-3">
                  <Users className="h-12 w-12 opacity-20" />
                  <p>Unable to load family members. Please try again later or contact support.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generate Tokens Button */}
          {cardDetails && (
            <div className="flex justify-center">
              <Button 
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => {
                  // Check if there's already an active token (pending, verified)
                  const activeToken = myTokens?.find(token => 
                    token.status === "pending" || 
                    token.status === "verified"
                  );
                  
                  if (activeToken) {
                    toast({
                      title: "Token Generation Failed",
                      description: "Token is already generated by family member check my tokens page",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  setSelectedMembers([]);
                  setIsDialogOpen(true);
                }}
              >
                <Zap className="mr-2 h-5 w-5" />
                Generate Tokens
              </Button>
            </div>
          )}

          <Alert className="bg-primary/5 text-primary border-primary/20">
            <Info className="h-4 w-4" />
            <AlertTitle>Important Notice</AlertTitle>
            <AlertDescription>
              You can only generate tokens for your own family members. Select only the members for whom you are currently collecting rations. Identity verification will be required.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Member Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Family Members for Token Generation</DialogTitle>
            <DialogDescription>
              Choose which family members to generate tokens for
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {cardDetails?.familyMembers.map((member) => (
              <div key={member.id} className="flex flex-row items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox 
                  id={`dialog-member-${member.id}`} 
                  checked={selectedMembers.includes(member.name)}
                  onCheckedChange={() => handleMemberToggle(member.name)}
                />
                <div className="grid gap-1.5 leading-none flex-1">
                  <label
                    htmlFor={`dialog-member-${member.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {member.name} <span className="text-muted-foreground font-normal ml-2">({member.relation})</span>
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Aadhaar: ****{member.aadharCardNumber?.slice(-4)} | Age: {member.age}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleContinue} 
              disabled={selectedMembers.length === 0}
            >
              Continue to Verification
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UserLayout>
  );
}

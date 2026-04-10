import { useState } from "react";
import { useLocation } from "wouter";
import { UserLayout } from "@/components/layout/user-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useVerifyRationCard } from "@workspace/api-client-react";
import { FileText, Users, ArrowRight, ShieldCheck, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [rcNumber, setRcNumber] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  const verifyRCMutation = useVerifyRationCard();

  const handleVerifyRC = () => {
    if (!rcNumber || rcNumber.length < 5) {
      toast({
        title: "Invalid Card Number",
        description: "Please enter a valid ration card number.",
        variant: "destructive"
      });
      return;
    }
    
    verifyRCMutation.mutate({
      data: { rationCardNumber: rcNumber }
    }, {
      onError: (err: any) => {
        toast({
          title: "Verification Failed",
          description: err.message || "Could not find details for this card.",
          variant: "destructive"
        });
      }
    });
  };

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
    sessionStorage.setItem("rationTokenFlow", JSON.stringify({
      rationCardNumber: rcNumber,
      selectedMembers
    }));
    
    setLocation("/verify");
  };

  const cardDetails = verifyRCMutation.data;

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome to E-Ration Services</h1>
          <p className="text-muted-foreground">Generate tokens to collect your ration supplies seamlessly.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-12">
          {/* Step 1: Card Entry */}
          <Card className={`md:col-span-5 ${cardDetails ? "opacity-75 grayscale-[0.5] pointer-events-none" : ""}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Step 1: Ration Card Details
              </CardTitle>
              <CardDescription>Enter your card number to fetch family details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rcNumber">Ration Card Number</Label>
                <Input 
                  id="rcNumber" 
                  placeholder="Ex: KA-123456789" 
                  value={rcNumber}
                  onChange={(e) => setRcNumber(e.target.value)}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleVerifyRC}
                disabled={verifyRCMutation.isPending || !!cardDetails}
              >
                {verifyRCMutation.isPending ? "Verifying..." : "Fetch Details"}
              </Button>
            </CardContent>
          </Card>

          {/* Step 2: Member Selection */}
          <Card className={`md:col-span-7 ${!cardDetails ? "opacity-50 pointer-events-none" : "border-primary"}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Step 2: Select Family Members
              </CardTitle>
              <CardDescription>Select the members for whom you are collecting the ration.</CardDescription>
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
                        <div key={member.id} className="flex flex-row items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <Checkbox 
                            id={`member-${member.id}`} 
                            checked={selectedMembers.includes(member.name)}
                            onCheckedChange={() => handleMemberToggle(member.name)}
                          />
                          <div className="grid gap-1.5 leading-none flex-1">
                            <label
                              htmlFor={`member-${member.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {member.name} <span className="text-muted-foreground font-normal ml-2">({member.relation})</span>
                            </label>
                            <p className="text-xs text-muted-foreground">
                              Aadhaar ending in: •••• {member.aadhaarLast4} | Age: {member.age}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-3">
                  <ShieldCheck className="h-12 w-12 opacity-20" />
                  <p>Complete Step 1 to view family members.</p>
                </div>
              )}
            </CardContent>
            {cardDetails && (
              <CardFooter className="border-t pt-6 bg-muted/20">
                <div className="w-full flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Selected: <span className="text-primary font-bold">{selectedMembers.length}</span> members
                  </span>
                  <Button onClick={handleContinue} disabled={selectedMembers.length === 0}>
                    Proceed to Verification
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>

        <Alert className="bg-primary/5 text-primary border-primary/20">
          <Info className="h-4 w-4" />
          <AlertTitle>Important Notice</AlertTitle>
          <AlertDescription>
            You must select only the family members for whom you are currently collecting rations. Identity verification will be required in the next step.
          </AlertDescription>
        </Alert>
      </div>
    </UserLayout>
  );
}

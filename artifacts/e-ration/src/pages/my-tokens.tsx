import { useState } from "react";
import { UserLayout } from "@/components/layout/user-layout";
import { useGetMyTokens } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import { format } from "date-fns";
import { QrCode, Calendar, Users, Hash, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
    case "verified":
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Verified</Badge>;
    case "approved":
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Approved</Badge>;
    case "distributed":
      return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">Distributed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function MyTokens() {
  const { data: tokens, isLoading } = useGetMyTokens();

  return (
    <UserLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Ration Tokens</h1>
          <p className="text-muted-foreground">View and present your generated tokens at the ration shop.</p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map(i => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="bg-muted/50 pb-4">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="pt-6">
                  <Skeleton className="h-24 w-full mb-4" />
                  <Skeleton className="h-4 w-48" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !tokens || tokens.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16">
              <Empty
                icon={<QrCode className="h-12 w-12 text-muted-foreground/50" />}
                title="No tokens found"
                description="You haven't generated any ration tokens yet."
                action={<Button onClick={() => window.location.href = "/dashboard"}>Generate Token</Button>}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {tokens.map((token) => (
              <Card key={token.id} className="overflow-hidden relative shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-primary">
                {/* Decorative background element mimicking a ticket/receipt */}
                <div className="absolute -left-3 top-1/2 w-6 h-6 bg-background rounded-full border-r border-border transform -translate-y-1/2 z-10" />
                <div className="absolute -right-3 top-1/2 w-6 h-6 bg-background rounded-full border-l border-border transform -translate-y-1/2 z-10" />
                
                <CardHeader className="bg-muted/30 border-b border-dashed relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Karnataka E-Ration</span>
                      </div>
                      <CardTitle className="text-xl flex items-center gap-2 mt-1">
                        <Hash className="h-5 w-5 text-muted-foreground" />
                        {token.tokenNumber}
                      </CardTitle>
                    </div>
                    <StatusBadge status={token.status} />
                  </div>
                </CardHeader>
                <CardContent className="pt-6 pb-2">
                  <div className="flex gap-6">
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase mb-1">Card Holder</p>
                        <p className="font-semibold">{token.holderName}</p>
                        <p className="text-sm text-muted-foreground">{token.rationCardNumber}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase mb-1 flex items-center gap-1">
                          <Users className="h-3 w-3" /> Members ({token.selectedMembers.length})
                        </p>
                        <p className="text-sm font-medium">{token.selectedMembers.join(", ")}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase mb-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Issued On
                        </p>
                        <p className="text-sm">{format(new Date(token.createdAt), "PPP 'at' p")}</p>
                      </div>
                    </div>
                    
                    {/* QR Code Placeholder */}
                    <div className="w-32 flex flex-col items-center justify-center shrink-0 border-l border-dashed pl-6">
                      <div className="w-24 h-24 bg-white border-2 border-primary/20 rounded-lg p-2 flex items-center justify-center shadow-inner">
                        <QrCode className="w-full h-full text-primary/80" />
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-2 font-mono uppercase tracking-widest text-center">Scan at shop</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/10 border-t justify-between py-3">
                  <span className="text-xs text-muted-foreground">
                    Method: <span className="font-medium capitalize">{token.verificationType}</span>
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    ID: {token.id.toString().padStart(6, '0')}
                  </span>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}

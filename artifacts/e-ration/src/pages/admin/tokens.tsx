import { useState } from "react";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/layout/admin-layout";
import { 
  useGetAllTokens, 
  useVerifyToken, 
  useDistributeToken,
  getGetAllTokensQueryKey,
  getGetAdminDashboardStatsQueryKey,
  getGetRecentActivityQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, MoreVertical, CheckCircle2, Package, Shield, ExternalLink, Loader2 } from "lucide-react";
import { 
  Empty, 
  EmptyHeader, 
  EmptyMedia, 
  EmptyTitle, 
  EmptyDescription, 
  EmptyContent 
} from "@/components/ui/empty";

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>;
    case "verified":
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400">Verified</Badge>;
    case "distributed":
      return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400">Distributed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function AdminTokens() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [last4Digits, setLast4Digits] = useState("");
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Params matching the OpenAPI spec enum
  const queryParams = {
    ...(statusFilter !== "all" && { status: statusFilter as any }),
    ...(search && { search })
  };

  const { data: tokens, isLoading } = useGetAllTokens(queryParams);
  
  const verifyMutation = useVerifyToken();
  const distributeMutation = useDistributeToken();

  const handleAction = (action: 'verify' | 'distribute', id: number) => {
    if (action === 'verify') {
      // Find the token to get its number for validation
      const token = tokens?.find(t => t.id === id);
      if (token) {
        setSelectedTokenId(id.toString());
        setVerificationDialogOpen(true);
        setLast4Digits("");
      }
      return;
    }
    
    // Only distribute action remains
    const mutation = distributeMutation;
    
    mutation.mutate(
      { tokenId: id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAllTokensQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminDashboardStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
          toast({ title: `Token marked as ${action}d successfully` });
        },
        onError: (err: any) => {
          toast({ 
            title: `Token ${action} Failed`, 
            description: "Unable to update token status. Please try again.", 
            variant: "destructive" 
          });
        }
      }
    );
  };

  const handleVerifyToken = () => {
    if (!selectedTokenId || last4Digits.length !== 4) {
      toast({
        title: "Invalid Input",
        description: "Please enter exactly 4 digits of the token number.",
        variant: "destructive"
      });
      return;
    }

    // Find the token and check if last 4 digits match
    const token = tokens?.find(t => t.id.toString() === selectedTokenId);
    if (!token) {
      toast({
        title: "Error",
        description: "Token not found.",
        variant: "destructive"
      });
      return;
    }

    // Check if last 4 digits match
    const tokenLast4 = token.tokenNumber.slice(-4);
    if (tokenLast4 !== last4Digits) {
      toast({
        title: "Verification Failed",
        description: "Token number does not match. Please check the last 4 digits.",
        variant: "destructive"
      });
      return;
    }

    // If digits match, then call the backend API to verify the token
    verifyMutation.mutate(
      { tokenId: selectedTokenId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAllTokensQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminDashboardStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
          toast({ title: "Token verified successfully" });
          setVerificationDialogOpen(false);
          setSelectedTokenId(null);
          setLast4Digits("");
        },
        onError: (err: any) => {
          toast({ 
            title: "Token Verification Failed", 
            description: "Unable to verify token. Please try again.", 
            variant: "destructive" 
          });
        }
      }
    );
  };

  const handleBulkDistribute = async () => {
    if (selectedTokens.length === 0) {
      toast({
        title: "No Tokens Selected",
        description: "Please select at least one token to distribute.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/tokens/bulk-distribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenIds: selectedTokens }),
      });

      if (!response.ok) {
        throw new Error('Failed to distribute tokens');
      }

      const result = await response.json();
      
      toast({
        title: "Bulk Distribution Successful",
        description: result.message || `Successfully distributed ${selectedTokens.length} tokens`,
      });

      // Show email notification toast
      if (result.emailsSent > 0) {
        setTimeout(() => {
          toast({
            title: "Distribution Emails Sent",
            description: `Successfully sent ${result.emailsSent} distribution email${result.emailsSent > 1 ? 's' : ''} to users`,
          });
        }, 1500);
      }

      setSelectedTokens([]);
      queryClient.invalidateQueries({ queryKey: getGetAllTokensQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetAdminDashboardStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
    } catch (error) {
      toast({
        title: "Bulk Distribution Failed",
        description: "Unable to distribute selected tokens. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleTokenSelection = (tokenId: string, checked: boolean) => {
    if (checked) {
      setSelectedTokens(prev => [...prev, tokenId]);
    } else {
      setSelectedTokens(prev => prev.filter(id => id !== tokenId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const verifiedTokenIds = tokens
        ?.filter(token => token.status === "verified")
        .map(token => token.id.toString()) || [];
      setSelectedTokens(verifiedTokenIds);
    } else {
      setSelectedTokens([]);
    }
  };

  const filteredTokens = tokens || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Token Management</h1>
            <p className="text-muted-foreground">View, Verify and distribute rations to citizens.</p>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search tokens or cards..."
                className="pl-8 bg-card"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Card>
          <div className="border-b px-4 py-2 bg-muted/20">
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
              <TabsList className="bg-transparent h-auto p-0 flex space-x-2">
                <TabsTrigger value="all" className="data-[state=active]:bg-background border px-4 py-2">All Tokens</TabsTrigger>
                <TabsTrigger value="pending" className="data-[state=active]:bg-background border px-4 py-2">Pending</TabsTrigger>
                <TabsTrigger value="verified" className="data-[state=active]:bg-background border px-4 py-2">Verified</TabsTrigger>
                <TabsTrigger value="distributed" className="data-[state=active]:bg-background border px-4 py-2">Distributed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !filteredTokens || filteredTokens.length === 0 ? (
              <div className="py-12">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Shield className="h-12 w-12 text-muted-foreground/50" />
                    </EmptyMedia>
                    <EmptyTitle>
                      {
                        statusFilter === "pending" ? "No pending tokens today" :
                        statusFilter === "verified" ? "No verified tokens today" :
                        "No tokens found"
                      }
                    </EmptyTitle>
                  </EmptyHeader>
                  <EmptyContent>
                    <EmptyDescription>
                      {
                        search ? "Try adjusting your search criteria" :
                        statusFilter === "pending" ? "All tokens have been verified" :
                        statusFilter === "verified" ? "No tokens are ready for distribution" :
                        "There are no tokens matching this status"
                      }
                    </EmptyDescription>
                  </EmptyContent>
                </Empty>
              </div>
            ) : (
              <>
                {statusFilter === "verified" && selectedTokens.length > 0 && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg border flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedTokens.length} token{selectedTokens.length > 1 ? 's' : ''} selected
                    </span>
                    <Button
                      onClick={handleBulkDistribute}
                      className="gap-2"
                      size="sm"
                    >
                      <Package className="h-4 w-4" />
                      Distribute Selected
                    </Button>
                  </div>
                )}
                <div className="relative overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      {statusFilter === "verified" && (
                        <TableHead className="font-semibold text-foreground w-12">
                          <input
                            type="checkbox"
                            checked={selectedTokens.length === tokens?.filter(t => t.status === "verified").length}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="rounded border-gray-300"
                          />
                        </TableHead>
                      )}
                      <TableHead className="font-semibold text-foreground">Token Number</TableHead>
                      <TableHead className="font-semibold text-foreground">Ration Card</TableHead>
                      <TableHead className="font-semibold text-foreground">Holder</TableHead>
                      <TableHead className="font-semibold text-foreground">Members</TableHead>
                      <TableHead className="font-semibold text-foreground">Date</TableHead>
                      <TableHead className="font-semibold text-foreground">Status</TableHead>
                      <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTokens.map((token) => (
                      <TableRow key={token.id}>
                        {statusFilter === "verified" && (
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedTokens.includes(token.id.toString())}
                              onChange={(e) => handleTokenSelection(token.id.toString(), e.target.checked)}
                              className="rounded border-gray-300"
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-mono text-xs font-semibold">
                          {token.tokenNumber}
                        </TableCell>
                        <TableCell>{token.rationCardNumber}</TableCell>
                        <TableCell>
                          <div className="font-medium">{token.holderName}</div>
                          <div className="text-xs text-muted-foreground">{token.userEmail}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {token.selectedMembers.length} selected
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(token.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={token.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              
                              {token.status === "pending" && (
                                <DropdownMenuItem onClick={() => handleAction('verify', token.id)}>
                                  <Shield className="mr-2 h-4 w-4" /> Verify Token
                                </DropdownMenuItem>
                              )}
                              
                              {token.status === "verified" && (
                                <DropdownMenuItem onClick={() => handleAction('distribute', token.id)}>
                                  <Package className="mr-2 h-4 w-4 text-purple-600" /> Mark Distributed
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <ExternalLink className="mr-2 h-4 w-4" /> View Full Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              </>
            )}
          </CardContent>
        </Card>
        <>
          {/* Verification Dialog */}
          <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Verify Token</h3>
                  <p className="text-sm text-muted-foreground">
                    Please enter the last 4 digits of the token number to verify
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Input
                    placeholder="Enter last 4 digits"
                    value={last4Digits}
                    onChange={(e) => {
                      // Only allow numbers and limit to 4 digits
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setLast4Digits(value);
                    }}
                    maxLength={4}
                    className="text-center text-lg"
                    autoFocus
                  />
                </div>
                
                <DialogFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setVerificationDialogOpen(false);
                      setSelectedTokenId(null);
                      setLast4Digits("");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleVerifyToken}
                    disabled={last4Digits.length !== 4 || verifyMutation.isPending}
                    className="flex-1"
                  >
                    {verifyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Token"
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </>
      </div>
    </AdminLayout>
  );
}

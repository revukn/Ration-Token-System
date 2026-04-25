import { AdminLayout } from "@/components/layout/admin-layout";
import { useGetAdminDashboardStats, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CheckCircle, Clock, FileText, Package, Users } from "lucide-react";
import { format } from "date-fns";

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  trend,
  colorClass 
}: { 
  title: string, 
  value?: number, 
  icon: any, 
  description?: string,
  trend?: string,
  colorClass: string 
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-md ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        {value === undefined ? (
          <Skeleton className="h-8 w-20 mb-1" />
        ) : (
          <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        )}
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          {trend && <span className="text-emerald-500 font-medium mr-1">{trend}</span>}
          {description}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">System Overview</h1>
          <p className="text-muted-foreground">Monitor rationing operations across the state network.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard 
            title="Total Tokens Issued" 
            value={stats?.totalTokens} 
            icon={FileText} 
            trend="+12%"
            description="from last month"
            colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
          />
          <StatCard 
            title="Tokens Today" 
            value={stats?.todayTokens} 
            icon={Clock} 
            description="generated today"
            colorClass="bg-primary/10 text-primary"
          />
          <StatCard 
            title="Pending Verification" 
            value={stats?.pendingTokens} 
            icon={Activity} 
            description="requires attention"
            colorClass="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400"
          />
          <StatCard 
            title="Verified Automatically" 
            value={stats?.verifiedTokens} 
            icon={CheckCircle} 
            description="waiting for manual approval"
            colorClass="bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400"
          />
          <StatCard 
            title="Distributed Successfully" 
            value={stats?.distributedTokens} 
            icon={Package} 
            description="rations handed over"
            colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-7">
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Recent Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity?.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No recent activity found.
                </div>
              ) : (
                <div className="space-y-6">
                  {activity?.map((item) => (
                    <div key={item.id} className="flex items-start">
                      <div className="mr-4 mt-0.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                          <Activity className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          <span className="font-semibold text-foreground">{item.userName}</span>
                          <span className="text-muted-foreground mx-1">performed</span>
                          <span className="bg-muted px-1.5 py-0.5 rounded text-xs uppercase tracking-wider">{item.action}</span>
                          <span className="text-muted-foreground mx-1">on token</span>
                          <span className="font-mono text-xs font-semibold">{item.tokenNumber}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.timestamp), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="md:col-span-3 bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-primary-foreground flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-primary-foreground/80 text-sm">
                Fast access to common administrative tasks.
              </p>
              <div className="space-y-2">
                <button 
                  onClick={() => window.location.href = "/admin/tokens?status=pending"}
                  className="w-full text-left bg-white/10 hover:bg-white/20 transition-colors rounded-lg p-3 text-sm font-medium flex justify-between items-center"
                >
                  Review Pending Tokens
                  <span className="bg-white text-primary rounded-full px-2 py-0.5 text-xs font-bold">
                    {stats?.pendingTokens || 0}
                  </span>
                </button>
                <button 
                  onClick={() => window.location.href = "/admin/tokens?status=verified"}
                  className="w-full text-left bg-white/10 hover:bg-white/20 transition-colors rounded-lg p-3 text-sm font-medium flex justify-between items-center"
                >
                  Distribute Verified Tokens
                  <span className="bg-white text-primary rounded-full px-2 py-0.5 text-xs font-bold">
                    {stats?.verifiedTokens || 0}
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

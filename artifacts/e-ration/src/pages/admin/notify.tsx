import React, { useState } from 'react';
import { Calendar, Send, Mail, Users, CheckCircle, AlertCircle, Loader2, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NotifyPage() {
  const [selectedDate, setSelectedDate] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const handleSendNotification = async () => {
    if (!selectedDate) {
      toast({
        title: "Date Required",
        description: "Please select a collection date before sending notifications.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    setResults(null);

    try {
      const response = await fetch('/notify/send-bulk-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionDate: selectedDate,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
        toast({
          title: "Notifications Sent Successfully!",
          description: `Sent to ${data.totalSent} users out of ${data.totalUsers} registered users.`,
        });
      } else {
        toast({
          title: "Failed to Send Notifications",
          description: data.message || "An error occurred while sending notifications.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Failed to connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Notify Users</h1>
            <p className="text-muted-foreground">Send reminder emails to all registered users to generate tokens and collect ration.</p>
          </div>
          <div className="p-2.5 rounded-md bg-primary/10 text-primary">
            <Bell className="h-5 w-5" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-7">
          {/* Send Notification Form */}
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Send Ration Collection Reminder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Collection Date
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="bg-card"
                />
              </div>

              {selectedDate && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                  <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Preview
                  </h3>
                  <div className="text-sm space-y-2 text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Subject:</span> Remember to Generate token and collect Ration for this month {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Body:</span> Dear Beneficiaries, please generate token if not done already. If you already have generated token, come to your nearby ration center and collect ration on this date ({formatDate(selectedDate)}).
                    </p>
                    <p className="text-xs italic border-t border-primary/10 pt-2 mt-2">
                      ಪ್ರಿಯ ಫಲಾನುಭವಿಗಳೇ, ದಯವಿಟ್ಟು ಟೋಕನ್ ಅನ್ನು ಜನರೇಟ್ ಮಾಡಿ ಇಲ್ಲದಿದ್ದರೆ, ನೀವು ಈಗಾಗಲೇ ಟೋಕನ್ ಅನ್ನು ಜನರೇಟ್ ಮಾಡಿದ್ದರೆ, ಈ ದಿನಾಂಕದಂದು ({formatDate(selectedDate)}) ನಿಮ್ಮ ಹತ್ತಿರದ ಪಡಿತರ ಕೇಂದ್ರಕ್ಕೆ ಬಂದು ಪಡಿತರವನ್ನು ಸಂಗ್ರಹಿಸಿ.
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSendNotification}
                disabled={!selectedDate || isSending}
                className="w-full gap-2"
                size="lg"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending Notifications...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send to All Registered Users
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info Panel */}
          <Card className="md:col-span-3 bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-primary-foreground flex items-center gap-2">
                <Mail className="h-5 w-5" />
                About Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-primary-foreground/80 text-sm">
                Send bulk email reminders to all registered beneficiaries.
              </p>
              <div className="space-y-2">
                <div className="bg-white/10 rounded-lg p-3 text-sm">
                  <p className="font-medium mb-1">What gets sent?</p>
                  <p className="text-primary-foreground/70 text-xs">A bilingual reminder (English + Kannada) asking users to generate tokens and collect ration on the selected date.</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-sm">
                  <p className="font-medium mb-1">Who receives it?</p>
                  <p className="text-primary-foreground/70 text-xs">All registered users with a valid email address in the system.</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-sm">
                  <p className="font-medium mb-1">When to use?</p>
                  <p className="text-primary-foreground/70 text-xs">Before each month's ration distribution day to maximize token generation and collection.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                Notification Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Users</p>
                        <p className="text-2xl font-bold">{results.totalUsers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Successfully Sent</p>
                        <p className="text-2xl font-bold text-emerald-600">{results.totalSent}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Failed</p>
                        <p className="text-2xl font-bold text-red-600">{results.totalFailed}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {results.totalFailed > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    Some notifications failed to send. Please check the server logs for more details.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

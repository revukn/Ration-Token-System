import React, { useState } from 'react';
import { Calendar, Send, Mail, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function NotifyPage() {
  const [selectedDate, setSelectedDate] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState(null);

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
      const response = await fetch('/api/notify/send-bulk-email', {
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Mail className="w-8 h-8 text-blue-600" />
          Send Ration Collection Notification
        </h1>
        <p className="text-gray-600">
          Send reminder emails to all registered users to generate tokens and collect ration on the selected date.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Collection Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {selectedDate && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-semibold text-blue-900 mb-2">Message Preview:</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>Subject:</strong> Remember to Generate token and collect Ration for this month {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              <p><strong>Body:</strong> Dear BENEFICIARIES, please generate token if not, if you already have generated token come to your nearby ration center and collect ration on this date ({formatDate(selectedDate)})</p>
              <p className="text-xs text-blue-600 italic">ಪ್ರಿಯ ಫಲಾನುಭವಿಗಳೇ, ದಯವಿಟ್ಟು ಟೋಕನ್ ಅನ್ನು ಜನರೇಟ್ ಮಾಡಿ ಇಲ್ಲದಿದ್ದರೆ, ನೀವು ಈಗಾಗಲೇ ಟೋಕನ್ ಅನ್ನು ಜನರೇಟ್ ಮಾಡಿದ್ದರೆ, ಈ ದಿನಾಂಕದಂದು ({formatDate(selectedDate)}) ನಿಮ್ಮ ಹತ್ತಿರದ ಪಡಿತರ ಕೇಂದ್ರಕ್ಕೆ ಬಂದು ಪಡಿತರವನ್ನು ಸಂಗ್ರಹಿಸಿ.</p>
            </div>
          </div>
        )}

        <button
          onClick={handleSendNotification}
          disabled={!selectedDate || isSending}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isSending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Sending Notifications...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Message to All Registered Users
            </>
          )}
        </button>
      </div>

      {results && (
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Notification Results
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Total Users</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{results.totalUsers}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Successfully Sent</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{results.totalSent}</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">Failed</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{results.totalFailed}</p>
            </div>
          </div>

          {results.totalFailed > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                Some notifications failed to send. Please check the server logs for more details.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

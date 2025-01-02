import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Check, X, MessageSquare } from 'lucide-react';

const ModificationRequestsDialog = ({ isOpen, onClose, storyId, user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5522/stories/modifications?userId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setError('Failed to load modification requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (requestId, approve) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5522/stories/modifications/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approve })
      });
      fetchRequests(); // Refresh the list
    } catch (err) {
      setError('Failed to process request');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modification Requests</DialogTitle>
          <DialogDescription>
            Review and manage story modification requests
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : error ? (
            <div className="text-red-500 text-center p-4">{error}</div>
          ) : requests.length === 0 ? (
            <div className="text-center text-gray-500 p-4">No pending modification requests</div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{request.requester.username}</span>
                      <span className="text-sm text-gray-500">
                        requested changes
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{request.newContent}</p>
                    {request.newMediaUrls && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {JSON.parse(request.newMediaUrls).map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt="New media"
                            className="rounded-md w-full h-24 object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRequest(request.id, false)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleRequest(request.id, true)}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModificationRequestsDialog;
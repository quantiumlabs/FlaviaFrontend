import React, { useState, useEffect } from 'react';
import { LogOut, Settings, MessageSquare, Check, X, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from 'next/image';

const MapProfileSection = ({ user, onLogout, isOpen }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const isAdmin = user?.username?.toLowerCase() === 'admin';

  useEffect(() => {
    if (isOpen && user) {
      fetchRequests();
    }
  }, [isOpen, user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      if (!user?.id) {
        throw new Error('User ID is missing');
      }

      const response = await fetch(`https://ceusgame.com:5522/stories/modifications/pending`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRequests(data);
    } catch (err) {
      console.error('Error fetching modification requests:', err);
      setError(err.message || 'Failed to load modification requests');
      
      if (err.message.includes('authentication')) {
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (requestId, approve) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`https://ceusgame.com:5522/stories/modifications/${requestId}/handle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approve })
      });
      fetchRequests();
    } catch (err) {
      console.error('Failed to process request:', err);
    }
  };

  const parseMediaUrls = (mediaUrls) => {
    if (!mediaUrls) return [];
    
    if (Array.isArray(mediaUrls)) return mediaUrls;
    
    try {
      const parsed = JSON.parse(mediaUrls);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Error parsing mediaUrls:', err);
      return [];
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="absolute top-20 left-4 z-30 w-80 rounded-lg bg-white/80 backdrop-blur-lg shadow-lg p-4 transition-all duration-300 ease-in-out">
        <div className="space-y-4">
          {/* User Profile Section */}
          <div className="flex items-center space-x-3 pb-4 border-b border-gray-200/50">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-xl font-semibold text-white">
                {user?.username?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">
                {user?.username || 'Usuário'}
              </h3>
              <p className="text-sm text-gray-500">
                Online
              </p>
            </div>
          </div>

          {/* Modification Requests Section */}
          <Collapsible open={isRequestsOpen} onOpenChange={setIsRequestsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-100/50 rounded-lg">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Tecer núvens</span>
                {requests.length > 0 && (
                  <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                    {requests.length}
                  </span>
                )}
              </div>
              {isRequestsOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-2 space-y-2">
              {loading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                </div>
              ) : error ? (
                <div className="text-red-500 text-sm text-center p-2">{error}</div>
              ) : requests.length === 0 ? (
                <div className="text-gray-500 text-sm text-center p-2">
                  Sempre que houver pedidos de alteração das suas histórias, eles aparecerão aqui.
                </div>
              ) : (
                requests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {request.requester.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{request.requester.username}</span>
                    </div>
                    
                    <div className="text-sm text-gray-600 bg-gray-50 rounded-md p-2">
                      {request.newContent}
                    </div>
                    
                    {request.newMediaUrls && (
                      <div className="grid grid-cols-2 gap-1">
                        {parseMediaUrls(request.newMediaUrls).map((url, index) => (
                          <div 
                            key={index}
                            className="relative cursor-pointer group"
                            onClick={() => setSelectedImage(url)}
                          >
                            <Image
                              src={url}
                              alt={`New media ${index + 1}`}
                              className="rounded-md w-full h-16 object-cover transition-opacity group-hover:opacity-90"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-md" />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRequest(request.id, false)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Rejeitar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRequest(request.id, true)}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Aprovar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Navigation Items */}
          <div className="space-y-2 pt-2 border-t border-gray-200/50">
            {isAdmin && (
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-600 hover:text-gray-900"
                onClick={() => window.location.href = '/admin'}
              >
                <Settings className="mr-2 h-4 w-4" />
                Painel do Administrador
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:text-gray-900"
              onClick={onLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-full sm:max-w-[90vw] h-[90vh] p-0 bg-black/90">
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white hover:bg-white/20"
              onClick={() => setSelectedImage(null)}
            >
              <XCircle className="h-6 w-6" />
            </Button>
            <Image
              src={selectedImage}
              alt="Fullscreen view"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MapProfileSection;
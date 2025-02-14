import React, { useState, useEffect } from 'react';
import { LogOut, Settings, MessageSquare, Check, X, ChevronDown, ChevronUp, XCircle, AudioWaveform } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from 'next/image';
import { Separator } from 'radix-ui';

const MapProfileSection = ({ user, onLogout, isOpen }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const isAdmin = user?.username?.toLowerCase() === 'flavia';

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
      <div className="absolute left-4 top-20 z-30 p-4 w-80 rounded-lg shadow-lg backdrop-blur-lg transition-all duration-300 ease-in-out bg-white/80">
        <div className="space-y-4">
          {/* User Profile Section */}
          <div className="flex items-center pb-4 space-x-3 border-b border-gray-200/50">
            <div className="flex justify-center items-center w-12 h-12 bg-blue-500 rounded-full">
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
            <CollapsibleTrigger className="flex justify-between items-center p-2 w-full rounded-lg hover:bg-gray-100/50">
              <div className="flex gap-2 items-center">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Tecer núvens</span>
                {requests.length > 0 && (
                  <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                    {requests.length}
                  </span>
                )}
              </div>
              {isRequestsOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-2 space-y-2">
              {loading ? (
                <div className="flex justify-center p-4">
                  <div className="w-6 h-6 rounded-full border-b-2 border-blue-500 animate-spin" />
                </div>
              ) : error ? (
                <div className="p-2 text-sm text-center text-red-500">{error}</div>
              ) : requests.length === 0 ? (
                <div className="p-2 text-sm text-center text-gray-500">
                  Sempre que houver pedidos de alteração das suas histórias, eles aparecerão aqui.
                </div>
              ) : (
                requests.map((request) => (
                  <div
                    key={request.id}
                    className="p-3 space-y-2 bg-white rounded-lg border border-gray-100 shadow-sm"
                  >
                    <div className="flex gap-2 items-center">
                      <div className="flex justify-center items-center w-6 h-6 bg-gray-100 rounded-full">
                        <span className="text-xs font-medium">
                          {request.requester.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{request.requester.username}</span>
                    </div>
                    
                    <div className="p-2 text-sm text-gray-600 bg-gray-50 rounded-md">
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
                              className="object-cover w-full h-16 rounded-md transition-opacity group-hover:opacity-90"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 rounded-md transition-all duration-200 group-hover:bg-opacity-10" />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRequest(request.id, false)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="mr-1 w-3 h-3" />
                        Rejeitar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRequest(request.id, true)}
                        className="text-white bg-green-500 hover:bg-green-600"
                      >
                        <Check className="mr-1 w-3 h-3" />
                        Aprovar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Navigation Items */}
          <div className="pt-2 space-y-2 border-t border-gray-200/50">
          <Button
              variant="ghost"
              className="justify-start w-full text-gray-600 hover:text-gray-900"
              onClick={() => window.location.href = '/audio'}
            >
              <AudioWaveform className="mr-2 w-4 h-4" />
              Gravar mais um áudio
            </Button>

            <Separator className="border-gray-200/50" />
            {isAdmin && (
              <Button
                variant="ghost"
                className="justify-start w-full text-gray-600 hover:text-gray-900"
                onClick={() => window.location.href = '/admin'}
              >
                <Settings className="mr-2 w-4 h-4" />
                Painel do Administrador
              </Button>
            )}
            <Button
              variant="ghost"
              className="justify-start w-full text-gray-600 hover:text-gray-900"
              onClick={onLogout}
            >
              <LogOut className="mr-2 w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-full sm:max-w-[90vw] h-[90vh] p-0 bg-black/90">
          <div className="flex relative justify-center items-center w-full h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white hover:bg-white/20"
              onClick={() => setSelectedImage(null)}
            >
              <XCircle className="w-6 h-6" />
            </Button>
            <Image
              src={selectedImage}
              alt="Fullscreen view"
              className="object-contain max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MapProfileSection;
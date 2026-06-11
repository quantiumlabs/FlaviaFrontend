'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit2, AlertTriangle } from 'lucide-react';
import StoryModificationDialog from '@/components/ui/StoryModificationDialog';
import { getMediaUrl } from '@/lib/media';
import PixelArtGameAudioPlayer from '@/components/ui/SafariAudioPlayer';

const containsSuspiciousContent = (content) => {
  const htmlRegex = /<[^>]*>/;
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/;
  return htmlRegex.test(content) || urlRegex.test(content);
};

const PixelButton = ({ children, onClick, className = "" }) => (
  <button
    onClick={onClick}
    className={`relative px-4 py-3 font-['Press_Start_2P'] text-[10px] transition-all duration-100 active:translate-y-1 bg-orange-500 text-white border-b-4 border-r-4 border-orange-700 hover:border-b-2 hover:border-r-2 hover:translate-y-1 hover:shadow-[4px_4px_0_0_rgba(249,115,22,0.3)] ${className}`}
  >
    {children}
  </button>
);

const StoryDialog = ({ story, isOpen, onClose }) => {
  const [showModificationDialog, setShowModificationDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Error parsing user from localStorage', e);
        }
      }
    }
  }, []);

  if (!story) return null;

  const isOwnStory = currentUser?.username === story.user.username;

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return interval + ' ANOS ATRAS';
    if (interval === 1) return 'HA 1 ANO';
    
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return interval + ' MESES ATRAS';
    if (interval === 1) return 'HA 1 MES';
    
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return interval + ' DIAS ATRAS';
    if (interval === 1) return 'ONTEM';
    
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return interval + ' HORAS ATRAS';
    if (interval === 1) return 'HA 1 HORA';
    
    interval = Math.floor(seconds / 60);
    if (interval > 1) return interval + ' MINUTOS ATRAS';
    if (interval === 1) return 'HA 1 MINUTO';
    
    return 'AGORA';
  };

  const getStoryTypeBadge = (type) => {
    const types = {
      OBJECT: { text: 'CEUS NAS MAOS', icon: '🎯', class: 'bg-purple-100 text-purple-800 border-purple-300' },
      COLLABORATIVE: { text: 'CEUS CRUZADOS', icon: '👥', class: 'bg-blue-100 text-blue-800 border-blue-300' },
      PERSONAL: { text: 'COLECIONAR NEVOAS', icon: '📝', class: 'bg-orange-100 text-orange-800 border-orange-300' }
    };
    const defaultType = { text: 'COLECIONAR NEVOAS', icon: '📝', class: 'bg-orange-100 text-orange-800 border-orange-300' };
    return types[type] || defaultType;
  };

  const badge = getStoryTypeBadge(story.type);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-amber-50 border-4 border-orange-500 sm:rounded-none rounded-none shadow-[8px_8px_0_0_rgba(249,115,22,0.5)] p-8">
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <span className={`inline-flex items-center gap-2 px-3 py-2 text-[8px] font-['Press_Start_2P'] border-2 ${badge.class}`}>
                <span className="text-sm">{badge.icon}</span>
                {badge.text}
              </span>
              <span className="text-[8px] font-['Press_Start_2P'] text-slate-500">{getTimeAgo(new Date(story.createdAt))}</span>
            </div>
            <DialogTitle>
              <div className="flex flex-wrap gap-3 mt-2">
                {story.type === 'COLLABORATIVE' ? (
                  [...new Set([story.user.username, ...(story.collaborators || [])])].map((username) => (
                    <div key={username} className="flex items-center gap-2 bg-white border-2 border-slate-300 px-3 py-2 shadow-sm">
                      <div className="w-6 h-6 bg-blue-500 flex items-center justify-center text-white text-[10px] font-['Press_Start_2P'] border-2 border-blue-600">
                        {username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-['Press_Start_2P'] text-slate-800 uppercase">{username}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 bg-white border-2 border-slate-300 px-3 py-2 shadow-sm">
                    <div className="w-6 h-6 bg-blue-500 flex items-center justify-center text-white text-[10px] font-['Press_Start_2P'] border-2 border-blue-600">
                      {story.user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-['Press_Start_2P'] text-slate-800 uppercase">{story.user.username}</span>
                  </div>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {containsSuspiciousContent(story.content) && (
            <div className="mt-4 bg-red-100 border-4 border-red-500 p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-4 shrink-0" />
                <p className="text-[8px] font-['Press_Start_2P'] text-red-800 leading-relaxed uppercase">
                  ATENCAO: Esta historia contem links ou codigos HTML suspeitos. Pode ser uma tentativa de phishing. Tenha cuidado.
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 bg-white border-4 border-slate-300 p-5 relative shadow-inner">
            {/* Small decorative corner pixels */}
            <div className="absolute top-0 left-0 w-2 h-2 bg-slate-300 -mt-2 -ml-2"></div>
            <div className="absolute top-0 right-0 w-2 h-2 bg-slate-300 -mt-2 -mr-2"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-slate-300 -mb-2 -ml-2"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-slate-300 -mb-2 -mr-2"></div>
            
            <p className="font-['Press_Start_2P'] text-[10px] text-slate-800 leading-[2] whitespace-pre-wrap uppercase">
              {story.content}
            </p>
          </div>

          {story.mediaUrls?.length > 0 && (
            <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2">
              {story.mediaUrls.map((url, index) => (
                <div key={index} className="relative border-4 border-slate-300 bg-white p-1">
                  {url.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(url) ? (
                    <img
                      src={getMediaUrl(url)}
                      alt={`Story media ${index + 1}`}
                      className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : url.startsWith('data:audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(url) ? (
                    <div className="bg-slate-100 p-3 border-2 border-slate-200">
                      <PixelArtGameAudioPlayer audioUrl={getMediaUrl(url)} />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {(!story.type || story.type === 'PERSONAL') && !isOwnStory && (
            <div className="mt-8 flex justify-end">
              <PixelButton
                onClick={() => setShowModificationDialog(true)}
                className="flex items-center gap-3"
              >
                <Edit2 className="h-4 w-4" />
                <span>TECER NOVA VERSAO</span>
              </PixelButton>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <StoryModificationDialog
        story={story}
        isOpen={showModificationDialog}
        onClose={() => {
          setShowModificationDialog(false);
          onClose();
        }}
      />
    </>
  );
};

export default StoryDialog;

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit2, AlertTriangle } from 'lucide-react';
import StoryModificationDialog from '@/components/ui/StoryModificationDialog';
import Cookies from "js-cookie";

const containsSuspiciousContent = (content) => {
  const htmlRegex = /<[^>]*>/;
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/;
  return htmlRegex.test(content) || urlRegex.test(content);
};

const StoryDialog = ({ story, isOpen, onClose }) => {
  const [showModificationDialog, setShowModificationDialog] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('user'));

  if (!story) return null;

  const isOwnStory = currentUser?.username === story.user.username;

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return interval + 'anos atrás';
    if (interval === 1) return 'a um ano';
    
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return interval + ' meses atrás';
    if (interval === 1) return 'a um mês';
    
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return interval + ' dias atrás';
    if (interval === 1) return 'Ontem';
    
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return interval + ' horas atrás';
    if (interval === 1) return 'a uma hora';
    
    interval = Math.floor(seconds / 60);
    if (interval > 1) return interval + ' minutos atrás';
    if (interval === 1) return 'a um minuto';
    
    return 'Agora';
  };

  const getStoryTypeBadge = (type) => {
    const types = {
      OBJECT: { text: '🎯 Céus nas mãos', class: 'bg-purple-100 text-purple-800' },
      COLLABORATIVE: { text: '👥 Céus cruzados', class: 'bg-blue-100 text-blue-800' },
      PERSONAL: { text: '📝 Colecionar névoas', class: 'bg-orange-100 text-orange-800' }
    };
    const defaultType = { text: '📝 Colecionar névoas', class: 'bg-orange-100 text-orange-800' };
    return types[type] || defaultType;
  };

  const badge = getStoryTypeBadge(story.type);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex gap-2 items-center mb-2">
              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${badge.class}`}>
                {badge.text}
              </span>
              <span className="text-sm text-gray-500">{getTimeAgo(new Date(story.createdAt))}</span>
            </div>
            <DialogTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {story.type === 'COLLABORATIVE' ? (
                  [...new Set([story.user.username, ...(story.collaborators || [])])].map((username) => (
                    <div key={username} className="flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1">
                      <div className="flex justify-center items-center w-5 h-5 text-xs font-semibold text-white bg-blue-500 rounded-full">
                        {username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-gray-700">{username}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1">
                    <div className="flex justify-center items-center w-5 h-5 text-xs font-semibold text-white bg-blue-500 rounded-full">
                      {story.user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-gray-700">{story.user.username}</span>
                  </div>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {containsSuspiciousContent(story.content) && (
            <div className="p-4 mt-4 bg-red-50 border-l-4 border-red-500">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    Atenção: Esta história contém links ou códigos HTML suspeitos. Isso pode ser uma tentativa de phishing ou golpe. Tenha cuidado.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">
            <p className="text-gray-700 whitespace-pre-wrap">{story.content}</p>
          </div>

          {story.mediaUrls?.length > 0 && (
            <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-2">
              {story.mediaUrls.map((url, index) => (
                <div key={index} className="relative">
                  {url.startsWith('data:image/') ? (
                    <img
                      src={url}
                      alt={`Story media ${index + 1}`}
                      className="object-cover w-full h-auto rounded-lg transition-opacity cursor-pointer hover:opacity-90"
                    />
                  ) : url.startsWith('data:audio/') ? (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <audio controls className="w-full">
                        <source src={url} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {(!story.type || story.type === 'PERSONAL') && !isOwnStory && (
            <button
              onClick={() => setShowModificationDialog(true)}
              className="inline-flex gap-2 items-center px-4 py-2 mt-4 text-sm font-medium text-blue-600 rounded-lg transition-colors duration-200 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit2 className="w-4 h-4" />
              Tecer uma nova versão
            </button>
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
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit2 } from 'lucide-react';
import StoryModificationDialog from '@/components/ui/StoryModificationDialog';

const StoryDialog = ({ story, isOpen, onClose }) => {
  const [showModificationDialog, setShowModificationDialog] = useState(false);

  if (!story) return null;

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

  const handleModifyClick = () => {
    setShowModificationDialog(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
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
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                        {username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-gray-700">{username}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                      {story.user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-gray-700">{story.user.username}</span>
                  </div>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <p className="text-gray-700 whitespace-pre-wrap">{story.content}</p>
          </div>

          {story.mediaUrls && story.mediaUrls.length > 0 && (
            <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
              {story.mediaUrls.map((url, index) => (
                <div key={index} className="relative">
                  {url.startsWith('data:image/') ? (
                    <img
                      src={url}
                      alt={`Story media ${index + 1}`}
                      className="w-full h-auto rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        // Image expansion handler would go here
                      }}
                    />
                  ) : url.startsWith('data:audio/') ? (
                    <div className="bg-gray-50 rounded-lg p-3">
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

          {(!story.type || story.type === 'PERSONAL') && (
            <button
              onClick={handleModifyClick}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            >
              <Edit2 className="h-4 w-4" />
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
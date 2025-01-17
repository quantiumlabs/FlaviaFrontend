'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import 'dotenv/config';
import MapProfileSection from '@/components/ui/MapProfileSection';
import StoryModificationDialog from '@/components/ui/StoryModificationDialog';
import TutorialDialog from '@/components/ui/TutorialDialog';
import WeaveCloudDialog from '@/components/ui/WeaveCloudDialog';
import FirstTimeTutorial from '@/components/ui/FirstTimeTutorial';
import StoryDialog from '@/components/ui/StoryDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  MoreVertical, LogOut, Trophy, Users, Cloud, 
  Target, Apple, Map as MapIcon, Menu, X, ChevronRight, Edit2, Leaf
} from 'lucide-react';


const MapPage = () => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [location, setLocation] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [stories, setStories] = useState([]);
  const [user, setUser] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showWeaveDialog, setShowWeaveDialog] = useState(false);
  const [isStoryDialogOpen, setIsStoryDialogOpen] = useState(false);
  const [selectedStoryForDialog, setSelectedStoryForDialog] = useState(null);
  const router = useRouter();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const geolocateControl = useRef(null);
  const storyMarkers = useRef({});
  const [showChallenges, setShowChallenges] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [showModificationDialog, setShowModificationDialog] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [challenges] = useState([
    {
      id: 'collect-mist',
      title: 'Colecionar Névoas',
      description: 'Compartilhe suas histórias pelo mundo',
      icon: Cloud,
      route: '/story/create',
      color: 'from-orange-500 to-red-400'
    
    },
    {
      id: 'crossed-skies',
      title: 'Céus Cruzados',
      description: 'Crie histórias colaborativas',
      icon: Users,
      route: '/story/create-collab',
      color: 'from-blue-500 to-cyan-400'
      
    },
    {
      id: 'Skies-In-Hands',
      title: 'Céus nas mãos',
      description: 'Mova um objeto e registre',
      icon: Leaf,
      route: '/story/move-object',
      color: 'from-purple-500 to-pink-400'
    },
    {
      id: 'Tecer-nuvens',
      title: 'Tecer nuvens',
      description: 'Complemente outras histórias',
      icon: Target,
      color: 'from-blue-500 to-purple-500',
      action: () => setShowWeaveDialog(true),
    }
  ]);

  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const verifyTokenAndUsername = async (token, username) => {
    const response = await fetch('https://ceusgame.com:5522/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        username,
      }),
    });
  
    if (!response.ok) {
      throw new Error('Verification failed');
    }
  
    const data = await response.json();
    return data.valid;
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
  
  
  const handleChallengeSelect = (challenge) => {
    setSelectedChallenge(challenge);
    setShowChallenges(false);
  
    // Lógica para abrir diretamente o diálogo ao clicar no marcador
    if (!challenge.locked && challenge.action) {
      challenge.action();
    } else if (!challenge.locked && challenge.route) {
      router.push(challenge.route);
    }
  
    // Verifica se o desafio tem uma história (ou qualquer outro dado relevante)
    if (challenge.story) {
      setSelectedStoryForDialog(challenge.story); // Definir a história a ser exibida no diálogo
      setIsStoryDialogOpen(true); // Abre o diálogo diretamente
    }
  };
  
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return interval + ' anos atrás';
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
  



  useEffect(() => {
    const isFirstTime = localStorage.getItem('isFirstLogin') === 'true';
    if (isFirstTime) {
      setIsFirstTimeUser(true);
      
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    // Verify token and username
    verifyTokenAndUsername(token, user.username)
      .then((isValid) => {
        if (!isValid) {
          // If invalid, clear localStorage and redirect
          window.alert('Foi detectado uma alteração das informações de login. Por favor, faça login novamente.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/');
        }
      })
      .catch(() => {
        // Handle error case (e.g., network issue or invalid response)
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      });
  }, [router]);


  useEffect(() => {
    if (permissionGranted) {
      if (!navigator.geolocation) {
        alert("Seu navegador não suporta geolocalização.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          setLocation({ latitude, longitude });
          console.log("Localização obtida com sucesso:", { latitude, longitude });
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              alert("Você negou o acesso à localização. Permita para continuar.");
              break;
            case error.POSITION_UNAVAILABLE:
              alert("Sua localização está indisponível. Verifique se o GPS está ativado.");
              break;
            case error.TIMEOUT:
              alert("Tempo para obter a localização expirou. Tente novamente.");
              break;
            default:
              alert("Erro desconhecido ao acessar a localização.");
              break;
          }
        }
      );
    }
  }, [permissionGranted]);
  
  useEffect(() => {
    const hasntSubmitted = localStorage.getItem('FirstStory') === 'true';
    if (hasntSubmitted) {
      router.push('/story/create');
    }
  }, [router]);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial') === 'true';
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    } else {
      setShowTutorial(false);
  }
}, []);


  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    const isFirstTime = localStorage.getItem('isFirstLogin');
    if (isFirstTime === 'true') {
      localStorage.setItem('hasSeenTutorial', 'false');
    }
    else {
      setShowTutorial(false);
    }

  }, []);



  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      zoom: 40,
      center: [0, 0]
    });

    geolocateControl.current = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true,
      showAccuracyCircle: false
    });

    map.current.addControl(geolocateControl.current);

    geolocateControl.current.on('geolocate', (e) => {
      const { longitude, latitude } = e.coords;
      setUserLocation({ lng: longitude, lat: latitude });
      setLocationError(null);
      
      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 18,
        speed: 3.5
      });
    });

    geolocateControl.current.on('error', (e) => {
      console.error('Geolocation error:', e.error);
    });

    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
        70% { box-shadow: 0 0 0 20px rgba(76, 175, 80, 0); }
        100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
      }
      
      .mapboxgl-map {
        height: 100vh !important;
        height: -webkit-fill-available !important;
      }
      
      .bottom-safe-area {
        bottom: env(safe-area-inset-bottom);
        padding-bottom: env(safe-area-inset-bottom);
      }

      .mapboxgl-popup-content {
        max-width: 300px;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .story-media img {
        width: 100%;
        height: auto;
        border-radius: 4px;
        margin-bottom: 8px;
      }

      .story-media audio {
        width: 100%;
        margin-bottom: 8px;
        border-radius: 4px;
      }

      .story-marker {
        transition: transform 0.2s ease;
      }

      .story-marker:hover {
        transform: scale(1.2);
      }
    `;
    document.head.appendChild(style);

    map.current.on('load', () => {
      geolocateControl.current.trigger();
    });
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  const fetchAndUpdateStories = useCallback(async () => {
    if (!userLocation || !map.current) return;
  
    try {
      const token = localStorage.getItem('token');
      if (localStorage.getItem('firsttime') === 'true') {
        setIsFirstTimeUser(true);
      }
  
      const response = await fetch(
        `https://ceusgame.com:5522/stories/nearby?latitude=${userLocation.lat}&longitude=${userLocation.lng}&radius=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
  
      // Preprocess stories to extract collaborators and clean content
      const processedStories = data.map(story => {
        if (story.type === 'COLLABORATIVE') {
          const contentParts = story.content.split('\r\n\r\n');
          if (contentParts.length > 1) {
            const collaboratorsLine = contentParts[0].trim();
            if (collaboratorsLine.startsWith('Colaboradores:')) {
              story.collaborators = collaboratorsLine.replace('Colaboradores:', '').trim().split(',').map(c => c.trim());
              story.content = contentParts.slice(1).join('\r\n\r\n').trim();
            }
          }
        } else {
          story.collaborators = [];
        }
        return story;
      });
  
      setStories(processedStories);
  
      console.log('Histórias recuperadas:', processedStories);
  
      // Remove any previous markers
      Object.values(storyMarkers.current).forEach((marker) => marker.remove());
      storyMarkers.current = {};
  
      processedStories.forEach((story) => {
        if (!story.latitude || !story.longitude) {
          console.log('Story missing coordinates:', story.id);
          return;
        }
  
        // Set the type to PERSONAL by default if it's missing
        const storyType = story.type || 'PERSONAL';
  
        // Change marker color based on the story type
        let markerColor;
        if (storyType === 'PERSONAL') {
          markerColor = '#FF5722';
        } else if (storyType === 'OBJECT') {
          markerColor = '#9B4DCA';
        } else if (storyType === 'COLLABORATIVE') {
          markerColor = '#3B82F6';
        } else {
          markerColor = '#9333EA';
        }
  
        const el = document.createElement('div');
        el.className = 'story-marker';
  
        el.style.cssText = `
          width: 15px;
          height: 15px;
          background: ${markerColor};
          border-radius: 50%;
          border: 2px solid white;
          cursor: pointer;
          transition: transform 0.2s ease;
        `;
  
        const marker = new mapboxgl.Marker(el)
          .setLngLat([parseFloat(story.longitude), parseFloat(story.latitude)])
          .addTo(map.current);
  
        // Ensure the click event triggers the dialog opening
        el.addEventListener('click', () => {
          console.log('Marker clicked for story ID:', story.id); // Debugging line to check if click works
          setSelectedStoryForDialog(story);
          setIsStoryDialogOpen(true);
        });
  
        storyMarkers.current[story.id] = marker;
      });
    } catch (error) {
      console.error('Error fetching stories:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.alert('Sua sessão expirou, por favor faça login novamente.');
      router.push('/auth');
    }
  }, [userLocation, router]);
  useEffect(() => {
    fetchAndUpdateStories();
    const interval = setInterval(fetchAndUpdateStories, 30000);
    return () => clearInterval(interval);
  }, [fetchAndUpdateStories]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleCenterMap = () => {
    if (geolocateControl.current) {
      geolocateControl.current.trigger();
    }
  };

  // Check for first-time login
  useEffect(() => {

    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [router]);
  
  return (
    <div className="relative h-[100dvh]" >
      <div ref={mapContainer} className="absolute inset-0" />

      
      {/* Modern floating header with glass effect */}
      <div className="absolute top-0 left-2 p-4 z-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                className="bg-white/60 backdrop-blur-md shadow-lg hover:bg-white/90 transition-all duration-300"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <Button
                variant="secondary"
                className="bg-white/50 backdrop-blur-md shadow-lg hover:bg-white/90 transition-all duration-300"
                onClick={() => setShowChallenges(true)}
                style={{ display: isFirstTimeUser ? 'none' : 'flex' }}
              >
                <Trophy className="h-5 w-5 text-yellow-500" />
                Aceita um desafio?
              </Button>
            </div>
            
          </div>
        </div>
      </div>

      <MapProfileSection user={user} onLogout={handleLogout} isOpen={isMenuOpen} />


      {/* Challenges Dialog */}
      <Dialog open={showChallenges} onOpenChange={setShowChallenges}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desafios Disponíveis</DialogTitle>
            <DialogDescription>
              Escolha um desafio para começar sua jornada
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {challenges.map((challenge) => (
              <button
                key={challenge.id}
                onClick={() => handleChallengeSelect(challenge)}
                className={`relative group overflow-hidden rounded-lg p-4 transition-all duration-300
                  ${challenge.locked ? 'opacity-60 cursor-not-allowed' : 'hover:scale-102 cursor-pointer'}
                `}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${challenge.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
                <div className="relative flex items-center gap-4">
                  <div className={`p-3 rounded-full bg-gradient-to-r ${challenge.color}`}>
                    <challenge.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold">{challenge.title}</h3>
                    <p className="text-sm text-gray-500">{challenge.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <WeaveCloudDialog 
        isOpen={showWeaveDialog} 
        onClose={() => setShowWeaveDialog(false)}
      />
      <StoryModificationDialog 
        story={selectedStory}
        isOpen={showModificationDialog}
        onClose={() => {
          setShowModificationDialog(false);
          setSelectedStory(null);
        }}
      />
      <TutorialDialog 
        isOpen={showTutorial} 
        onClose={() => setShowTutorial(false)} 
      />
      <FirstTimeTutorial 
        isOpen={isFirstTimeUser} 
        onComplete={(shouldRedirect) => {
          setIsFirstTimeUser(false);
          if (shouldRedirect) {
            localStorage.setItem('FirstStory', 'true');
            router.push('/story/create');
          }
        }}
      />
 <Dialog open={isStoryDialogOpen} onOpenChange={setIsStoryDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          {selectedStoryForDialog && (
            <>
              <DialogHeader className="sticky top-0 bg-white pb-4 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStoryTypeBadge(selectedStoryForDialog.type).class}`}>
                      {getStoryTypeBadge(selectedStoryForDialog.type).text}
                    </span>
                    <span className="text-sm text-gray-500">
                      {getTimeAgo(new Date(selectedStoryForDialog.createdAt))}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsStoryDialogOpen(false)}
                    className="rounded-full p-1.5 hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                <DialogTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedStoryForDialog.type === 'COLLABORATIVE' ? (
                      [...new Set([selectedStoryForDialog.user.username, ...(selectedStoryForDialog.collaborators || [])])].map((username) => (
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
                          {selectedStoryForDialog.user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-gray-700">{selectedStoryForDialog.user.username}</span>
                      </div>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedStoryForDialog.content}</p>
              </div>

              {selectedStoryForDialog.mediaUrls && selectedStoryForDialog.mediaUrls.length > 0 && (
                <div className="mt-4 grid gap-4 grid-cols-1">
                  {selectedStoryForDialog.mediaUrls.map((url, index) => (
                    <div key={index} className="relative">
                      {url.startsWith('data:image/') ? (
                        <img
                          src={url}
                          alt={`Story media ${index + 1}`}
                          className="w-full h-auto rounded-lg object-contain max-h-[60vh]"
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

              {(!selectedStoryForDialog.type || selectedStoryForDialog.type === 'PERSONAL') && (
                <div className="mt-4 sticky bottom-0 bg-white pt-2">
                  <button
                    onClick={() => {
                      setShowModificationDialog(true);
                      setIsStoryDialogOpen(false);
                      setSelectedStory(selectedStoryForDialog);
                    }}
                    style={{ display: isFirstTimeUser ? 'none' : 'flex' }}
                    className="w-full items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  >
                    <Edit2 className="h-4 w-4" />
                    Tecer uma nova versão
                  </button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>

    
  );
};

export default MapPage;
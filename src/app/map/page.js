'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import 'dotenv/config';
import MapProfileSection from '@/components/ui/MapProfileSection';
import StoryModificationDialog from '@/components/ui/StoryModificationDialog';
import TutorialDialog from '@/components/ui/TutorialDialog';
import WeaveCloudDialog from '@/components/ui/WeaveCloudDialog';
import FirstTimeTutorial from '@/components/ui/FirstTimeTutorial';
import StoryDialog from '@/components/ui/StoryDialog';
import PixelArtGameAudioPlayer from '@/components/ui/SafariAudioPlayer';
import { useStoriesSocket } from '@/hooks/useStoriesSocket';
import { getMediaUrl } from '@/lib/media';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  MoreVertical, LogOut, Trophy, Users, Cloud, 
  Target, Apple, Map as MapIcon, Menu, X, ChevronRight, Edit2, Leaf, Swords, AlertTriangle
} from 'lucide-react';

// Add this helper function at the top of the file with other constants
const urlRegex = /(?:(?:https?|ftp):\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+(?:\/[^\s]*)?/g;

const hasLinks = (text) => {
  urlRegex.lastIndex = 0;
  return urlRegex.test(text);
};

const MapPage = () => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [location, setLocation] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [stories, setStories] = useState([]);
  const [requests, setRequests] = useState([]);
  const [mediaFetchLocation, setMediaFetchLocation] = useState(null);
  const [loadedStoryId, setLoadedStoryId] = useState(null);
  const [user, setUser] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showWeaveDialog, setShowWeaveDialog] = useState(false);
  const [isStoryDialogOpen, setIsStoryDialogOpen] = useState(false);
  const [selectedStoryForDialog, setSelectedStoryForDialog] = useState(null);
  const router = useRouter();
  const mapContainer = useRef(null);
  const [isTracking, setIsTracking] = useState(true);
  const map = useRef(null);
  const geolocateControl = useRef(null);
  const storyMarkers = useRef({});
  
  // Custom user marker animation refs
  const customUserMarkerRef = useRef(null);
  const userLocTarget = useRef(null);
  const userLocCurrent = useRef(null);
  const animFrame = useRef(null);

  const [showChallenges, setShowChallenges] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [showModificationDialog, setShowModificationDialog] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [storyMedia, setStoryMedia] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const { stories: rawStories } = useStoriesSocket(userLocation);

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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verify`, {
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
      OBJECT: { text: 'CEUS NAS MAOS', icon: '🎯', class: 'bg-purple-100 text-purple-800 border-purple-300' },
      COLLABORATIVE: { text: 'CEUS CRUZADOS', icon: '👥', class: 'bg-blue-100 text-blue-800 border-blue-300' },
      PERSONAL: { text: 'COLECIONAR NEVOAS', icon: '📝', class: 'bg-orange-100 text-orange-800 border-orange-300' }
    };
    const defaultType = { text: 'COLECIONAR NEVOAS', icon: '📝', class: 'bg-orange-100 text-orange-800 border-orange-300' };
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
    const fetchRequests = async () => {
      if (!user?.id) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stories/modifications/pending`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
  
        if (response.ok) {
          const data = await response.json();
          setRequests(data);
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };
  
    fetchRequests();
    const interval = setInterval(fetchRequests, 30000); // Check every 30 seconds
  
    return () => clearInterval(interval);
  }, [user?.id]);



  useEffect(() => {
    const isFirstTime = localStorage.getItem('isFirstLogin') === 'true';
    if (isFirstTime) {
      setIsFirstTimeUser(true);
      
    }
  }, []);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!token || !user) {
        // If either token or user is missing, redirect to login
        router.push('/auth');
        return;
      }
  
      // Only verify if we have both token and user
      verifyTokenAndUsername(token, user.username)
        .then((isValid) => {
          if (!isValid) {
            window.alert('Foi detectado uma alteração das informações de login. Por favor, faça login novamente.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/');
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/auth');
        });
  
    } catch (error) {
      // Handle any JSON parsing errors or other issues
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/auth');
    }
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
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
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
    if (localStorage.getItem('ShowTutorial') === 'true') {
      setShowTutorial(true)
      localStorage.setItem('ShowTutorial', 'false');
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
      zoom: 18,
      center: [0, 0]

    });

    geolocateControl.current = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true,
      showUserLocation: false,
      showAccuracyCircle: false
    });

    map.current.addControl(geolocateControl.current);

    geolocateControl.current.on('geolocate', (e) => {
      const { longitude, latitude } = e.coords;
      setUserLocation({ lng: longitude, lat: latitude });
      setLocationError(null);
      
      userLocTarget.current = { lng: longitude, lat: latitude };
      
      if (!userLocCurrent.current) {
        userLocCurrent.current = { lng: longitude, lat: latitude };
        
        // Create custom user marker
        const el = document.createElement('div');
        el.className = 'custom-user-dot';
        el.style.width = '18px';
        el.style.height = '18px';
        el.style.backgroundColor = '#1DA1F2';
        el.style.borderRadius = '50%';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 0 12px rgba(29, 161, 242, 0.6)';
        
        customUserMarkerRef.current = new mapboxgl.Marker(el)
          .setLngLat([longitude, latitude])
          .addTo(map.current);
      }
      
      const animateMarker = () => {
        if (!userLocCurrent.current || !userLocTarget.current || !customUserMarkerRef.current) return;
        
        const current = userLocCurrent.current;
        const target = userLocTarget.current;
        
        const dx = target.lng - current.lng;
        const dy = target.lat - current.lat;
        
        // Lerp factor
        current.lng += dx * 0.1;
        current.lat += dy * 0.1;
        
        customUserMarkerRef.current.setLngLat([current.lng, current.lat]);
        
        if (Math.abs(dx) > 0.0000001 || Math.abs(dy) > 0.0000001) {
          animFrame.current = requestAnimationFrame(animateMarker);
        } else {
          animFrame.current = null;
        }
      };
      
      if (!animFrame.current) {
        animateMarker();
      }
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
  useEffect(() => {
    if (!map.current || !rawStories) return;

    const processedStories = rawStories.map(s => {
      const story = { ...s };
      if (story.type === 'COLLABORATIVE') {
        const contentParts = story.content.split('\r\n\r\n');
        if (contentParts.length > 1) {
          const collaboratorsLine = contentParts[0].trim();
          if (collaboratorsLine.startsWith('Colaboradores:')) {
            const collaborators = collaboratorsLine
              .replace('Colaboradores:', '')
              .trim()
              .split(',')
              .map(c => c.trim())
              .filter(username => username);
            
            const ownerUsername = story.user.username;
            const filteredCollaborators = collaborators.filter(username => 
              username !== ownerUsername
            );
            
            story.collaborators = filteredCollaborators;
            story.content = contentParts.slice(1).join('\r\n\r\n').trim();
          }
        }
      } else {
        story.collaborators = [];
      }
      return story;
    });

    setStories(processedStories);
    
    // Update markers
    Object.values(storyMarkers.current).forEach((marker) => marker.remove());
    storyMarkers.current = {};

    processedStories.forEach((story) => {
      if (!story.latitude || !story.longitude) return;

      const storyType = story.type || 'PERSONAL';
      let markerColor;
      if (storyType === 'PERSONAL') markerColor = '#FF5722';
      else if (storyType === 'OBJECT') markerColor = '#9B4DCA';
      else if (storyType === 'COLLABORATIVE') markerColor = '#3B82F6';
      else markerColor = '#9333EA';

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

      el.addEventListener('click', () => {
        setSelectedStoryForDialog(story);
        setIsStoryDialogOpen(true);
      });

      storyMarkers.current[story.id] = marker;
    });

  }, [rawStories]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  useEffect(() => {
    const fetchStoryMedia = async () => {
      // Only fetch if:
      // 1. Dialog is open
      // 2. We have a story with media
      // 3. We haven't already loaded this story's media
      if (!isStoryDialogOpen || 
          !selectedStoryForDialog?.hasMedia || 
          !userLocation ||
          loadedStoryId === selectedStoryForDialog.id) {
        return;
      }
  
      setMediaLoading(true);
      setMediaError(null);
  
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/stories/${selectedStoryForDialog.id}/media`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              userLocation: {
                latitude: userLocation.lat,
                longitude: userLocation.lng
              },
              radiusKm: 10
            })
          }
        );
  
        if (!response.ok) {
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || 'Failed to fetch media');
          } catch {
            throw new Error(`Server error: ${response.status} - ${errorText}`);
          }
        }
  
        const data = await response.json();
        if (data.mediaUrls && Array.isArray(data.mediaUrls)) {
          setStoryMedia(data.mediaUrls);
          setLoadedStoryId(selectedStoryForDialog.id);
        } else {
          throw new Error('Invalid media response format');
        }
      } catch (error) {
        console.error('Media fetch error:', error);
        setMediaError(error.message);
        setStoryMedia([]);
      } finally {
        setMediaLoading(false);
      }
    };
  
    fetchStoryMedia();
  
    // Clear everything when dialog closes
    if (!isStoryDialogOpen) {
      setStoryMedia([]);
      setMediaError(null);
      setLoadedStoryId(null);
    }
  }, [isStoryDialogOpen, selectedStoryForDialog]); // Remove userLocation from dependencies


  // Check for first-time login
  useEffect(() => {

    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [router]);
  
  return (
    <div className="relative h-[100dvh]">
      <div ref={mapContainer} className="absolute inset-0" />


      
  
      
      {/* Modern floating header with glass effect */}
      <div className="absolute top-0 left-2 z-20 p-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
            <Button 
              variant="secondary" 
              className="relative shadow-lg backdrop-blur-md transition-all duration-300 bg-white/60 hover:bg-white/90"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              {requests?.length > 0 && (
                <span className="flex absolute -top-1 -right-1 justify-center items-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                  {requests.length}
                </span>
              )}
            </Button>


            <Button
              variant="secondary"
              className="bg-white/80 backdrop-blur-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-white/95 transition-all duration-300 border border-white/40 flex items-center gap-2"
              onClick={() => setShowChallenges(true)}
              style={{ display: isFirstTimeUser ? 'none' : 'flex' }}
            >
              <Swords className="w-5 h-5 text-yellow-500" />
              <span className="font-medium text-gray-700">Aceita um desafio?</span>
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
                <div className="flex relative gap-4 items-center">
                  <div className={`p-3 rounded-full bg-gradient-to-r ${challenge.color}`}>
                    <challenge.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold">{challenge.title}</h3>
                    <p className="text-sm text-gray-500">{challenge.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
  
      {/* Other dialogs */}
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
          fetchAndUpdateStories(); // Refresh stories after modification
        }}
      />
  
      <TutorialDialog 
        isOpen={showTutorial} 
        onClose={() => {
          setShowTutorial(false);
          localStorage.setItem('hasSeenTutorial', 'true');
        }} 
      />
  
      <FirstTimeTutorial 
        isOpen={isFirstTimeUser} 
        onComplete={(shouldRedirect) => {
          setIsFirstTimeUser(false);
          if (shouldRedirect) {
            localStorage.setItem('FirstStory', 'true');
            localStorage.setItem('hasSeenTutorial', 'false');
            router.push('/story/create');
          }
        }}
      />
  

      {/* Story Dialog */}
      <Dialog open={isStoryDialogOpen} onOpenChange={setIsStoryDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-amber-50 border-4 border-orange-500 sm:rounded-none rounded-none shadow-[8px_8px_0_0_rgba(249,115,22,0.5)] p-8">
          {selectedStoryForDialog && (
            <>
              <DialogHeader className="sticky top-0 z-10 pb-4 bg-amber-50">
                <div className="flex flex-wrap justify-between items-center mb-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-2 text-[8px] font-['Press_Start_2P'] border-2 ${getStoryTypeBadge(selectedStoryForDialog.type).class}`}>
                      <span className="text-sm">{getStoryTypeBadge(selectedStoryForDialog.type).icon}</span>
                      {getStoryTypeBadge(selectedStoryForDialog.type).text}
                    </span>
                    <span className="text-[8px] font-['Press_Start_2P'] text-slate-500">
                      {getTimeAgo(new Date(selectedStoryForDialog.createdAt))}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsStoryDialogOpen(false)}
                    className="p-1.5 rounded-full transition-colors hover:bg-orange-100"
                  >
                  </button>
                </div>
                <DialogTitle>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {selectedStoryForDialog.type === 'COLLABORATIVE' ? (
                      [...new Set([selectedStoryForDialog.user.username, ...(selectedStoryForDialog.collaborators || [])])].map((username) => (
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
                          {selectedStoryForDialog.user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[10px] font-['Press_Start_2P'] text-slate-800 uppercase">{selectedStoryForDialog.user.username}</span>
                      </div>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4">
                {(selectedStoryForDialog.type === 'COLLABORATIVE' ? (
                  hasLinks(selectedStoryForDialog.content) || selectedStoryForDialog.collaborators?.some(username => hasLinks(username))
                ) : hasLinks(selectedStoryForDialog.content)) ? (
                  <div className="mt-4 bg-red-100 border-4 border-red-500 p-4">
                    <div className="flex items-start">
                      <AlertTriangle className="h-6 w-6 text-red-600 mr-4 shrink-0" />
                      <p className="text-[8px] font-['Press_Start_2P'] text-red-800 leading-relaxed uppercase">
                        ATENCAO: Esta historia contem links ou codigos HTML suspeitos e foi ocultada.
                      </p>
                    </div>
                  </div>
                ) : selectedStoryForDialog.content && selectedStoryForDialog.content.trim().length > 0 ? (
                  <div className="mt-6 bg-white border-4 border-slate-300 p-5 relative shadow-inner">
                    <div className="absolute top-0 left-0 w-2 h-2 bg-slate-300 -mt-2 -ml-2"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 bg-slate-300 -mt-2 -mr-2"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 bg-slate-300 -mb-2 -ml-2"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-slate-300 -mb-2 -mr-2"></div>
                    <p className="font-['Press_Start_2P'] text-[10px] text-slate-800 leading-[2] whitespace-pre-wrap uppercase">
                      {selectedStoryForDialog.content}
                    </p>
                  </div>
                ) : null}
              </div>

              {selectedStoryForDialog.hasMedia && (
                <div className="mt-6">
                  {mediaLoading && (
                    <div className="py-8 bg-white border-4 border-slate-300 flex flex-col items-center justify-center">
                      <div className="inline-block mb-4 w-8 h-8 border-4 border-orange-500 border-t-transparent animate-spin" />
                      <p className="font-['Press_Start_2P'] text-[8px] text-slate-500 uppercase">Carregando midia...</p>
                    </div>
                  )}

                  {mediaError && (
                    <div className="py-6 px-4 bg-red-50 border-4 border-red-300 text-center">
                      <p className="font-['Press_Start_2P'] text-[8px] text-red-600 uppercase leading-relaxed">
                        {mediaError.includes('too far') 
                          ? 'Aproxime-se para visualizar a midia'
                          : 'Erro ao carregar conteudo'}
                      </p>
                    </div>
                  )}

                  {!mediaLoading && !mediaError && storyMedia.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {storyMedia.map((url, index) => (
                        <div key={index} className="relative border-4 border-slate-300 bg-white p-1">
                          {url.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(url) ? (
                            <Image
                              src={getMediaUrl(url)}
                              alt={`Conteúdo da história ${index + 1}`}
                              width={600}
                              height={400}
                              className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ imageRendering: 'pixelated' }}
                              quality={80}
                              loading="lazy"
                              unoptimized={true}
                            />
                          ) : url.startsWith('data:audio/') || /\.(mp3|wav|ogg|m4a|webm|mp4|aac)$/i.test(url) ? (
                            <div className="bg-slate-100 p-3 border-2 border-slate-200">
                              <PixelArtGameAudioPlayer audioUrl={getMediaUrl(url)} />
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(!selectedStoryForDialog.type || selectedStoryForDialog.type === 'PERSONAL') && (
                <div className="sticky bottom-0 pt-4 mt-8 bg-amber-50 flex justify-end">
                  <button
                    onClick={() => {
                      setShowModificationDialog(true);
                      setIsStoryDialogOpen(false);
                      setSelectedStory(selectedStoryForDialog);
                    }}
                    style={{ display: isFirstTimeUser ? 'none' : 'flex' }}
                    className="relative px-4 py-3 font-['Press_Start_2P'] text-[10px] transition-all duration-100 active:translate-y-1 bg-orange-500 text-white border-b-4 border-r-4 border-orange-700 hover:border-b-2 hover:border-r-2 hover:translate-y-1 hover:shadow-[4px_4px_0_0_rgba(249,115,22,0.3)] flex items-center gap-3"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>TECER NOVA VERSAO</span>
                  </button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );}

export default MapPage;

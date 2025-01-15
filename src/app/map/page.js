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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  MoreVertical, LogOut, Trophy, Users, Cloud, 
  Target, Apple, Map as MapIcon, Menu, X, ChevronRight
} from 'lucide-react';


const MapPage = () => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [stories, setStories] = useState([]);
  const [user, setUser] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showWeaveDialog, setShowWeaveDialog] = useState(false);
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
      icon: Apple,
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
  
  const handleChallengeSelect = (challenge) => {
    setSelectedChallenge(challenge);
    setShowChallenges(false);
    if (!challenge.locked && challenge.action) {
      challenge.action();
    } else if (!challenge.locked && challenge.route) {
      router.push(challenge.route);
    }
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
    const getLocation = () => {
      if (!navigator.geolocation) {
        console.error("Geolocalização não é suportada pelo navegador.");
        return;
      }
  
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          console.log("Localização obtida com sucesso:", { latitude, longitude });
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              console.error("Permissão de localização negada.");
              alert("Por favor, permita o acesso à localização nas configurações do navegador.");
              break;
            case error.POSITION_UNAVAILABLE:
              console.error("Localização indisponível.");
              alert("Sua localização está indisponível. Verifique se o GPS está ativado.");
              break;
            case error.TIMEOUT:
              console.error("Tempo para obter a localização expirou.");
              break;
            default:
              console.error("Erro desconhecido ao acessar a localização.");
              break;
          }
        }
      );
    };
  
    getLocation();
  }, []);

  const createPopupContent = (story) => {
    const popupContainer = document.createElement('div');
    popupContainer.className = 'max-w-sm bg-white rounded-lg overflow-hidden shadow-lg';
  
    // Header section
    const header = document.createElement('div');
    header.className = 'px-4 py-3 border-b border-gray-100';
  
    // Story type badge
    const typeBadge = document.createElement('span');
    typeBadge.className = `inline-block px-2 py-1 text-xs font-semibold rounded-full mb-2 ${
      story.type === 'OBJECT' ? 'bg-purple-100 text-purple-800' :
      story.type === 'COLLABORATIVE' ? 'bg-blue-100 text-blue-800' :
      'bg-orange-100 text-orange-800'
    }`;
    typeBadge.textContent = story.type === 'OBJECT' ? '🎯 Céus nas mãos' :
                           story.type === 'COLLABORATIVE' ? '👥 Céus cruzados' :
                           '📝 Colecionar névoas';
    header.appendChild(typeBadge);
  
    // User(s) section
    const userContainer = document.createElement('div');
    userContainer.className = 'mt-2';
  
    const userList = document.createElement('div');
    userList.className = 'flex flex-wrap gap-2';
  
    
    // Handle different user displays based on story type
    if (story.type === 'COLLABORATIVE') {
      const uniqueUsers = [...new Set([story.user.username, ...(story.collaborators || [])])];
      uniqueUsers.forEach(username => {
        const userChip = document.createElement('div');
        userChip.className = 'flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1';
  
        const avatar = document.createElement('div');
        avatar.className = 'w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold';
        avatar.textContent = username.charAt(0).toUpperCase();
  
        const name = document.createElement('span');
        name.className = 'text-xs font-medium text-gray-700';
        name.textContent = username;
  
        userChip.appendChild(avatar);
        userChip.appendChild(name);
        userList.appendChild(userChip);
      });
    } else {
      const userChip = document.createElement('div');
      userChip.className = 'flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1';
  
      const avatar = document.createElement('div');
      avatar.className = 'w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold';
      avatar.textContent = story.user.username.charAt(0).toUpperCase();
  
      const name = document.createElement('span');
      name.className = 'text-xs font-medium text-gray-700';
      name.textContent = story.user.username;
  
      userChip.appendChild(avatar);
      userChip.appendChild(name);
      userList.appendChild(userChip);
    }
  
    userContainer.appendChild(userList);
    header.appendChild(userContainer);
  
    // Timestamp
    const timestamp = document.createElement('p');
    timestamp.className = 'text-xs text-gray-500 mt-2';
    timestamp.textContent = getTimeAgo(new Date(story.createdAt));
    header.appendChild(timestamp);
  
    popupContainer.appendChild(header);
  
    // Content section
    const content = document.createElement('div');
    content.className = 'px-4 py-3';
  
    const storyContent = document.createElement('p');
    storyContent.className = 'text-gray-700 text-sm leading-relaxed whitespace-pre-wrap';
    storyContent.textContent = story.content;
    content.appendChild(storyContent);
  
    popupContainer.appendChild(content);

    if (!story.type || story.type === 'PERSONAL') {
      const modifyButton = document.createElement('button');
      modifyButton.className = 'mt-3 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1';
      modifyButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Tecer uma nova versão
      `;
      modifyButton.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedStory(story);
        setShowModificationDialog(true);
        map.current.getCanvas().style.cursor = '';
        const popup = document.getElementsByClassName('mapboxgl-popup');
        if (popup.length) {
          popup[0].remove();
        }
      };
      content.appendChild(modifyButton);
    }
  
    // Media section
    if (story.mediaUrls && story.mediaUrls.length > 0) {
      const mediaContainer = document.createElement('div');
      mediaContainer.className = 'px-4 pb-3 grid gap-2';
      if (story.mediaUrls.length > 1) {
        mediaContainer.className += ' grid-cols-2';
      }
  
      story.mediaUrls.forEach(url => {
        if (url.startsWith('data:image/')) {
          const imgWrapper = document.createElement('div');
          imgWrapper.className = 'relative aspect-square rounded-lg overflow-hidden bg-gray-50';
  
          const img = document.createElement('img');
          img.src = url;
          img.alt = 'Story media';
          img.className = 'w-full h-full object-cover transition-all duration-300 hover:scale-105 cursor-pointer';
  
          // Loading state
          img.style.opacity = '0';
          const loader = document.createElement('div');
          loader.className = 'absolute inset-0 flex items-center justify-center';
          loader.innerHTML = `
            <div class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          `;
  
          imgWrapper.appendChild(loader);
          imgWrapper.appendChild(img);
  
          // Add click handler for image expansion
          img.onclick = (e) => {
            e.stopPropagation(); // Prevent popup from closing
  
            // Create modal container
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4';
            modal.style.animation = 'fadeIn 0.2s ease-out';
  
            // Create expanded image
            const expandedImg = document.createElement('img');
            expandedImg.src = url;
            expandedImg.className = 'max-h-[90vh] max-w-[90vw] object-contain rounded-lg';
            expandedImg.style.animation = 'zoomIn 0.3s ease-out';
  
            // Create close button
            const closeButton = document.createElement('button');
            closeButton.className = 'absolute top-4 right-4 text-white p-2 rounded-full hover:bg-white hover:bg-opacity-20';
            closeButton.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            `;
  
            // Add click handlers
            const closeModal = () => {
              modal.style.animation = 'fadeOut 0.2s ease-out';
              expandedImg.style.animation = 'zoomOut 0.2s ease-out';
              setTimeout(() => modal.remove(), 200);
            };
  
            closeButton.onclick = (e) => {
              e.stopPropagation();
              closeModal();
            };
  
            modal.onclick = closeModal;
  
            // Prevent click on image from closing modal
            expandedImg.onclick = (e) => e.stopPropagation();
  
            // Add keyboard support for closing
            const handleEscape = (e) => {
              if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
              }
            };
            document.addEventListener('keydown', handleEscape);
  
            // Assemble modal
            modal.appendChild(expandedImg);
            modal.appendChild(closeButton);
            document.body.appendChild(modal);
          };
  
          img.onload = () => {
            img.style.opacity = '1';
            loader.remove();
          };
  
          mediaContainer.appendChild(imgWrapper);
        } else if (url.startsWith('data:audio/')) {
          const createAudioPlayer = (url) => {
            const audioWrapper = document.createElement('div');
            audioWrapper.className = 'bg-gray-50 rounded-lg p-3 col-span-2';
        
            const playerContainer = document.createElement('div');
            playerContainer.className = 'flex items-center gap-3 bg-white rounded-lg p-2.5 shadow-sm';
        
            const playButton = document.createElement('button');
            playButton.className = 'w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 active:scale-95';
            playButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                </svg>
            `;
        
            const audio = document.createElement('audio');
            audio.preload = 'none'; // Disable preloading
            const source = document.createElement('source');
            source.src = url;
            source.type = 'audio/mpeg';
            audio.appendChild(source);
        
            let isPlaying = false;
        
            const togglePlay = () => {
                if (isPlaying) {
                    audio.pause();
                } else {
                    audio.play().catch((error) => {
                        console.error('Playback failed:', error);
                    });
                }
            };
        
            playButton.addEventListener('click', togglePlay);
        
            audio.addEventListener('play', () => {
                isPlaying = true;
                playButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                `;
            });
        
            audio.addEventListener('pause', () => {
                isPlaying = false;
                playButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                    </svg>
                `;
            });
        
            playerContainer.appendChild(playButton);
            audioWrapper.appendChild(playerContainer);
            audioWrapper.appendChild(audio);
        
            return audioWrapper;
        };
  
          mediaContainer.appendChild(createAudioPlayer(url));
        }
      });
  
      popupContainer.appendChild(mediaContainer);
    }
  
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .mapboxgl-popup-content {
        padding: 0 !important;
        overflow: hidden !important;
        max-width: 320px !important;
        border-radius: 12px !important;
      }
  
      .mapboxgl-popup-close-button {
        right: 8px !important;
        top: 8px !important;
        color: #666 !important;
        font-size: 16px !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
        z-index: 1 !important;
        transition: all 0.2s ease !important;
      }
  
      .mapboxgl-popup-close-button:hover {
        background-color: rgba(0, 0, 0, 0.05) !important;
        color: #333 !important;
      }
  
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
  
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
  
      @keyframes zoomIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
  
      @keyframes zoomOut {
        from {
          opacity: 1;
          transform: scale(1);
        }
        to {
          opacity: 0;
          transform: scale(0.95);
        }
      }
  
      .story-media img {
        animation: fadeIn 0.3s ease-in-out;
      }
    `;
    document.head.appendChild(style);
  
    return popupContainer;
  };
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

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
      localStorage.setItem('hasSeenTutorial', 'true');
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
  
      Object.values(storyMarkers.current).forEach((marker) => marker.remove());
      storyMarkers.current = {};
  
      processedStories.forEach((story) => {
        if (!story.latitude || !story.longitude) {
          console.log('Story missing coordinates:', story.id);
          return;
        }
  
        // Set the type to PERSONAL by default if it's missing
        const storyType = story.type || 'PERSONAL'; // Fallback to 'PERSONAL' if undefined
  
        // Change marker color based on the story type
        let markerColor;
        if (storyType === 'PERSONAL') {
          markerColor = '#FF5722'; // Red color for PERSONAL
        } else if (storyType === 'OBJECT') {
          markerColor = '#9B4DCA'; // Purple color for OBJECT
        } else if (storyType === 'COLLABORATIVE') {
          markerColor = '#3B82F6'; // Blue color for COLLABORATIVE
        } else {
          markerColor = '#9333EA'; // Default color
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
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setDOMContent(createPopupContent(story))
          )
          .addTo(map.current);
  
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
      <FirstTimeTutorial 
        isOpen={isFirstTimeUser} 
        onComplete={(shouldRedirect) => {
          setIsFirstTimeUser(false);
          localStorage.setItem('isFirstLogin', 'false');
          if (shouldRedirect) {
            router.push('/story/create');
          }
        }}
      />
    </div>

    
  );
};

export default MapPage;
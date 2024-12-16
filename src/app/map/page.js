'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MoreVertical, LogOut, Trophy, Users, Cloud, Target, Apple} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

mapboxgl.accessToken = 'TOKEN';

const MapPage = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [stories, setStories] = useState([]);
  const [user, setUser] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const router = useRouter();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const geolocateControl = useRef(null);
  const storyMarkers = useRef({});
  const [challenges] = useState([
    {
      id: 'collect-mist',
      title: 'Colecionar Névoas',
      description: 'Compartilhe suas histórias pelo mundo',
      icon: Cloud,
      route: '/story/create'
    },
    {
      id: 'crossed-skies',
      title: 'Céus Cruzados',
      description: 'Crie histórias colaborativas com outros jogadores',
      icon: Users,
      route: '/story/create-collab'
    },
    {
      id: 'Skies-In-Hands',
      title: 'Céus nas mãos',
      description: 'Mova um objeto e registre sua nova localização',
      icon: Apple,
      route: '/story/move-object'
    },
    {
      id: 'future-challenge-2',
      title: 'Desafio Futuro 2',
      description: 'Em breve',
      icon: Target,
      locked: true
    }
  ]);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.error("Permissão de localização negada.");
            break;
          case error.POSITION_UNAVAILABLE:
            console.error("Localização indisponível.");
            break;
          case error.TIMEOUT:
            console.error("Tempo para obter a localização expirou.");
            break;
          default:
            console.error("Erro desconhecido.");
            break;
        }
      }
    );
  } else {
    console.error("Geolocalização não é suportada pelo navegador.");
  }

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
  
    // User(s) section - Now showing for all story types
    const userContainer = document.createElement('div');
    userContainer.className = 'mt-2';
  
    const userList = document.createElement('div');
    userList.className = 'flex flex-wrap gap-2';
  
    // For collaborative stories, show all collaborators
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
      // For personal and object stories, show only the owner
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
    // Media section with improved layout
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
  
          img.onload = () => {
            img.style.opacity = '1';
            loader.remove();
          };
  
          // Add click event to open image in fullscreen
          img.addEventListener('click', () => {
            setSelectedImage(url);
          });
  
          mediaContainer.appendChild(imgWrapper);
        } else if (url.startsWith('data:audio/')) {
          const audioWrapper = document.createElement('div');
          audioWrapper.className = 'bg-gray-50 rounded-lg p-3 col-span-2'; // Always full width
  
          // Audio player container
          const playerContainer = document.createElement('div');
          playerContainer.className = 'flex items-center gap-3 bg-white rounded-lg p-2 shadow-sm';
  
          // Play icon container
          const playIconContainer = document.createElement('div');
          playIconContainer.className = 'w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors';
          playIconContainer.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
            </svg>
          `;
  
          // Create audio element
          const audio = document.createElement('audio');
          audio.className = 'hidden';
          audio.preload = 'auto';
          audio.muted = true; // Muted to handle autoplay restrictions
          const source = document.createElement('source');
          source.src = url;
          source.type = url.includes('audio/mpeg') ? 'audio/mpeg' : 'audio/wav';
          audio.appendChild(source);
  
          // Progress bar container
          const progressContainer = document.createElement('div');
          progressContainer.className = 'flex-1';
  
          // Progress bar
          const progressBar = document.createElement('div');
          progressBar.className = 'w-full bg-gray-200 rounded-full h-1.5 cursor-pointer';
  
          const progress = document.createElement('div');
          progress.className = 'bg-blue-500 h-1.5 rounded-full transition-all duration-150';
          progress.style.width = '0%';
  
          progressBar.appendChild(progress);
          progressContainer.appendChild(progressBar);
  
          // Time display
          const timeDisplay = document.createElement('div');
          timeDisplay.className = 'text-xs text-gray-500 mt-1';
          timeDisplay.textContent = '0:00 / 0:00';
          progressContainer.appendChild(timeDisplay);
  
          // Add event listeners
          let isPlaying = false;
  
          const formatTime = (seconds) => {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
          };
  
          playIconContainer.addEventListener('click', () => {
            if (isPlaying) {
              audio.pause();
            } else {
              audio.play();
            }
          });
  
          audio.addEventListener('play', () => {
            isPlaying = true;
            playIconContainer.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                <path fill-rule="evenodd" d="M13 8a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            `;
          });
  
          audio.addEventListener('pause', () => {
            isPlaying = false;
            playIconContainer.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
              </svg>
            `;
          });
  
          audio.addEventListener('timeupdate', () => {
            const percent = (audio.currentTime / audio.duration) * 100;
            progress.style.width = `${percent}%`;
            timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
          });
  
          audio.addEventListener('loadedmetadata', () => {
            timeDisplay.textContent = `0:00 / ${formatTime(audio.duration)}`;
          });
  
          progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audio.currentTime = percent * audio.duration;
          });
  
          // Assemble the player
          playerContainer.appendChild(playIconContainer);
          playerContainer.appendChild(progressContainer);
          audioWrapper.appendChild(playerContainer);
          audioWrapper.appendChild(audio);
  
          mediaContainer.appendChild(audioWrapper);
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
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

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
        router.push('/story/create');
        localStorage.setItem('firsttime', 'false');
      }
  
      const response = await fetch(
        `http://localhost:5522/stories/nearby?latitude=${userLocation.lat}&longitude=${userLocation.lng}&radius=10`,
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
      router.push('/');
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
    if (localStorage.getItem('isFirstLogin') === 'true') {
      router.push('/story/create');
      return;
    }

    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  return (
    <div className="relative h-screen h-[100dvh]">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {locationError && (
        <Card className="absolute top-4 left-4 right-4 z-20">
          <CardContent className="p-4">
            <p className="text-red-500">{locationError}</p>
          </CardContent>
        </Card>
      )}
      
      <Card className="absolute top-4 left-4 z-10">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="font-bold">{user?.username || 'Player'}</div>
            <div className="text-sm text-gray-500">Online</div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (localStorage.getItem('user').username === 'admin') {
                    router.push('/admin');
                  } else (
                    console.log('error')
                  )
                }}
              >
                <MoreVertical className="mr-2 h-4 w-4" />
                Painel Admin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      <div className="absolute bottom-safe-area right-4 z-10 flex flex-col gap-4 pb-4 my-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full md:w-auto">
              <Trophy className="mr-2 h-4 w-4" />
              Aceita um desafio?
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Escolha um desafio</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {challenges.map((challenge) => (
              <DropdownMenuItem
                key={challenge.id}
                onClick={() => !challenge.locked && router.push(challenge.route)}
                disabled={challenge.locked}
                className="flex items-center"
              >
                <challenge.icon className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{challenge.title}</span>
                  <span className="text-xs text-gray-500">{challenge.description}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};


export default MapPage;
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

mapboxgl.accessToken = 'MAPBOX TOKEN';

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
  
    // Header section with user info and timestamp
    const header = document.createElement('div');
    header.className = 'px-4 py-3 border-b border-gray-100 flex items-center gap-3';
    
    // User avatar (placeholder circle)
    const avatar = document.createElement('div');
    avatar.className = 'w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold';
    avatar.textContent = story.user.username.charAt(0).toUpperCase();
    
    // User info container
    const userInfo = document.createElement('div');
    userInfo.className = 'flex-1';
    
    const username = document.createElement('p');
    username.className = 'font-semibold text-gray-900';
    username.textContent = story.user.username;
    
    const timestamp = document.createElement('p');
    timestamp.className = 'text-xs text-gray-500';
    const timeAgo = getTimeAgo(new Date(story.createdAt));
    timestamp.textContent = timeAgo;
    
    userInfo.appendChild(username);
    userInfo.appendChild(timestamp);
    
    header.appendChild(avatar);
    header.appendChild(userInfo);
    popupContainer.appendChild(header);
  
    // Content section: check if the story is an object or personal
    const content = document.createElement('div');
    content.className = 'px-4 py-3';
  
    // Conditional for object-type stories
    if (story.type === 'OBJECT') {
      const title = document.createElement('h3');
      title.className = 'font-semibold text-lg text-gray-900 mb-2';
      title.textContent = ('Objeto deslocado');
      content.appendChild(title);
    } else {
      const title = document.createElement('h3');
      title.className = 'font-semibold text-lg text-gray-900 mb-2';
      title.textContent = ('História');
      content.appendChild(title);
    }
  
    const paragraph = document.createElement('p');
    paragraph.textContent = story.content;
    content.appendChild(paragraph);
    
    popupContainer.appendChild(content);
  
    // Media section
    if (story.mediaUrls && story.mediaUrls.length > 0) {
      const mediaContainer = document.createElement('div');
      mediaContainer.className = 'story-media';
  
      story.mediaUrls.forEach(url => {
        if (url.startsWith('data:image/')) {
          const imgContainer = document.createElement('div');
          imgContainer.className = 'relative';
          
          const img = document.createElement('img');
          img.src = url;
          img.alt = 'Story media';
          img.className = 'w-full h-auto transition-opacity duration-300 ease-in-out';
          
          // Add loading state
          img.style.opacity = '0';
          const loader = document.createElement('div');
          loader.className = 'absolute inset-0 flex items-center justify-center bg-gray-100';
          loader.innerHTML = `
            <div class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          `;
          
          imgContainer.appendChild(loader);
          imgContainer.appendChild(img);
          
          img.onload = () => {
            img.style.opacity = '1';
            loader.remove();
          };
  
          mediaContainer.appendChild(imgContainer);
        } else if (url.startsWith('data:audio/')) {
          const audioContainer = document.createElement('div');
          audioContainer.className = 'px-4 py-2 bg-gray-50';
          
          const audio = document.createElement('audio');
          audio.controls = true;
          audio.className = 'w-full h-8';
          
          const source = document.createElement('source');
          source.src = url;
          source.type = url.includes('audio/mpeg') ? 'audio/mpeg' : 'audio/wav';
          
          audio.appendChild(source);
          audioContainer.appendChild(audio);
          mediaContainer.appendChild(audioContainer);
        }
      });
  
      popupContainer.appendChild(mediaContainer);
    }
  
    // Add hover effect styles
    const style = document.createElement('style');
    style.textContent = `
      .mapboxgl-popup-content {
        padding: 0 !important;
        overflow: hidden !important;
        max-width: 320px !important;
      }
      
      .mapboxgl-popup-close-button {
        right: 8px !important;
        top: 8px !important;
        color: #666 !important;
        font-size: 16px !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
        z-index: 1 !important;
      }
      
      .mapboxgl-popup-close-button:hover {
        background-color: rgba(0, 0, 0, 0.05) !important;
        color: #333 !important;
      }
      
      .story-media img {
        transition: transform 0.3s ease;
      }
      
      .story-media img:hover {
        transform: scale(1.02);
      }
      
      audio::-webkit-media-controls-panel {
        background-color: #f8f9fa;
      }
      
      audio::-webkit-media-controls-play-button {
        background-color: #4f46e5;
        border-radius: 50%;
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
    
    return 'a poucos momentos atrás';
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
  
      setStories(data);
  
      Object.values(storyMarkers.current).forEach((marker) => marker.remove());
      storyMarkers.current = {};
  
      data.forEach((story) => {
        if (!story.latitude || !story.longitude) {
          console.warn('Story missing coordinates:', story.id);
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
        } else {
          markerColor = '#9333EA'; // Default to purple for COLLABORATIVE or other types
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
                  if (localStorage.getItem('user') === 'admin') {
                    router.push('/admin');
                  }
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
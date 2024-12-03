'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MoreVertical, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

mapboxgl.accessToken = 'MAPBOXTOKEN';

const MapPage = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [stories, setStories] = useState([]);
  const [user, setUser] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const router = useRouter();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null);
  const storyMarkers = useRef({});

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (degrees) => {
    return degrees * (Math.PI / 180);
  };

  // Create popup content with DOM elements
  const createPopupContent = (story) => {
    const popupContainer = document.createElement('div');
    popupContainer.className = 'p-2';

    const username = document.createElement('p');
    username.className = 'font-bold mb-2';
    username.textContent = story.user.username;
    popupContainer.appendChild(username);

    const content = document.createElement('p');
    content.className = 'text-sm mb-3';
    content.textContent = story.content;
    popupContainer.appendChild(content);

    const timestamp = document.createElement('p');
    timestamp.className = 'text-xs text-gray-500 mb-2';
    timestamp.textContent = new Date(story.createdAt).toLocaleString();
    popupContainer.appendChild(timestamp);

    if (story.mediaUrls && story.mediaUrls.length > 0) {
      const mediaContainer = document.createElement('div');
      mediaContainer.className = 'story-media mt-2';

      story.mediaUrls.forEach(url => {
        if (url.match(/\.(jpg|jpeg|png|gif)$/i)) {
          const imgContainer = document.createElement('div');
          imgContainer.className = 'mb-2';
          
          const img = document.createElement('img');
          img.src = url;
          img.alt = 'Story media';
          img.className = 'w-full h-auto rounded shadow-sm';
          
          // Add loading indicator
          img.style.opacity = '0';
          img.style.transition = 'opacity 0.3s ease';
          img.onload = () => {
            img.style.opacity = '1';
          };

          imgContainer.appendChild(img);
          mediaContainer.appendChild(imgContainer);
        } else if (url.match(/\.(mp3|wav)$/i)) {
          const audioContainer = document.createElement('div');
          audioContainer.className = 'mb-2';
          
          const audio = document.createElement('audio');
          audio.controls = true;
          audio.className = 'w-full';
          
          const source = document.createElement('source');
          source.src = url;
          source.type = url.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav';
          
          audio.appendChild(source);
          audioContainer.appendChild(audio);
          mediaContainer.appendChild(audioContainer);
        }
      });

      popupContainer.appendChild(mediaContainer);
    }

    return popupContainer;
  };

  // Initialize user data
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Initialize geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setUserLocation({ lng: longitude, lat: latitude });
          setLocationError(null);
        },
        (error) => {
          console.error('Location error:', error);
          setLocationError(error.message);
        },
        { 
          enableHighAccuracy: true,
          maximumAge: 30000,
          timeout: 27000
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser');
    }
  }, []);

  // Initialize and update map
  useEffect(() => {
    if (!mapContainer.current || typeof window === 'undefined') return;
    if (!userLocation && !map.current) return;

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        zoom: 18,
        center: [userLocation.lng, userLocation.lat],
      });

      // Create user marker
      const el = document.createElement('div');
      el.className = 'player-marker';
      el.style.cssText = `
        width: 20px;
        height: 20px;
        background: #4CAF50;
        border-radius: 50%;
        box-shadow: 0 0 0 rgba(76, 175, 80, 0.4);
        animation: pulse 2s infinite;
      `;

      // Add styles
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

      userMarker.current = new mapboxgl.Marker(el);
    }

    if (userLocation) {
      map.current.setCenter([userLocation.lng, userLocation.lat]);
      userMarker.current.setLngLat([userLocation.lng, userLocation.lat]).addTo(map.current);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [userLocation]);

  // Watch user position
  useEffect(() => {
    if (!map.current) return;

    const handlePosition = (position) => {
      const { longitude, latitude } = position.coords;
      setUserLocation({ lng: longitude, lat: latitude });
    };

    const watchId = navigator.geolocation.watchPosition(
      handlePosition,
      (error) => {
        console.error('Location error:', error);
        setLocationError(error.message);
      },
      { 
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 27000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Fetch and update stories
  const fetchAndUpdateStories = useCallback(async () => {
    if (!userLocation || !map.current) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://192.168.15.5:5522/stories/nearby?latitude=${userLocation.lat}&longitude=${userLocation.lng}&radius=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      
      // Log stories data
      console.group('=== Stories Data ===');
      data.forEach((story, index) => {
        console.group(`Story ${index + 1}`);
        console.log('ID:', story.id);
        console.log('Content:', story.content);
        console.log('User:', story.user.username);
        console.log('Location:', {
          latitude: story.latitude,
          longitude: story.longitude
        });
        console.log('Media URLs:', story.mediaUrls);
        console.log('Created At:', new Date(story.createdAt).toLocaleString());
        console.log('Distance from user:', calculateDistance(
          userLocation.lat,
          userLocation.lng,
          story.latitude,
          story.longitude
        ).toFixed(2), 'km');
        console.groupEnd();
      });
      console.log('Total Stories:', data.length);
      console.groupEnd();

      setStories(data);

      // Clear existing markers
      Object.values(storyMarkers.current).forEach(marker => marker.remove());
      storyMarkers.current = {};

      // Add new markers
      data.forEach((story) => {
        if (!story.latitude || !story.longitude) {
          console.warn('Story missing coordinates:', story.id);
          return;
        }

        const el = document.createElement('div');
        el.className = 'story-marker';
        el.style.cssText = `
          width: 15px;
          height: 15px;
          background: #FF5722;
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

        // Add click event to marker
        el.addEventListener('click', () => {
          console.group('Clicked Story Details');
          console.log('Story ID:', story.id);
          console.log('Content:', story.content);
          console.log('Author:', story.user.username);
          console.log('Media:', story.mediaUrls);
          console.log('Location:', {
            latitude: story.latitude,
            longitude: story.longitude
          });
          console.log('Created:', new Date(story.createdAt).toLocaleString());
          console.groupEnd();
        });

        storyMarkers.current[story.id] = marker;
      });
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  }, [userLocation]);

  // Set up story fetching interval
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
    if (map.current && userLocation) {
      map.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 20 });
    }
  };

  return (
    <div className="relative h-screen h-[100dvh]">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {locationError && (
        <Card className="absolute top-4 left-4 right-4 z-20">
          <CardContent className="p-4">
            <p className="text-red-500">Please enable location services to use this app.</p>
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
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      <div className="absolute bottom-safe-area right-4 z-10 flex flex-col gap-4 pb-4">
        <Button
          className="w-full md:w-auto"
          onClick={() => router.push('/story/create')}
        >
          Colecionar névoas
        </Button>

        <Button
          className="w-full md:w-auto"
          onClick={handleCenterMap}
        >
          Center Map
        </Button>
      </div>
    </div>
  );
};

export default MapPage;
'use client';

import React, { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

mapboxgl.accessToken = ''; // Replace with your Mapbox API key

const MapPage = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [stories, setStories] = useState([]);
  const router = useRouter();
  const mapContainer = React.useRef(null);
  const map = React.useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error('Location error:', error),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    if (userLocation && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [userLocation.lng, userLocation.lat],
        zoom: 15,
      });

      // Create custom cloud icon for user location
      const cloudIcon = new mapboxgl.Marker({
        element: document.createElement('div'),
      })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);

      cloudIcon.getElement().style.backgroundImage =
        'url(https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Cloud_icon.svg/1024px-Cloud_icon.svg.png)';
      cloudIcon.getElement().style.backgroundSize = 'contain';
      cloudIcon.getElement().style.width = '30px';
      cloudIcon.getElement().style.height = '30px';

      fetchNearbyStories();
    }
  }, [userLocation]);

  const fetchNearbyStories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5522/stories/nearby?latitude=${userLocation.lat}&longitude=${userLocation.lng}&radius=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setStories(data);

      // Add story markers
      data.forEach((story) => {
        const marker = new mapboxgl.Marker({ color: 'red' })
          .setLngLat([story.longitude, story.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div>
                <p><strong>${story.user.username}</strong></p>
                <p>${story.content}</p>
              </div>`
            )
          )
          .addTo(map.current);

        marker.getElement().addEventListener('click', () => {
          router.push(`/story/${story.id}`);
        });
      });
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  return (
    <div className="relative h-screen">
      <div ref={mapContainer} className="absolute inset-0" />
      <Button
        className="absolute bottom-4 right-4 z-10"
        onClick={() => router.push('/story/create')}
      >
        Create Story
      </Button>
    </div>
  );
};

export default MapPage;
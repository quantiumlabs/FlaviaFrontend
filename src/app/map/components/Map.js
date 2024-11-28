import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Corrigir os ícones padrão do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const Map = ({ center, stories, onStoryClick }) => {
  useEffect(() => {
    if (!center) {
      console.error('Map center is not defined.');
    }
  }, [center]);

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      whenCreated={(mapInstance) => {
        mapInstance.invalidateSize();
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {stories.map((story) => (
        <Marker
          key={story.id}
          position={[story.latitude, story.longitude]}
          eventHandlers={{ click: () => onStoryClick(story.id) }}
        >
          <Popup>
            <div>
              <p className="font-bold">{story.user.username}</p>
              <p className="truncate">{story.content}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;
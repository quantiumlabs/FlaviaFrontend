'use client';
import { createContext, useContext } from 'react';
import L from 'leaflet';
import { MapContainer as LeafletMapContainer, TileLayer } from 'react-leaflet';

// Create context for map instance
export const MapContext = createContext(null);

// Main map component that wraps react-leaflet's MapContainer
const MapContainer = ({ children, className, ...props }) => {
  return (
    <LeafletMapContainer
      {...props}
      className={className}
      style={{ height: '100%', width: '100%' }}
    >
      {typeof children === 'function' ? (
        children({
          TileLayer,
          MapContext,
          L
        })
      ) : (
        children
      )}
    </LeafletMapContainer>
  );
};

// Export named components
export { MapContainer };

// Default export
export default MapContainer;


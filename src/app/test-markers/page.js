'use client';

import React, { useState } from 'react';

export default function TestMarkersPage() {
  const [clicked, setClicked] = useState(null);

  const markerTypes = [
    { type: 'PERSONAL', color: '#FF5722', label: 'História Pessoal' },
    { type: 'OBJECT', color: '#9B4DCA', label: 'Céus nas Mãos' },
    { type: 'COLLABORATIVE', color: '#3B82F6', label: 'Céus Cruzados' },
    { type: 'OTHER', color: '#9333EA', label: 'Outro' }
  ];

  const overlappingMarkers = [
    { type: 'PERSONAL', color: '#FF5722', label: 'História Pessoal (1)' },
    { type: 'OBJECT', color: '#9B4DCA', label: 'Céus nas Mãos (2)' },
    { type: 'COLLABORATIVE', color: '#3B82F6', label: 'Céus Cruzados (3)' },
    { type: 'PERSONAL', color: '#FF5722', label: 'História Pessoal (4)' },
    { type: 'OTHER', color: '#9333EA', label: 'Outro (5)' }
  ];

  return (
    <div className="p-8 h-[100dvh] overflow-y-auto bg-gray-100 flex flex-col items-center">
      <style>{`
        .story-marker {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .story-marker:hover {
          transform: scale(1.1) translateY(-4px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.4) !important;
          z-index: 10;
        }
        .story-marker:active {
          transform: scale(0.95);
        }
      `}</style>

      <h1 className="text-2xl font-bold mb-8 text-gray-800 mt-10">Teste Visual dos Marcadores</h1>

      <div className="flex gap-8 flex-wrap justify-center max-w-4xl w-full mb-12">
        <div className="w-full text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">1. Marcadores Individuais</h2>
        </div>
        {markerTypes.map((marker) => (
          <div key={marker.type} className="flex flex-col items-center gap-4 p-6 bg-white rounded-xl shadow-sm border border-gray-200 w-48">
            <div 
              className="story-marker"
              onClick={() => setClicked(marker.label)}
              style={{
                width: '36px',
                height: '36px',
                background: marker.color,
                borderRadius: '50%',
                border: '3px solid white',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ width: '12px', height: '12px', background: 'white', borderRadius: '50%', opacity: 0.9 }}></div>
            </div>
            <span className="font-medium text-gray-700 text-center">{marker.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center max-w-4xl w-full mb-8">
        <h2 className="text-xl font-semibold mb-2 text-gray-700">2. Marcadores Sobrepostos (No mesmo lugar)</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-md text-center">
          Quando múltiplos marcadores são criados nas mesmas coordenadas exatas, o sistema os afasta formando uma pequena flor/círculo para que todos fiquem clicáveis.
        </p>

        <div className="relative bg-white rounded-xl shadow-sm border border-gray-200" style={{ width: '300px', height: '300px' }}>
          {/* Ponto central (para referência de onde eles estariam originalmente) */}
          <div 
            className="absolute bg-gray-300 rounded-full" 
            style={{ width: '6px', height: '6px', left: 'calc(50% - 3px)', top: 'calc(50% - 3px)', zIndex: 0 }}
            title="Coordenada original exata"
          ></div>

          {overlappingMarkers.map((marker, index) => {
            const count = overlappingMarkers.length;
            const radius = 35; // px (similar ao offset no mapa)
            const angle = (index / count) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <div 
                key={index}
                className="story-marker absolute"
                onClick={() => setClicked(marker.label)}
                style={{
                  width: '36px',
                  height: '36px',
                  background: marker.color,
                  borderRadius: '50%',
                  border: '3px solid white',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  left: `calc(50% - 18px + ${x}px)`,
                  top: `calc(50% - 18px + ${y}px)`
                }}
              >
                <div style={{ width: '12px', height: '12px', background: 'white', borderRadius: '50%', opacity: 0.9 }}></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center max-w-4xl w-full mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">3. Formato de Pino (Pin Clássico)</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-md text-center">
          Alternativa usando o formato tradicional de "gota" dos mapas, utilizando SVG.
        </p>
        <div className="flex gap-8 flex-wrap justify-center w-full">
          {markerTypes.map((marker) => (
            <div key={marker.type} className="flex flex-col items-center gap-4 p-6 bg-white rounded-xl shadow-sm border border-gray-200 w-48">
              <div 
                className="story-marker"
                onClick={() => setClicked(marker.label + ' (Pino)')}
                style={{
                  width: '40px',
                  height: '40px',
                  color: marker.color,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.4))'
                }}
              >
                {/* SVG do Pino de Mapa */}
                <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <span className="font-medium text-gray-700 text-center">{marker.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 h-12">
        {clicked && (
          <p className="text-lg text-green-600 font-semibold animate-pulse">
            Você clicou no marcador: {clicked}!
          </p>
        )}
      </div>

    </div>
  );
}

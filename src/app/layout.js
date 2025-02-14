import { Inter } from 'next/font/google';
import './globals.css';
import dynamic from 'next/dynamic';

const inter = Inter({ subsets: ['latin'] });

// Dynamic import for Mapbox CSS
if (typeof window !== 'undefined') {
  require('mapbox-gl/dist/mapbox-gl.css');
}

export const metadata = {
  title: 'Céus',
  description: 'Compartilhe histórias pelo mundo',
  manifest: '/manifest.json',
  themeColor: '#ff6b4a',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover',
  appleWebApp: {
    capable: true,
    title: 'Céus',
    statusBarStyle: 'black-translucent'
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Céus',
    'mobile-web-app-capable': 'yes',
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Single Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/app-icon.png" />
        <body className={inter.className}>{children}</body>
      </head>
    </html>
  );
}
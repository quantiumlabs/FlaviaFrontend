
import { Inter } from 'next/font/google';
import './globals.css';
import dynamic from 'next/dynamic';

const inter = Inter({ subsets: ['latin'] });

// Dynamic import for Mapbox CSS
if (typeof window !== 'undefined') {
  require('mapbox-gl/dist/mapbox-gl.css');
}

export const metadata = {
  title: 'Cloud',
  description: 'Share stories based on your location',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
// src/app/page.js
import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to auth page if not logged in, or map if logged in
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (!token) {
      redirect('/auth');
    } else {
      redirect('/map');
    }
  }
  
  // Return empty div for server-side rendering
  return <div></div>;
}


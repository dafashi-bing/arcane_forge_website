'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewestPitchPage() {
  const router = useRouter();

  useEffect(() => {
    const fetchNewestPitch = async () => {
      try {
        const response = await fetch('/api/pitches/newest');
        const data = await response.json();
        if (data.pathname) {
          router.push(`/pitch/${encodeURIComponent(data.pathname)}`);
        } else {
          router.push('/pitches');
        }
      } catch (error) {
        console.error('Error fetching newest pitch:', error);
        router.push('/pitches');
      }
    };

    fetchNewestPitch();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  );
} 
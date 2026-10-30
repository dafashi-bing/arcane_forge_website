'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function PitchPage() {
  const router = useRouter();
  const { pathname } = useParams<{ pathname: string }>();

  useEffect(() => {
    const fetchPitch = async () => {
      try {
        const response = await fetch(`/api/pitches/${encodeURIComponent(pathname)}`);
        const data = await response.json();
        if (data.url) {
          // Redirect to the file's public URL
          window.location.href = data.url;
        } else {
          router.push('/pitches');
        }
      } catch (error) {
        console.error('Error fetching pitch:', error);
        router.push('/pitches');
      }
    };

    fetchPitch();
  }, [pathname, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  );
} 
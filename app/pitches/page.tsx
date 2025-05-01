'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PitchFile {
  url: string;
  pathname: string;
  uploadedAt: Date;
}

export default function PitchesPage() {
  const [files, setFiles] = useState<PitchFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPitches = async () => {
      try {
        const response = await fetch('/api/pitches');
        const data = await response.json();
        setFiles(data.files);
      } catch (error) {
        console.error('Error fetching pitches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPitches();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Pitch Documents</h1>
      <div className="grid gap-4">
        {files.map((file) => {
          // Remove the 'pitches/' prefix from the pathname
          const displayName = file.pathname.replace('pitches/', '');
          return (
            <div
              key={file.pathname}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Link href={`/pitch/${encodeURIComponent(displayName)}`} className="block">
                <h2 className="text-xl font-semibold mb-2">
                  {displayName}
                </h2>
                <p className="text-gray-600">
                  Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
                </p>
              </Link>
            </div>
          );
        })}
        {files.length === 0 && (
          <p className="text-gray-600">No pitch documents available.</p>
        )}
      </div>
    </div>
  );
} 
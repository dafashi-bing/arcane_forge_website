import { list } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { blobs } = await list({
      prefix: 'pitches/',
    });

    if (blobs.length === 0) {
      return NextResponse.json({ pathname: null });
    }

    // Sort by uploadedAt in memory since the API doesn't support sorting
    const newestBlob = blobs.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )[0];

    // Remove the 'pitches/' prefix from the pathname
    const pathname = newestBlob.pathname.replace('pitches/', '');

    return NextResponse.json({
      pathname,
      url: newestBlob.url,
    });
  } catch (error) {
    console.error('Error getting newest pitch:', error);
    return NextResponse.json(
      { error: 'Failed to get newest pitch' },
      { status: 500 }
    );
  }
} 
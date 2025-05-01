import { list } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { pathname: string } }
) {
  try {
    const { blobs } = await list({
      prefix: `pitches/${decodeURIComponent(params.pathname)}`,
      limit: 1,
    });

    if (blobs.length === 0) {
      return NextResponse.json(
        { error: 'Pitch not found' },
        { status: 404 }
      );
    }

    // Remove the 'pitches/' prefix from the pathname
    const pathname = blobs[0].pathname.replace('pitches/', '');

    return NextResponse.json({
      url: blobs[0].url,
      pathname,
    });
  } catch (error) {
    console.error('Error getting pitch:', error);
    return NextResponse.json(
      { error: 'Failed to get pitch' },
      { status: 500 }
    );
  }
} 
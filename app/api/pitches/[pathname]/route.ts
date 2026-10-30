import { list } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pathname: string }> }
) {
  try {
    const { pathname: requestedPathname } = await params;
    const { blobs } = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      prefix: `pitches/${decodeURIComponent(requestedPathname)}`,
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

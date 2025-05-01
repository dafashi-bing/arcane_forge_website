import { list } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { blobs } = await list({
      prefix: 'pitches/',
    });

    const files = blobs.map((blob) => ({
      url: blob.url,
      pathname: blob.pathname,
      uploadedAt: blob.uploadedAt,
    }));

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error listing pitches:', error);
    return NextResponse.json(
      { error: 'Failed to list pitches' },
      { status: 500 }
    );
  }
} 
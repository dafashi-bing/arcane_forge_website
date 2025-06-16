import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { CreateGameRequest } from '@/types';
import { generateSlug } from '@/lib/utils';

// Helper function to check admin authentication
function checkAdminAuth(request: NextRequest): boolean {
  const adminToken = process.env.ADMIN_API_TOKEN;
  if (!adminToken) {
    console.error('ADMIN_API_TOKEN not configured');
    return false;
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  return token === adminToken;
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    if (!checkAdminAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all games with their stats
    const { data: games, error: gamesError } = await supabaseService
      .from('games')
      .select(`
        *,
        stats (*)
      `)
      .order('created_at', { ascending: false });

    if (gamesError) {
      console.error('Failed to fetch games:', gamesError);
      return NextResponse.json(
        { error: 'Failed to fetch games' },
        { status: 500 }
      );
    }

    return NextResponse.json({ games: games || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    if (!checkAdminAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateGameRequest = await request.json();

    // Validate required fields
    if (!body.title?.trim() || !body.description?.trim() || !body.icon_url?.trim() || !body.screenshot_url?.trim() || !body.game_url?.trim()) {
      return NextResponse.json(
        { error: 'Title, description, icon URL, screenshot URL, and game URL are required' },
        { status: 400 }
      );
    }

    // Generate slug from title if not provided, or use provided slug
    const slug = body.slug?.trim() || generateSlug(body.title);

    // Validate slug
    if (!slug) {
      return NextResponse.json(
        { error: 'Invalid title for slug generation' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const { data: existingGame } = await supabaseService
      .from('games')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (existingGame) {
      return NextResponse.json(
        { error: 'A game with this slug already exists' },
        { status: 400 }
      );
    }

    // Insert the game
    const { data: game, error: insertError } = await supabaseService
      .from('games')
      .insert({
        slug,
        title: body.title.trim(),
        description: body.description.trim(),
        icon_url: body.icon_url.trim(),
        screenshot_url: body.screenshot_url.trim(),
        game_url: body.game_url.trim(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert game:', insertError);
      return NextResponse.json(
        { error: 'Failed to create game' },
        { status: 500 }
      );
    }

    // Create initial stats for the game
    const { error: statsError } = await supabaseService
      .from('stats')
      .insert({
        game_slug: slug,
        plays: 0,
        likes: 0,
        dislikes: 0,
      });

    if (statsError) {
      console.error('Failed to create initial stats:', statsError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ game }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
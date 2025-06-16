import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // Fetch existing stats or create if not exists
    let { data: existingStats, error: fetchError } = await supabaseService
      .from('stats')
      .select('*')
      .eq('game_slug', slug)
      .single();

    if (fetchError || !existingStats) {
      // Create initial stats
      const { data: newStats, error: createError } = await supabaseService
        .from('stats')
        .insert({
          game_slug: slug,
          plays: 0,
          likes: 1,
          dislikes: 0,
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create stats:', createError);
        return NextResponse.json(
          { error: 'Failed to record like' },
          { status: 500 }
        );
      }

      return NextResponse.json({ stats: newStats });
    }

    // Update existing stats
    const { data: updatedStats, error: updateError } = await supabaseService
      .from('stats')
      .update({ likes: existingStats.likes + 1 })
      .eq('game_slug', slug)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update like count:', updateError);
      return NextResponse.json(
        { error: 'Failed to record like' },
        { status: 500 }
      );
    }

    return NextResponse.json({ stats: updatedStats });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
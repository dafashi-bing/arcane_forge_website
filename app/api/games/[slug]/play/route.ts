import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // Update or create stats
    const { data: stats, error } = await supabaseService
      .from('stats')
      .upsert({
        game_slug: slug,
        plays: 1,
        likes: 0,
        dislikes: 0,
      }, {
        onConflict: 'game_slug',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      // If upsert fails, try to increment existing record
      const { data: existingStats, error: fetchError } = await supabaseService
        .from('stats')
        .select('plays')
        .eq('game_slug', slug)
        .single();

      if (!fetchError && existingStats) {
        const { data: updatedStats, error: updateError } = await supabaseService
          .from('stats')
          .update({ plays: existingStats.plays + 1 })
          .eq('game_slug', slug)
          .select()
          .single();

        if (updateError) {
          console.error('Failed to update play count:', updateError);
          return NextResponse.json(
            { error: 'Failed to record play' },
            { status: 500 }
          );
        }

        return NextResponse.json({ stats: updatedStats });
      }

      console.error('Failed to record play:', error);
      return NextResponse.json(
        { error: 'Failed to record play' },
        { status: 500 }
      );
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
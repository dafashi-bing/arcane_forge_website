import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { CreateCommentRequest } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: comments, error } = await supabaseService
      .from('comments')
      .select('*')
      .eq('game_slug', slug)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ comments: comments || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body: CreateCommentRequest = await request.json();

    // Validate required fields
    if (!body.name?.trim() || !body.text?.trim()) {
      return NextResponse.json(
        { error: 'Name and text are required' },
        { status: 400 }
      );
    }

    // Validate name length
    if (body.name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Name must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Validate text length
    if (body.text.trim().length > 2000) {
      return NextResponse.json(
        { error: 'Comment must be 2000 characters or less' },
        { status: 400 }
      );
    }

    // Check if the game exists
    const { data: game, error: gameError } = await supabaseService
      .from('games')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // If parent_id is provided, validate it exists
    if (body.parent_id) {
      const { data: parentComment, error: parentError } = await supabaseService
        .from('comments')
        .select('id')
        .eq('id', body.parent_id)
        .eq('game_slug', slug)
        .single();

      if (parentError || !parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 400 }
        );
      }
    }

    // Insert the comment
    const { data: comment, error: insertError } = await supabaseService
      .from('comments')
      .insert({
        game_slug: slug,
        parent_id: body.parent_id || null,
        name: body.name.trim(),
        text: body.text.trim(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert comment:', insertError);
      return NextResponse.json(
        { error: 'Failed to post comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
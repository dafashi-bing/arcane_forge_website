import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { CreateFeedbackRequest } from '@/types';
import { validateEmail } from '@/lib/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body: CreateFeedbackRequest = await request.json();

    // Validate required fields
    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: 'Feedback message is required' },
        { status: 400 }
      );
    }

    // Validate message length
    if (body.message.trim().length > 5000) {
      return NextResponse.json(
        { error: 'Feedback message must be 5000 characters or less' },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (body.email && !validateEmail(body.email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // If want_notify is true, email must be provided
    if (body.want_notify && !body.email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required if you want to be notified' },
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

    // Insert the feedback
    const { data: feedback, error: insertError } = await supabaseService
      .from('feedback_requests')
      .insert({
        game_slug: slug,
        message: body.message.trim(),
        email: body.email?.trim() || null,
        want_notify: body.want_notify || false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert feedback:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

export async function POST(req: Request) {
  try {
    const { session_id } = await req.json();
    
    if (!session_id) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Retrieve and verify the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Verify the session belongs to the current user
    if (session.client_reference_id !== user.id) {
      return NextResponse.json({ error: 'Session does not belong to this user' }, { status: 403 });
    }

    // Verify payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Return verified session data
    return NextResponse.json({
      valid: true,
      session_id: session.id,
      plan_id: session.metadata?.planId,
      plan_name: session.metadata?.planName,
      payment_status: session.payment_status,
    });
  } catch (error: any) {
    console.error('Session verification error:', error);
    
    // Handle Stripe-specific errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }
    
    return NextResponse.json({ error: error.message || 'Failed to verify session' }, { status: 500 });
  }
}



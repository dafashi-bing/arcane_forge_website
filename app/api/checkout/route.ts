import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

export async function POST(req: Request) {
  try {
    const { planId, planName, stripeProductId } = await req.json();
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!stripeProductId) {
      return NextResponse.json({ error: 'Stripe product ID is required' }, { status: 400 });
    }

    // Fetch the default price for the Stripe product
    // Products can have multiple prices, so we'll get the active recurring monthly price
    const prices = await stripe.prices.list({
      product: stripeProductId,
      active: true,
      type: 'recurring',
    });

    // Find the monthly recurring price (or use the first one if multiple exist)
    const monthlyPrice = prices.data.find(p => p.recurring?.interval === 'month') || prices.data[0];

    if (!monthlyPrice) {
      return NextResponse.json({ 
        error: 'No active monthly price found for this product. Please contact support.' 
      }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: monthlyPrice.id, // Use the pre-created Stripe Price ID
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 14,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}&plan_id=${planId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pricing?canceled=true`,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        planId: planId.toString(),
        planName: planName,
        stripeProductId: stripeProductId,
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


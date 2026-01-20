"use client";

import { useEffect, useState } from "react";
import { FaCheck, FaSpinner } from "react-icons/fa";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { siteConfig } from "@/config/site";

interface Plan {
  id: number;
  name: string;
  display_name: string;
  tier_level: number;
  original_price_monthly: number;
  stripe_product_id: string | null;
  features: Record<string, boolean | string>;
  quota_config: any;
}

export default function Pricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activationStatus, setActivationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch(`${siteConfig.apiHost}/api/v1/subscriptions/plans?active_only=true`);
        const data = await response.json();
        const sortedPlans = (data.plans as Plan[]).sort((a, b) => a.tier_level - b.tier_level);
        setPlans(sortedPlans);
      } catch (error) {
        console.error("Error fetching plans:", error);
      } finally {
        setLoading(false);
      }
    };

    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchUserSubscription(user);
      }
    };

    fetchPlans();
    getUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserSubscription(currentUser);
      } else {
        setUserSubscription(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const fetchUserSubscription = async (currentUser: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${siteConfig.apiHost}/api/v1/subscriptions/me`, {
        headers: {
          "Authorization": `Bearer ${session?.access_token}`,
          "X-User-ID": currentUser.id,
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserSubscription(data);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  // Handle Stripe Success Activation
  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    const planId = searchParams.get('plan_id');

    if (success === 'true' && sessionId && planId && user && activationStatus === 'idle') {
      verifyAndActivate(sessionId, planId);
    }
  }, [searchParams, user, activationStatus]);

  const verifyAndActivate = async (sessionId: string, planId: string) => {
    setActivationStatus('loading');
    try {
      // First, verify the session with Stripe
      const verifyResponse = await fetch('/api/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Failed to verify payment session');
      }

      const verifiedSession = await verifyResponse.json();
      
      // Verify the plan_id matches what was in the session
      if (verifiedSession.plan_id !== planId) {
        throw new Error('Plan ID mismatch. Please contact support.');
      }

      // Now proceed with activation using the verified plan_id
      await handleActivation(planId);
    } catch (err: any) {
      console.error("Verification/Activation error:", err);
      setActivationStatus('error');
      setErrorMessage(err.message || 'Failed to verify payment. Please contact support if you completed payment.');
    }
  };

  const handleActivation = async (planId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${siteConfig.apiHost}/api/v1/subscriptions/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
          "X-User-ID": user.id,
        },
        body: JSON.stringify({
          plan_id: parseInt(planId, 10),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Activation failed. Please contact support if your subscription doesn't appear active.");
      }

      setActivationStatus('success');
      // Refresh subscription data
      fetchUserSubscription(user);
      
      // Clear URL params after 5 seconds
      setTimeout(() => {
        router.replace('/pricing');
      }, 5000);

    } catch (err: any) {
      console.error("Activation error:", err);
      setActivationStatus('error');
      setErrorMessage(err.message);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      router.push(`/login?next=/pricing`);
      return;
    }

    if (plan.name === "Free") {
      window.open(siteConfig.dashboardUrl, "_blank");
      return;
    }

    // Don't allow subscribing if already on this plan or higher
    if (userSubscription && userSubscription.tier_level >= plan.tier_level) {
      alert("You are already on this plan or a higher tier.");
      return;
    }

    // Validate that the plan has a Stripe product ID
    if (!plan.stripe_product_id) {
      alert("This plan is not available for subscription. Please contact support.");
      return;
    }

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          stripeProductId: plan.stripe_product_id,
        }),
      });

      const { url, error } = await response.json();
      if (error) {
        alert(error);
        return;
      }
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Failed to initiate checkout. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Trial & Coupon Banner */}
      <div className="mb-8 space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 text-center">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
            🎉 Start with a 14-Day Free Trial
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Try any paid plan risk-free for 14 days.
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-1">
                🎁 Limited Time Offer: 50% Off for 3 Months
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Use coupon code at checkout to get 50% off your first 3 months
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-6 py-3 rounded-xl border-2 border-amber-300 dark:border-amber-700 shadow-lg">
              <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">Code:</span>
              <code className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-wider">AF2026BETA</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('AF2026BETA');
                  alert('Coupon code copied to clipboard!');
                }}
                className="ml-2 px-3 py-1 text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activation Status Banner */}
      {activationStatus !== 'idle' && (
        <div className={`mb-12 p-6 rounded-2xl border text-center animate-in fade-in slide-in-from-top-4 duration-500 ${
          activationStatus === 'loading' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' :
          activationStatus === 'success' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' :
          'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
        }`}>
          {activationStatus === 'loading' && (
            <div className="flex items-center justify-center gap-3">
              <FaSpinner className="animate-spin" />
              <span className="font-semibold">Confirming your subscription with the forge...</span>
            </div>
          )}
          {activationStatus === 'success' && (
            <div>
              <h4 className="text-lg font-bold mb-1">Success! Your account has been upgraded.</h4>
              <p className="text-sm opacity-80">Welcome to the next level of game development. This message will disappear in a few seconds.</p>
            </div>
          )}
          {activationStatus === 'error' && (
            <div>
              <h4 className="text-lg font-bold mb-1">Activation encountered an issue</h4>
              <p className="text-sm opacity-80">{errorMessage || "Please contact support if your subscription doesn't appear active."}</p>
            </div>
          )}
        </div>
      )}

      {/* User Current Plan Info */}
      {userSubscription && (
        <div className="mb-12 text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 inline-block mx-auto">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Currently on <span className="font-bold text-blue-600 dark:text-blue-400">{userSubscription.plan_display_name}</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrentPlan = userSubscription?.plan_id === plan.id;
          const isDowngrade = userSubscription && userSubscription.tier_level > plan.tier_level;

          return (
            <div 
              key={plan.id}
              className={`relative p-8 rounded-3xl border transition-all duration-300 flex flex-col ${
                plan.name === "Pro" 
                  ? "bg-blue-600 border-blue-500 text-white shadow-2xl shadow-blue-500/20 md:scale-105 z-10" 
                  : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white hover:border-blue-500/50"
              }`}
            >
              {plan.name === "Pro" && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-blue-600 px-4 py-1 rounded-full text-sm font-bold shadow-md">
                  Best Value
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.display_name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${plan.original_price_monthly}</span>
                  <span className={`${plan.name === "Pro" ? "text-blue-100" : "text-gray-500"} text-sm`}>/month</span>
                </div>
                {plan.name !== "Free" && (
                  <p className={`mt-2 text-sm ${plan.name === "Pro" ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
                    Start with 14-day free trial
                  </p>
                )}
              </div>

              <ul className="space-y-4 mb-12 flex-grow">
                {Object.entries(plan.features).map(([key, value], idx) => (
                  value && (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      <FaCheck className={`mt-1 shrink-0 ${plan.name === "Pro" ? "text-blue-200" : "text-blue-500"}`} />
                      <span className="capitalize">
                        {key.split('_').join(' ')}
                        {typeof value === 'string' ? `: ${value}` : ''}
                      </span>
                    </li>
                  )
                ))}
                
                {(plan.quota_config?.monthly || plan.quota_config?.daily) && (
                  <>
                    <li className="pt-4 border-t border-current opacity-20">
                      <span className="text-xs font-semibold uppercase tracking-wider">Usage Quotas</span>
                    </li>
                    {Object.entries(plan.quota_config.monthly || plan.quota_config.daily || {}).map(([key, value]: [string, any], idx) => (
                      <li key={`quota-${idx}`} className="flex items-start gap-3 text-sm opacity-80">
                          <FaCheck className={`mt-1 shrink-0 ${plan.name === "Pro" ? "text-blue-200" : "text-blue-500"}`} />
                          <span className="capitalize">{value} {key.split('_').join(' ')}</span>
                      </li>
                    ))}
                  </>
                )}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={isCurrentPlan || isDowngrade}
                className={`w-full py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  plan.name === "Pro"
                    ? "bg-white text-blue-600 hover:bg-gray-100 shadow-lg"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                }`}
              >
                {isCurrentPlan ? "Current Plan" : 
                 isDowngrade ? "Included" :
                 plan.name === "Free" ? "Open Dashboard" : "Get Started"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}


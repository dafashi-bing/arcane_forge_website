"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function IdeCompletePage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const extCallback = searchParams.get("ext_callback");
  const state = searchParams.get("state");

  useEffect(() => {
    let isCancelled = false;

    const completeIdeSignIn = async () => {
      if (!extCallback) {
        if (!isCancelled) {
          setError("Missing IDE callback URL. Please start sign-in from VS Code again.");
        }
        return;
      }

      if (!state) {
        if (!isCancelled) {
          setError("Missing sign-in state. Please start sign-in from VS Code again.");
        }
        return;
      }

      let callbackUrl: URL;
      try {
        callbackUrl = new URL(extCallback);
      } catch {
        if (!isCancelled) {
          setError("The IDE callback URL is invalid. Please retry sign-in from VS Code.");
        }
        return;
      }

      const supabase = createClient();
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        if (!isCancelled) {
          setError("Unable to read your sign-in session. Please try again.");
        }
        return;
      }

      const session = data.session;
      if (!session?.access_token) {
        if (!isCancelled) {
          setError("No active sign-in session was found. Please sign in again.");
        }
        return;
      }

      callbackUrl.searchParams.set("access_token", session.access_token);
      if (session.refresh_token) {
        callbackUrl.searchParams.set("refresh_token", session.refresh_token);
      }
      callbackUrl.searchParams.set("state", state);

      window.location.assign(callbackUrl.toString());
    };

    completeIdeSignIn();

    return () => {
      isCancelled = true;
    };
  }, [extCallback, state]);

  return (
    <main className="min-h-screen bg-white dark:bg-black px-4 flex items-center justify-center">
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-6 shadow-xl"
        aria-live="polite"
      >
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {error ? "Unable to complete IDE sign-in" : "Completing IDE sign-in..."}
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {error ?? "You can close this tab after the IDE opens."}
        </p>
      </div>
    </main>
  );
}

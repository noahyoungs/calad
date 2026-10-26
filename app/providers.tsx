// app/providers.tsx
"use client";
import { useRouter } from "next/navigation";

import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Explicitly expose PostHog to window in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).posthog = posthog;
  
  // Helper for feature flag testing
  (window as any).testFeatureFlag = (flagName: string, variant: string) => {
    if ((window as any).posthog) {
      (window as any).posthog.featureFlags.override({[flagName]: variant});
      console.log(`✅ Feature flag "${flagName}" set to "${variant}"`);
      return true;
    } else {
      console.error("❌ PostHog not loaded yet. Try again in a moment.");
      return false;
    }
  };
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthogClient = usePostHog();

  useEffect(() => {
    if (pathname && posthogClient) {
      let url = window.origin + pathname;
      const search = searchParams.toString();
      if (search) {
        url += "?" + search;
      }
      posthogClient.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, posthogClient]);

  return null;
}

function SuspendedPostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  );
}

// Public closure and legal pages do not initialize authentication or analytics.
export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  if (!pathname.startsWith("/app/")) {
    return (
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <HeroUIProvider navigate={router.push}>
          <ToastProvider />
          {children}
        </HeroUIProvider>
      </NextThemesProvider>
    );
  }
  return <AppProviders>{children}</AppProviders>;
}

function AppProviders({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const initPostHog = async () => {

      // Trim the API key to remove any whitespace or newline characters
      const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
      
      if (!posthogKey) {
        console.error("PostHog API key is missing or invalid");
        return;
      }

      posthog.init(posthogKey, {
        api_host: "/ingest", // Use the ingest proxy
        ui_host: "https://us.posthog.com", // Your PostHog app host
        capture_pageview: false, // We capture pageviews manually
        capture_pageleave: true, // Enable pageleave capture
        debug: false, // DO NOT ENABLE IN PRODUCTION
        loaded: function(ph) {
          // Expose PostHog to window for debugging/testing in development
          if (process.env.NODE_ENV === 'development') {
            (window as any).posthog = ph;
            console.log("PostHog instance assigned to window.posthog for development testing.");
            
            // Log all active feature flags for debugging
            const flags = ph.featureFlags.getFlags();
            console.log("Active feature flags:", flags);
          }

        }
      });
    };

    initPostHog();
  }, []);

  // Only in development, add a debug component
  const DebugFeatureFlags = process.env.NODE_ENV === 'development' 
    ? () => {
        const posthogClient = usePostHog();
        const [flags, setFlags] = useState<Record<string, any>>({});
        
        useEffect(() => {
          if (posthogClient) {
            const handleFlagsUpdate = (_flagKeys: string[], flagVariants: Record<string, string | boolean>) => {
              setFlags(flagVariants || {});
            };

            // Initial fetch of flags
            const initialVariants = posthogClient.featureFlags.getFlagVariants();
            setFlags(initialVariants || {});

            // Subscribe to feature flag updates
            posthogClient.onFeatureFlags(handleFlagsUpdate);

            // PostHog's onFeatureFlags doesn't provide a direct way to unsubscribe a specific callback.
            // For a debug component that typically persists for the app's lifetime,
            // this is generally acceptable. If unsubscription becomes necessary,
            // a more complex pattern or a change in how PostHog manages listeners would be needed.
            // No explicit cleanup function is returned here as there's no simple "off" method.
          }
        }, [posthogClient]);
        
        return (
          <div style={{ 
            position: 'fixed', 
            bottom: '10px', 
            right: '10px', 
            background: 'rgba(0,0,0,0.8)', 
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 9999,
            maxWidth: '300px',
            display: Object.keys(flags).length ? 'block' : 'none'
          }}>
            <div><strong>Feature Flags:</strong></div>
            {Object.entries(flags).map(([name, value]) => (
              <div key={name}>{name}: {String(value)}</div>
            ))}
          </div>
        );
      }
    : () => null;

  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <HeroUIProvider navigate={router.push}>
          <ToastProvider />
          {children}
          <DebugFeatureFlags />
        </HeroUIProvider>
      </NextThemesProvider>
    </PHProvider>
  );
}

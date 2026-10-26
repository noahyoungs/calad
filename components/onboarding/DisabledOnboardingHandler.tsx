"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { createClientSideClient } from "@/utils/supabase/client";
import { completeOnboarding } from "@/actions/actions";
import { addAuthEmailDuringOnboarding } from "@/actions/onboarding-actions";

interface DisabledOnboardingHandlerProps {
  userId: string;
  firstName: string | null | undefined;
  email: string | null | undefined;
}

export default function DisabledOnboardingHandler({ 
  userId, 
  firstName,
  email
}: DisabledOnboardingHandlerProps) {
  const router = useRouter();

  useEffect(() => {
    const autoCompleteOnboarding = async () => {
      try {
        const supabase = createClientSideClient();
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Save default user data
        const { error: userUpdateError } = await supabase
          .from("users")
          .update({
            name: firstName || "User",
            timezone: browserTimezone,
            custom_instructions: null, // No rules
            updated_at: new Date().toISOString()
          })
          .eq("id", userId);

        if (userUpdateError) {
          console.error("Error saving default user data:", userUpdateError);
          // Continue anyway, don't block the flow
        }

        // Add user's auth email if it exists
        if (email && firstName) {
          const emailResult = await addAuthEmailDuringOnboarding(userId, email, firstName);
          if (!emailResult.success) {
            console.warn("Failed to add user auth email:", emailResult.error);
            // Continue anyway, don't block the flow
          }
        }

        // Complete onboarding
        const result = await completeOnboarding();
        if (!result.success) {
          console.error("Failed to complete onboarding:", result.error);
          // Continue anyway, redirect to chat
        }

        // Fire Twitter conversion tracking for completed signup
        if (typeof window !== 'undefined' && window.twq) {
          try {
            window.twq('event', 'tw-q8a3p-q8a3r', {
              status: 'completed'
            });
            console.log("Twitter conversion tracking fired for signup completion");
          } catch (error) {
            console.error("Error firing Twitter conversion tracking:", error);
          }
        }

        // Redirect to chat
        router.push("/app/chat");
      } catch (error) {
        console.error("Error in disabled onboarding flow:", error);
        // If anything fails, redirect to chat anyway (fail open)
        router.push("/app/chat");
      }
    };

    autoCompleteOnboarding();
  }, [userId, firstName, email, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Spinner 
          size="lg" 
          color="primary" 
          label="Setting up your account..." 
        />
      </div>
    </div>
  );
}
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserOnboardingStatus } from "../../../actions/actions";
import OnboardingContainer from "../../../components/ai-onboarding/OnboardingContainer";
import { DISABLE_ONBOARDING } from "@/utils/config";
import DisabledOnboardingHandler from "@/components/onboarding/DisabledOnboardingHandler";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // get the user's first name
  const firstName = user?.user_metadata?.full_name?.split(" ")[0];

  // If user is not authenticated, redirect to sign-in
  if (!user) {
    return redirect("/sign-in");
  }
  
  // If onboarding is disabled, use client component to handle browser timezone
  if (DISABLE_ONBOARDING) {
    return (
      <DisabledOnboardingHandler 
        userId={user.id}
        firstName={firstName}
        email={user.email}
      />
    );
  }
  
  // Check onboarding status
  const response = await getUserOnboardingStatus();
  
  // If there was an error, redirect to chat (fail open)
  if (!response.success) {
    console.error("Failed to get onboarding status:", response.error);
    return redirect("/app/chat");
  }
  
  // If user has already completed onboarding, redirect to chat
  if (response.data) {
    return redirect("/app/chat");
  }
  
  return (
    <div className="min-h-[100dvh] w-full overflow-hidden">
      <OnboardingContainer firstName={firstName} />
    </div>
  );
} 
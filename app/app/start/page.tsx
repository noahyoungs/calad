import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is not authenticated, redirect to sign-in
  if (!user) {
    return redirect("/sign-in");
  }

  // First check if the user record exists
  const { data: userRecord, error: userError } = await supabase
    .from('users')
    .select('id, onboarding_completed')
    .eq('id', user.id)
    .single();

  console.log("User record check:", { userRecord, userError });
  
  if (userError) {
    if (userError.code === 'PGRST116') {
      console.log("User record not found, redirecting to onboarding");
      return redirect("/app/onboarding");
    }
    throw userError;
  }
  
  // Check if user has completed onboarding
  const onboardingStatus = userRecord.onboarding_completed;
  console.log("Onboarding status:", onboardingStatus);
  
  // If user hasn't completed onboarding, redirect to onboarding
  if (!onboardingStatus) {
    return redirect("/app/onboarding");
  }
  
  // If user is authenticated and has completed onboarding, redirect to chat area
  return redirect("/app/chat");
}

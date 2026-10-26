import { redirect } from "next/navigation";
import { getUserConversations } from "@/actions/chat-store-actions";
import Chat from "@/components/chat";
import { fetchUserSettings } from "@/actions/settings-actions";
import { isProUser } from "@/utils/subscription-utils";
import { createClient } from "@/utils/supabase/server";

// Define the props interface to match Next.js's expected PageProps
interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    isNewChat?: string;
    prompt?: string;
  }>;
}

export default async function ConversationPage({ params, searchParams }: PageProps) {
  // Get user's conversations
  const conversationsResult = await getUserConversations();
  
  if (!conversationsResult.success || !conversationsResult.data) {
    console.error("Failed to fetch conversations:", conversationsResult.error);
    return redirect("/app/chat");
  }

  // Get the conversation ID from params
  const { id } = await params;
  
  // Check if the conversation exists in the user's conversations
  // If not, RLS has already determined the user doesn't have access or it doesn't exist
  if (!conversationsResult.data.some(conv => conv.id === id)) {
    return redirect("/app/chat");
  }

  // If this is a new chat, we'll handle the prompt from URL params
  const { isNewChat: isNewChatParam, prompt } = await searchParams;
  const isNewChat = isNewChatParam === 'true';
  const initialPrompt = prompt ? decodeURIComponent(prompt) : undefined;

  // Fetch user settings
  const settingsResult = await fetchUserSettings();
  if (!settingsResult.success) {
    console.error("Failed to fetch user settings:", settingsResult.error);
    return redirect("/app/chat");
  }

  // Get the user ID from auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Check if user has plus features
  const isPro = await isProUser(user?.id || "");

  return (
    <Chat 
      conversationId={id}
      isNewChat={isNewChat}
      initialPrompt={initialPrompt}
      userName={settingsResult.data?.name || "User"}
      defaultTimeZone={settingsResult.data?.timezone || "UTC"}
      userRules={settingsResult.data?.custom_instructions || ""}
      enableAdvancedCalendarFeatures={isPro}
    />
  );
}

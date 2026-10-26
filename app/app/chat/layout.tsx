import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { getUserConversations } from "@/actions/chat-store-actions";
import ClientChatLayout from "@/components/client-chat-layout";

export default async function ChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get user's conversations
  const result = await getUserConversations();
  
  if (!result.success) {
    console.error("Failed to fetch conversations:", result.error);
    return redirect("/sign-in");
  }

  return (
    <ClientChatLayout
      userId={user.id}
      userEmail={user.email}
      initialConversations={result.data || []}
    >
      {children}
    </ClientChatLayout>
  );
} 

import NewChatPrompt from '@/components/new-chat-prompt';
import { fetchUserName } from "@/actions/settings-actions";

export default async function ChatPage() {

  const userName = await fetchUserName();

  if (!userName.success) {
    return <div>Error loading user name</div>;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-full">
        <NewChatPrompt userName={userName.data || null} />
      </div>
    </div>
  );
} 
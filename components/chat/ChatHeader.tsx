import { useChatContext } from '@/contexts/chat-context';

export default function ChatHeader() {
  const { activeConversationTitle, sidebarOpen } = useChatContext();
  
  return (
    <div className={`transition-all duration-300 ease-in-out ${!sidebarOpen ? 'ml-[72px]' : ''} -mt-0.5`}>
      <h2 className="text-foreground m-0">{activeConversationTitle}</h2>
    </div>
  );
}

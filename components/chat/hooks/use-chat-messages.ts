import { useState, useEffect, useRef, useMemo } from 'react';
import { generateSystemPrompt } from '@/utils/system-prompt';
import { loadChat } from '@/actions/chat-store-actions';
import { addToast } from '@heroui/react';
import { Message as UIMessage } from '@ai-sdk/react';

interface UseChatMessagesProps {
  conversationId: string;
  isNewChat: boolean;
  userName: string;
  defaultTimeZone: string;
  localTimeZone: string;
  defaultTimeZoneDateAndTime: string;
  localTimeZoneDateAndTime: string;
  userRules: string;
  enableAdvancedCalendarFeatures: boolean;
}

interface UseChatMessagesReturn {
  isLoading: boolean;
  initialMessages: UIMessage[];
  systemPrompt: string;
}

export function useChatMessages({
  conversationId,
  isNewChat,
  userName,
  defaultTimeZone,
  localTimeZone,
  defaultTimeZoneDateAndTime,
  localTimeZoneDateAndTime,
  userRules,
  enableAdvancedCalendarFeatures
}: UseChatMessagesProps): UseChatMessagesReturn {
  
  const systemPrompt = useMemo(() => generateSystemPrompt({
    name: userName,
    defaultTimeZone,
    defaultTimeZoneDateAndTime,
    localTimeZone,
    localTimeZoneDateAndTime,
    rules: userRules,
    enableAdvancedCalendarFeatures
  }), [userName, defaultTimeZone, defaultTimeZoneDateAndTime, localTimeZone, localTimeZoneDateAndTime, userRules, enableAdvancedCalendarFeatures]);
  
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>(() => {
    if (isNewChat) {
      return [{
        id: 'system-' + conversationId,
        role: 'system',
        content: systemPrompt
      }];
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(!isNewChat);
  const loadingComplete = useRef<boolean>(isNewChat);

  useEffect(() => {
    if (isNewChat) {
      // Ensure initialMessages reflects the current systemPrompt if it changes.
      setInitialMessages([{
        id: 'system-' + conversationId,
        role: 'system',
        content: systemPrompt
      }]);
      // If it was a new chat, loading should be false and complete true.
      if (isLoading) setIsLoading(false);
      if (!loadingComplete.current) loadingComplete.current = true;
      return;
    }

    // Logic for existing chats (!isNewChat)
    let ignore = false;

    async function setupMessagesForExistingChat() {
      setIsLoading(true);
      loadingComplete.current = false; // Indicate loading has started for existing chat
      
      try {
        const response = await loadChat(conversationId);
        if (ignore) return;
        
        if (!response.success) {
          addToast({
            title: "Error loading chat",
            description: response.error || "Failed to load chat messages",
            variant: "solid",
            color: "danger"
          });
          setInitialMessages([{
            id: 'system-error-' + conversationId,
            role: 'system',
            content: systemPrompt
          }]);
        } else {
          const loadedMessages = Array.isArray(response.data) ? response.data : [];
          if (loadedMessages.length === 0) {
            setInitialMessages([{
              id: 'system-empty-' + conversationId,
              role: 'system',
              content: systemPrompt
            }]);
          } else {
            const hasSystemMessage = loadedMessages.some((msg: UIMessage) => msg.role === 'system');
            if (!hasSystemMessage) {
              setInitialMessages([{
                id: 'system-override-' + conversationId,
                role: 'system',
                content: systemPrompt
              }]);
            } else {
              setInitialMessages(loadedMessages as UIMessage[]);
            }
          }
        }
      } catch (error) {
        if (ignore) return;
        console.error("Error loading messages:", error);
        addToast({
          title: "Error loading chat",
          description: "An unexpected error occurred while loading messages.",
          variant: "solid",
          color: "danger"
        });
        setInitialMessages([{
          id: 'system-catch-' + conversationId,
          role: 'system',
          content: systemPrompt
        }]);
      } finally {
        if (!ignore) {
          setIsLoading(false);
          loadingComplete.current = true; // Mark loading as complete
        }
      }
    }

    setupMessagesForExistingChat();

    return () => {
      ignore = true;
    };
  }, [conversationId, isNewChat, systemPrompt]); // Removed isLoading from dependencies

  return {
    isLoading,
    initialMessages,
    systemPrompt
  };
} 
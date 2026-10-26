'use client';

import { useState } from 'react';
import { Icon } from '@iconify-icon/react';
import { useRouter } from 'next/navigation';
import ChatInput from './chat/ChatInput';
import { useChatContext } from '@/contexts/chat-context';
import { usePostHog } from "posthog-js/react";

interface NewChatPromptProps {
  userName: string | null;
}

export default function NewChatPrompt({ userName }: NewChatPromptProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const { createAndNavigateToChat, ensureConversationExists, pendingConversationId, setPendingConversationId } = useChatContext();
  const router = useRouter();
  const posthog = usePostHog();

  // Get greeting based on time of day
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Good morning";
    } else if (hour < 18) {
      return "Good afternoon";
    } else {
      return "Good evening";
    }
  };

  const handleSubmit = async (e: React.FormEvent, options?: any) => {
    e.preventDefault();

    if (prompt.length > 4000) {
      setInputError("Your message is too long. Please submit something shorter");
      if (posthog) {
        posthog.capture('new_chat_prompt_length_exceeded', {
          character_count: prompt.length,
          limit: 4000
        });
      }
      return;
    }
    setInputError(null); // Clear any previous error

    if (!prompt.trim() && (!attachments || attachments.length === 0)) return;

    setIsLoading(true);
    try {
      // If there's no prompt text but there are attachments, use default text
      const messageText = (!prompt.trim() && attachments && attachments.length > 0) 
        ? "See attatchments" 
        : prompt;
      
      // Pass the conversation ID from options (if it exists) to createAndNavigateToChat
      await createAndNavigateToChat(messageText, attachments, options?.conversationId);
      // Navigation happens here, so we don't reset isLoading
      // The component will unmount when navigation completes
    } catch (error) {
      console.error('Error creating conversation:', error);
      setIsLoading(false); // Only reset loading on error
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    if (inputError) {
      setInputError(null); // Clear error when user types
    }
  };

  return (
    <div className="w-full h-[100dvh] flex items-center md:items-center justify-center">
      <div className="w-full flex flex-col items-center fixed md:relative bottom-0 md:bottom-auto md:px-4 md:pb-0">
        <div className="text-center">
          <h1 className="text-2xl font-semibold ">{getTimeBasedGreeting()}{userName ? `, ${userName}` : ''} 👋</h1>
        </div>
        
        <div className="w-full flex justify-center max-w-3xl mt-6">
          <ChatInput
            input={prompt}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            status={isLoading ? "loading" : "ready"}
            error={inputError ? new Error(inputError) : null}
            attachments={attachments}
            setAttachments={setAttachments}
            conversationId={pendingConversationId}
            ensureConversationExists={ensureConversationExists}
            floating
            className="min-h-[100px] md:min-h-[40px]"
          />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createConversation } from '@/actions/actions';
import { ChatLoadingSkeleton } from '@/app/app/chat/conversation/loading';

export default function NewFromLandingPage() {
  const router = useRouter();

  useEffect(() => {
    const handleChatCreation = async () => {
      try {
        // Get the stored prompt from localStorage
        const storedPrompt = localStorage.getItem('pendingChatPrompt');
        
        if (!storedPrompt) {
          // If no prompt, redirect to main chat page
          router.push('/app/chat');
          return;
        }

        // Create a new conversation
        const result = await createConversation();
        
        if (!result.success || !result.data) {
          throw new Error(result.error || "Failed to create conversation");
        }

        // Clear the stored prompt
        localStorage.removeItem('pendingChatPrompt');

        // Navigate to the new chat with the prompt
        router.push(`/app/chat/conversation/${result.data.id}?prompt=${encodeURIComponent(storedPrompt)}&isNewChat=true`);
      } catch (error) {
        console.error('Error creating chat from landing:', error);
        // Fallback to main chat page
        router.push('/app/chat');
      }
    };

    handleChatCreation();
  }, [router]);

  // Show loading state while processing
  return (
    <div className="flex flex-col h-full relative pt-4 px-4">
      <div className="flex-1 p-4 md:p-6">
        <div className="space-y-6 max-w-3xl mx-auto">
          <ChatLoadingSkeleton />
        </div>
      </div>
    </div>
  );
}
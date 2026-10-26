'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createConversation } from '@/actions/actions';
import { addToast } from '@heroui/react';

interface ChatContextType {
  // Existing properties
  hasMessages: boolean;
  setHasMessages: (value: boolean) => void;
  
  // New properties for chat creation
  pendingPrompt: string;
  setPendingPrompt: (value: string) => void;
  pendingAttachments: Array<{name: string, type: string, data: string}> | null;
  setPendingAttachments: (attachments: Array<{name: string, type: string, data: string}> | null) => void;
  pendingConversationId: string;
  setPendingConversationId: (id: string) => void;
  
  // New properties for conversation title and sidebar
  activeConversationTitle: string;
  setActiveConversationTitle: (title: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
  
  // Helper methods
  ensureConversationExists: () => Promise<string>;
  createAndNavigateToChat: (prompt: string, attachments: FileList | null, existingId?: string) => Promise<void>;
  clearPendingData: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  // Existing state
  const [hasMessages, setHasMessages] = useState(false);
  
  // New state for chat creation
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<Array<{name: string, type: string, data: string}> | null>(null);
  const [pendingConversationId, setPendingConversationId] = useState('');
  
  // New state for conversation title and sidebar
  const [activeConversationTitle, setActiveConversationTitle] = useState('AI Assistant');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const router = useRouter();
  
  // Track if a conversation creation is in progress to prevent duplicate creations
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  
  // Helper methods
  const ensureConversationExists = async () => {
    // If we already have a conversation ID, use it
    if (pendingConversationId) {
      return pendingConversationId;
    }
    
    // If a conversation creation is already in progress, wait for it to complete
    if (isCreatingConversation) {
      // Wait for the pendingConversationId to be set
      // This is a simple polling approach - in a real app, you might use a more sophisticated approach
      let attempts = 0;
      while (!pendingConversationId && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (pendingConversationId) {
        return pendingConversationId;
      }
    }
    
    try {
      // Set flag to indicate that conversation creation is in progress
      setIsCreatingConversation(true);
      
      // Create a new conversation
      const result = await createConversation();
      
      if (!result.success) {
        addToast({
          title: "Error creating conversation",
          description: result.error || "An unexpected error occurred",
          color: "danger"
        });
        throw new Error(result.error || "Failed to create conversation");
      }
      
      if (!result.data) {
        addToast({
          title: "Error creating conversation",
          description: "No conversation ID returned",
          color: "danger"
        });
        throw new Error("No conversation ID returned");
      }
      
      // Save the new ID to state
      const newId = result.data.id;
      setPendingConversationId(newId);
      return newId;
    } finally {
      // Reset flag regardless of success or failure
      setIsCreatingConversation(false);
    }
  };
  
  const createAndNavigateToChat = async (prompt: string, attachments: FileList | null, existingId?: string) => {
    try {
      let id: string;
      
      // If an existing ID is provided, use it directly without calling ensureConversationExists
      if (existingId) {
        id = existingId;
        // Make sure the ID is set in the context
        setPendingConversationId(id);
      } else {
        // Only create a new conversation if no ID is provided
        id = await ensureConversationExists();
      }
      
      // Store the prompt and attachments in context
      setPendingPrompt(prompt);
      setPendingConversationId(id); // Ensure the ID is set in context
      
      if (attachments && attachments.length > 0) {
        // Convert FileList to array and store file data
        const filePromises = Array.from(attachments).map(file => 
          new Promise<{name: string, type: string, data: string}>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve({
              name: file.name,
              type: file.type,
              data: reader.result as string
            });
            reader.readAsDataURL(file);
          })
        );
        
        const fileData = await Promise.all(filePromises);
        setPendingAttachments(fileData);
      }
      
      // Navigate to the conversation
      router.push(`/app/chat/conversation/${id}?isNewChat=true`);
    } catch (error) {
      console.error("Error in createAndNavigateToChat:", error);
      addToast({
        title: "Error creating chat",
        description: "Failed to create a new chat. Please try again.",
        color: "danger"
      });
      throw error;
    }
  };
  
  const clearPendingData = () => {
    setPendingPrompt('');
    setPendingAttachments(null);
    setPendingConversationId('');
  };
  
  return (
    <ChatContext.Provider value={{ 
      // Existing values
      hasMessages, 
      setHasMessages,
      
      // New values
      pendingPrompt,
      setPendingPrompt,
      pendingAttachments,
      setPendingAttachments,
      pendingConversationId,
      setPendingConversationId,
      
      // New values for conversation title and sidebar
      activeConversationTitle,
      setActiveConversationTitle,
      sidebarOpen,
      setSidebarOpen,
      
      // Helper methods
      ensureConversationExists,
      createAndNavigateToChat,
      clearPendingData
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { CloudAttachment } from '../chat-input/types';
import { clearNewChatParam } from '@/utils/chat-utils';
import { useChatContext } from '@/contexts/chat-context';

interface UseInitialPromptProps {
  isNewChat: boolean;
  isLoading: boolean;
  conversationId: string;
  initialPrompt?: string;
  append: (message: any, options?: any) => Promise<void>;
}

export function useInitialPrompt({
  isNewChat,
  isLoading,
  conversationId,
  initialPrompt,
  append
}: UseInitialPromptProps) {
  const isFirstMount = useRef(true);
  const router = useRouter();
  const { pendingPrompt, pendingAttachments, clearPendingData, pendingConversationId } = useChatContext();

  useEffect(() => {
    async function submitInitialPrompt() {
      if (isNewChat && isFirstMount.current && !isLoading) {
        isFirstMount.current = false;

        if (pendingPrompt || pendingAttachments || initialPrompt) {
          // Remove isNewChat from the URL
          clearNewChatParam(router);

          if (pendingPrompt || initialPrompt) {
            // For the initial message, we'll handle attachments differently
            // If we have stored attachments, we'll need to upload them first
            
            let cloudAttachments: CloudAttachment[] = [];
            
            if (pendingAttachments && pendingAttachments.length > 0) {
              try {
                // Convert the attachments to File objects
                const attachmentFiles = await Promise.all(
                  pendingAttachments.map(async (fileData) => {
                    const response = await fetch(fileData.data);
                    const blob = await response.blob();
                    return new File([blob], fileData.name, { type: fileData.type });
                  })
                );
                
                // Use the pendingConversationId if it exists and matches what we expect
                // This ensures we're using the same ID that was used during chat creation
                const targetConversationId = pendingConversationId && pendingConversationId === conversationId 
                  ? pendingConversationId 
                  : conversationId;
                
                // Upload each file to cloud storage
                const uploadPromises = attachmentFiles.map(async (file: File) => {
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('conversationId', targetConversationId);
                  
                  try {
                    const response = await axios.post('/api/upload', formData, {
                      headers: {
                        'Content-Type': 'multipart/form-data',
                      },
                    });
                    
                    return response.data;
                  } catch (error) {
                    console.error('Error uploading initial file:', error);
                    return null;
                  }
                });
                
                // Filter out any failed uploads
                const uploadResults = await Promise.all(uploadPromises);
                cloudAttachments = uploadResults.filter(Boolean);
              } catch (error) {
                console.error('Error processing stored attachments:', error);
              }
            }

            // Use pendingPrompt first, then initialPrompt as fallback
            const promptText = pendingPrompt || initialPrompt || '';
            
            // If there's no prompt text but there are attachments, use default text
            const messageText = (!promptText.trim() && cloudAttachments.length > 0) 
              ? "See attatchments" 
              : promptText;
              
            // Append the initial prompt as a user message with cloud attachments
            await append(
              {
                content: messageText,
                role: "user",
              },
              {
                experimental_attachments: cloudAttachments.length > 0 ? cloudAttachments : undefined,
              }
            );
            
            // Clear the pending data from context
            clearPendingData();
          }
        }
      }
    }

    submitInitialPrompt();
  }, [isNewChat, isLoading, append, router, conversationId, initialPrompt, pendingPrompt, pendingAttachments, clearPendingData]);

  return { isFirstMount };
}

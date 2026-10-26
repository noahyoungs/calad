"use server";

import { Message } from 'ai';
import { createClient } from '@/utils/supabase/server';
import { generateId } from '@/utils/id-generator';
import { ActionResponse, ActionError, ActionErrorCode, handleActionError, requireAuth } from "./types";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Validation schemas
const MessageSchema = z.object({
  id: z.string(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  content: z.any(),
  role: z.string(),
  experimental_attachments: z.array(z.any()).optional()
});

const MessagesArraySchema = z.array(MessageSchema);

// Create a new chat conversation
export async function createConversation(): Promise<ActionResponse<{ id: string }>> {
  const supabase = await createClient();
  
  try {
    const user = await requireAuth(supabase);
    
    const { data, error } = await supabase
      .from('conversations')
      .insert({ 
        user_id: user.id,
        messages: []
      })
      .select('id')
      .single();
    
    if (error) {
      throw new ActionError("Failed to create chat", ActionErrorCode.DATABASE_ERROR);
    }
    
    return { success: true, data: { id: data.id } };
  } catch (error) {
    return handleActionError<{ id: string }>(error);
  }
}

// Save messages to a chat conversation
export async function saveChat({
  id,
  messages,
}: {
  id: string;
  messages: Message[];
}): Promise<ActionResponse> {
  const supabase = await createClient();
  
  try {
    await requireAuth(supabase);

    const { error } = await supabase
      .from('conversations')
      .update({ 
        messages,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      throw new ActionError("Failed to save chat", ActionErrorCode.DATABASE_ERROR);
    }

    revalidatePath(`/app/chat/conversation/${id}`);
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

// Get all conversations for the current user
export async function getUserConversations(): Promise<ActionResponse<any[]>> {
  const supabase = await createClient();
  
  try {
    await requireAuth(supabase);
    
    // RLS will ensure that the user only sees their own conversations
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      throw new ActionError("Failed to get conversations", ActionErrorCode.DATABASE_ERROR);
    }
    
    return { success: true, data: data || [] };
  } catch (error) {
    return handleActionError<any[]>(error);
  }
}

// Delete a conversation
export async function deleteConversation(conversationId: string): Promise<ActionResponse> {
  const supabase = await createClient();
  
  try {
    await requireAuth(supabase);
    
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);
    
    if (error) {
      throw new ActionError("Failed to delete conversation", ActionErrorCode.DATABASE_ERROR);
    }

    revalidatePath('/app/chat');
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

// Update conversation title
export async function updateConversationTitle(conversationId: string, title: string): Promise<ActionResponse> {
  const supabase = await createClient();
  
  try {
    await requireAuth(supabase);

    if (!title?.trim()) {
      throw new ActionError("Title cannot be empty", ActionErrorCode.VALIDATION_ERROR);
    }
    
    const { error } = await supabase
      .from('conversations')
      .update({ 
        title,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);
    
    if (error) {
      throw new ActionError("Failed to update conversation title", ActionErrorCode.DATABASE_ERROR);
    }

    revalidatePath(`/app/chat/conversation/${conversationId}`);
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

// Load chat messages with re-signed URLs
export async function loadChat(conversationId: string): Promise<ActionResponse<Message[]>> {
  const supabase = await createClient();
  
  try {
    await requireAuth(supabase);
    
    const { data, error } = await supabase
      .from('conversations')
      .select('messages')
      .eq('id', conversationId)
      .maybeSingle();
    
    if (error) {
      throw new ActionError("Failed to load chat", ActionErrorCode.DATABASE_ERROR);
    }
    
    // If no data found, return empty array
    if (!data || !data.messages || !Array.isArray(data.messages)) {
      return { success: true, data: [] };
    }
    
    // Re-sign any Google Cloud Storage URLs in the messages
    const messages = await Promise.all(data.messages.map(async (msg: any) => {
      const newMsg = {
        ...msg,
        id: msg.id || generateId(),
        createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
      };
      
      if (msg.experimental_attachments && Array.isArray(msg.experimental_attachments)) {
        newMsg.experimental_attachments = await Promise.all(
          msg.experimental_attachments.map(async (attachment: any) => {
            if (attachment.url && attachment.url.includes('storage.googleapis.com')) {
              console.debug("Re-signing URL for attachment:", attachment.url);
              try {
                // Extract the file path from the URL
                const url = new URL(attachment.url);
                const path = url.pathname.split('/calendar-ai-attachments/')[1];
                
                if (path) {
                  const { getSignedUrl } = await import('@/utils/storage');
                  const newUrl = await getSignedUrl(path);
                  console.debug("New signed URL generated with path:", path);
                  return {
                    ...attachment,
                    url: newUrl
                  };
                } else {
                  console.error("Could not extract path from URL:", attachment.url);
                  return attachment;
                }
              } catch (error) {
                console.error(`Error re-signing URL for attachment:`, error);
                return attachment;
              }
            }
            return attachment;
          })
        );
      }
      
      return newMsg;
    }));

    return { success: true, data: messages };
  } catch (error) {
    return handleActionError<Message[]>(error);
  }
} 
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { generateId } from "@/utils/id-generator";
import {
  ActionResponse,
  ActionError,
  ActionErrorCode,
  ConversationSchema,
  handleActionError,
  requireAuth,
} from "@/actions/types";

type SignUpResponse = {
  message: string;
};

// Refuse direct server-action calls as well as registration page visits.
export async function signUpAction(_formData: FormData): Promise<ActionResponse<SignUpResponse>> {
  return {
    success: false,
    error: "cal.ad is no longer accepting new sign-ups.",
    redirect: "/closed",
  };
}

type ConversationResponse = {
  id: string;
};

export async function createConversation(shouldRedirect = false): Promise<ActionResponse<ConversationResponse>> {
  const supabase = await createClient();
  
  try {
    const user = await requireAuth(supabase);
    const conversationId = generateId();
    
    const { error } = await supabase
      .from('conversations')
      .insert([{ 
        id: conversationId,
        user_id: user.id,
        title: 'New chat',
      }]);

    if (error) {
      console.error('createConversation - error creating conversation:', error);
      throw new ActionError("Failed to create conversation", ActionErrorCode.DATABASE_ERROR);
    }
    
    revalidatePath("/app/chat", "layout");
    
    console.log('createConversation - successfully created conversation with ID:', conversationId);
    
    return { 
      success: true, 
      data: { id: conversationId },
      redirect: shouldRedirect ? `/app/chat/conversation/${conversationId}` : undefined
    };
  } catch (error) {
    return handleActionError<ConversationResponse>(error);
  }
}

export async function updateConversationTitle(id: string, title: string): Promise<ActionResponse> {
  const supabase = await createClient();
  
  try {
    await requireAuth(supabase);
    
    // Validate inputs
    const validatedId = ConversationSchema.id.parse(id);
    const validatedTitle = ConversationSchema.title.parse(title);

    // RLS will handle authorization
    const { error } = await supabase
      .from('conversations')
      .update({ title: validatedTitle })
      .eq('id', validatedId);

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ActionError("Conversation not found", ActionErrorCode.NOT_FOUND);
      }
      throw new ActionError("Failed to update conversation", ActionErrorCode.DATABASE_ERROR);
    }

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteConversation(id: string): Promise<ActionResponse> {
  const supabase = await createClient();
  
  try {
    await requireAuth(supabase);
    
    // Validate input
    const validatedId = ConversationSchema.id.parse(id);

    // RLS will handle authorization
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', validatedId);

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ActionError("Conversation not found", ActionErrorCode.NOT_FOUND);
      }
      throw new ActionError("Failed to delete conversation", ActionErrorCode.DATABASE_ERROR);
    }

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function signOutAction(): Promise<ActionResponse> {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    return {
      success: true,
      redirect: "/"
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function completeOnboarding(): Promise<ActionResponse> {
  const supabase = await createClient();
  
  try {
    const user = await requireAuth(supabase);

    const { error } = await supabase
      .from('users')
      .update({
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      throw new ActionError("Failed to complete onboarding", ActionErrorCode.DATABASE_ERROR);
    }

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getUserOnboardingStatus(): Promise<ActionResponse<boolean>> {
  const supabase = await createClient();
  
  try {
    const user = await requireAuth(supabase);
    
    const { data, error } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        return { success: true, data: false };
      }
      throw new ActionError("Failed to get onboarding status", ActionErrorCode.DATABASE_ERROR);
    }
    
    return { 
      success: true, 
      data: data.onboarding_completed ?? false 
    };
  } catch (error) {
    return handleActionError<boolean>(error);
  }
}

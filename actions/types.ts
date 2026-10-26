import { z } from "zod";

// Base response type for all actions
export type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: ActionErrorCode;
  message?: string; // Optional message for additional context
  redirect?: string;
};

// Error codes for consistent error handling
export enum ActionErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  RATE_LIMITED = "RATE_LIMITED",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

// Base error class for actions
export class ActionError extends Error {
  constructor(
    message: string,
    public code: ActionErrorCode,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "ActionError";
  }
}

// Validation schemas
export const ConversationSchema = {
  id: z.string().min(1, "Conversation ID is required"),
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
};

export const UserSchema = {
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
};

export const OnboardingSchema = {
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  timezone: z.string().min(1, "Timezone is required"),
};

// Helper function to handle errors consistently
export function handleActionError<T>(error: unknown): ActionResponse<T> {
  console.error("Action error:", error);

  if (error instanceof ActionError) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: error.errors.map(e => e.message).join(", "),
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: false,
    error: "An unknown error occurred",
  };
}

// Helper function to verify authentication
export async function requireAuth(supabase: any) {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ActionError("Unauthorized", ActionErrorCode.UNAUTHORIZED, 401);
  }

  return user;
} 
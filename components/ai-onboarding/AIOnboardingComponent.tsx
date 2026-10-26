'use client';

import { useChat, UseChatOptions } from "@ai-sdk/react";
import { ToolCall } from "ai";
import { SaveAction } from "@/utils/ai-onboarding";

interface UseAIOnboardingProps {
  useChatOptions: UseChatOptions;
  onComplete?: (() => void) | (() => Promise<void>);
  onSave?: (action: SaveAction) => void | Promise<void>;
}

export default function useAIOnboarding({ useChatOptions, onComplete, onSave }: UseAIOnboardingProps) {

  // Setup the chat instance
  const useChatResult = useChat({
    ...useChatOptions,
    onToolCall: async ({ toolCall }: { toolCall: ToolCall<string, any> }) => {
      const { toolName } = toolCall;

      // Handle the completion tool
      if (toolName === 'complete_onboarding') {
        if (onComplete) await Promise.resolve(onComplete());
      }

      // Handle question tools
      if (toolName.startsWith('save_')) {
        const questionId = toolName.substring(5);

        if (onSave) {
          try {
            await Promise.resolve(onSave({
              questionId,
              parsedAnswer: toolCall.args.answer
            }));
            return {
              success: true,
              message: `Answer for "${questionId}" saved successfully`,
              questionId
            };
          } catch (err) {
            console.error("Error saving client data:", err);
            return {
              success: false,
              error: `Error saving answer: ${err instanceof Error ? err.message : String(err)}`
            };
          }
        }
      }
    }
  });

  return useChatResult;
} 
"use client";

import { useEffect, useRef, Suspense } from 'react';
import { ScrollShadow } from "@heroui/react";
import { Message as UIMessage } from "@ai-sdk/react";
import {
  ChatHeader,
  ChatMessage,
  ChatInput,
  TypingIndicator,
  ChatError,
} from "./index";
import { ChatLoadingSkeleton } from "@/app/app/chat/conversation/loading";
import { useChatContext } from "@/contexts/chat-context";
import { useRouter, useSearchParams } from 'next/navigation';
import { ChangeEvent } from 'react';

interface ChatContainerProps {
  conversationId: string;
  isLoading: boolean;
  isToolsLoading: boolean;
  isTyping: boolean;
  userName: string;
  input: string;
  messages: UIMessage[];
  error: Error | null;
  status: string;
  attachments: FileList | null;
  enableAdvancedCalendarFeatures: boolean;
  setAttachments: (attachments: FileList | null) => void;
  handleInputChange: (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmitWrapper: (e: React.FormEvent<HTMLFormElement>, options?: any) => Promise<void>;
  addToolResult: (params: { toolCallId: string; result: any }) => void;
  reload: () => void;
  stop: () => void;
  handleCreateCalendarEvent: (updatedEvent: any, toolCallId: string) => Promise<void>;
  handleCancelCalendarEvent: (toolCallId: string) => void;
  handleModifyCalendarEvent?: (eventId: string, toolCallId: string) => Promise<void>;
  handleCancelModifyCalendarEvent?: (toolCallId: string) => void;
  handleDeleteCalendarEvent?: (eventId: string, toolCallId: string) => Promise<void>;
  handleCancelDeleteCalendarEvent?: (toolCallId: string) => void;
  handleToolCallError: (toolCallId: string, errorMessage: any) => void;
}

export function ChatContainer({
  conversationId,
  isLoading,
  isToolsLoading,
  isTyping,
  userName,
  input,
  messages,
  error,
  status,
  attachments,
  enableAdvancedCalendarFeatures,
  setAttachments,
  handleInputChange,
  handleSubmitWrapper,
  addToolResult,
  reload,
  stop,
  handleCreateCalendarEvent,
  handleCancelCalendarEvent,
  handleModifyCalendarEvent,
  handleCancelModifyCalendarEvent,
  handleDeleteCalendarEvent,
  handleCancelDeleteCalendarEvent,
  handleToolCallError,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { setHasMessages } = useChatContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Update the hasMessages context
  useEffect(() => {
    setHasMessages(messages.length > 0);
  }, [messages.length, setHasMessages]);

  return (
    <div className="flex flex-col h-full max-h-[100dvh] overflow-hidden pt-4 px-4">
      {/* Chat header */}
      <div>
        <ChatHeader />
      </div>

      {/* Chat messages */}
      <ScrollShadow className="flex-1 !pt-6 p-4 md:p-6 overflow-y-auto">
        <Suspense fallback={
          <div className="space-y-6 max-w-3xl mx-auto">
            <ChatLoadingSkeleton />
          </div>
        }>
          {isLoading ? (
            <div className="space-y-6 max-w-3xl mx-auto">
              <ChatLoadingSkeleton />
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto">
              {messages.filter((message) => message.role !== 'system').map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  userName={userName}
                  onToolResult={addToolResult}
                  handleCreateCalendarEvent={handleCreateCalendarEvent}
                  handleCancelCalendarEvent={handleCancelCalendarEvent}
                  handleToolCallError={handleToolCallError}
                  {...enableAdvancedCalendarFeatures ? {
                    handleModifyCalendarEvent,
                    handleCancelModifyCalendarEvent,
                    handleDeleteCalendarEvent,
                    handleCancelDeleteCalendarEvent
                  } : {}}
                  isLoading={isToolsLoading}
                />
              ))}

              {/* Status indicator */}
              {status === "submitted" && <TypingIndicator onStop={stop} />}

              {/* Error state */}
              {error && <ChatError error={error} onRetry={reload} />}

              <div ref={messagesEndRef} />
            </div>
          )}
        </Suspense>
      </ScrollShadow>

      {/* Input form */}
      <div className="w-full max-w-3xl mx-auto">
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmitWrapper}
          status={status}
          attachments={attachments}
          setAttachments={setAttachments}
          conversationId={conversationId}
        />
      </div>
    </div>
  );
} 
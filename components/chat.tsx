"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useMemo, FormEvent } from "react";
import { formatDateForTimezone, getLocalTimeZone } from "@/utils/chat-utils";
import { usePostHog } from "posthog-js/react";

// Import custom hooks
import { 
  useChatMessages, 
  useInitialPrompt, 
  useChatSubmit 
} from "./chat/hooks";

// Import calendar handlers
import { 
  createCalendarEventHandler, 
  cancelCalendarEventHandler, 
  abortCalendarEventHandler,
  modifyCalendarEventHandler,
  cancelModifyCalendarEventHandler,
  deleteCalendarEventHandler,
  cancelDeleteCalendarEventHandler,
  createToolCallErrorHandler
} from "./chat/calendar-handlers";

// Import UI component
import { ChatContainer } from "./chat/chat-container";

interface ChatProps {
  conversationId: string;
  isNewChat?: boolean;
  initialPrompt?: string;
  userName?: string;
  defaultTimeZone?: string;
  userRules?: string;
  enableAdvancedCalendarFeatures?: boolean;
}

export default function Chat({ 
  conversationId, 
  isNewChat = false, 
  initialPrompt,
  userName = "User",
  defaultTimeZone = "America/New_York",
  userRules = "",
  enableAdvancedCalendarFeatures = false
}: ChatProps) {
  // Memoize the conversationId to ensure it's stable
  const stableConversationId = useMemo(() => conversationId, [conversationId]);

  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const posthog = usePostHog();
  
  // Get browser local timezone
  const localTimeZone = useMemo(() => getLocalTimeZone(), []);
  
  // Format current date and time for both timezones
  const defaultTimeZoneDateAndTime = useMemo(() => formatDateForTimezone(defaultTimeZone), [defaultTimeZone]);
  const localTimeZoneDateAndTime = useMemo(() => formatDateForTimezone(localTimeZone), [localTimeZone]);
  
  // Use the chat messages hook to handle loading messages
  const { 
    isLoading, 
    initialMessages,
    systemPrompt
  } = useChatMessages({
    conversationId: stableConversationId,
    isNewChat,
    userName,
    defaultTimeZone,
    localTimeZone,
    defaultTimeZoneDateAndTime,
    localTimeZoneDateAndTime,
    userRules,
    enableAdvancedCalendarFeatures
  });

  // Set up the AI chat with React AI SDK
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    status,
    error,
    reload,
    stop,
    setMessages,
    addToolResult,
  } = useChat({
    id: stableConversationId,
    initialMessages,
    sendExtraMessageFields: true,
    api: "/api/chat",
    onResponse: () => {
      setIsTyping(true);
    },
    onFinish: () => {
      setIsTyping(false);
    },
    onToolCall: ({toolCall}) => {
      console.log("toolCall", toolCall);
      // Declare variables at the beginning of the switch scope
      let startDateTime, endDateTime, startDate, endDate;
      
      switch (toolCall.toolName) {
        case "createCalendarEvent":
          // validate startDateTime and endDateTime if they exist
          if ((toolCall.args as any).startDateTime) {
            startDateTime = new Date((toolCall.args as any).startDateTime);
            if (isNaN(startDateTime.getTime())) {
              return {
                status: "error",
                error: "Invalid startDateTime",
                details: "The startDateTime is not a valid ISO 8601 date and time"
              };
            }
          }
          if ((toolCall.args as any).endDateTime) {
            endDateTime = new Date((toolCall.args as any).endDateTime);
            if (isNaN(endDateTime.getTime())) {
              return {
                status: "error",
                error: "Invalid endDateTime",
                details: "The endDateTime is not a valid ISO 8601 date and time"
              };
            }
          }
          break;
        case "createAllDayEvent":
          if ((toolCall.args as any).startDate) {
            startDate = new Date((toolCall.args as any).startDate);
            if (isNaN(startDate.getTime())) {
              return {
                status: "error",
                error: "Invalid startDate",
                details: "The startDate is not a valid date in YYYY-MM-DD format"
              };
            }
          }
          if ((toolCall.args as any).endDate) {
            endDate = new Date((toolCall.args as any).endDate);
            if (isNaN(endDate.getTime())) {
              return {
                status: "error",
                error: "Invalid endDate",
                details: "The endDate is not a valid date in YYYY-MM-DD format"
              };
            }
          }
          if (startDate && endDate && startDate > endDate) {
            return {
              status: "error",
              error: "Invalid startDate and endDate",
              details: "The startDate must be before the endDate"
            };
          }
          break;
        case "modifyCalendarEvent":
          if ((toolCall.args as any).startDateTime && (toolCall.args as any).startDate) {
            return {
              status: "error",
              error: "The startDateTime and startDate cannot both be provided",
              details: "To make this an all-day event, use startDate. To specify a time, use startDateTime."
            };
          }

          if ((toolCall.args as any).endDateTime && (toolCall.args as any).endDate) {
            return {
              status: "error",
              error: "The endDateTime and endDate cannot both be provided",
              details: "To make this an all-day event, use endDate. To specify a time, use endDateTime."
            };
          }

          if ((toolCall.args as any).startDateTime) {
            startDateTime = new Date((toolCall.args as any).startDateTime);
            if (isNaN(startDateTime.getTime())) {
              return {
                status: "error",
                error: "Invalid startDateTime",
                details: "The startDateTime is not a valid ISO 8601 date and time"
              };
            }
          }
          if ((toolCall.args as any).endDateTime) {
            endDateTime = new Date((toolCall.args as any).endDateTime);
            if (isNaN(endDateTime.getTime())) {
              return {
                status: "error",
                error: "Invalid endDateTime",
                details: "The endDateTime is not a valid ISO 8601 date and time"
              };
            }
          }

          if ((toolCall.args as any).startDate) {
            startDate = new Date((toolCall.args as any).startDate);
            if (isNaN(startDate.getTime())) {
              return {
                status: "error",
                error: "Invalid startDate",
                details: "The startDate is not a valid date in YYYY-MM-DD format"
              };
            }
          }

          if ((toolCall.args as any).endDate) {
            endDate = new Date((toolCall.args as any).endDate);
            if (isNaN(endDate.getTime())) {
              return {
                status: "error",
                error: "Invalid endDate",
                details: "The endDate is not a valid date in YYYY-MM-DD format"
              };
            }
          }

          if (startDate && endDate && startDate > endDate) {
            return {
              status: "error",
              error: "Invalid startDate and endDate",
              details: "The startDate must be before the endDate"
            };
          }
          
          break;
        default:
      }
    },
    maxSteps: 5, // Allow multi-step tool usage
  });

  // Handle initial prompt from session storage or props
  useInitialPrompt({
    isNewChat,
    isLoading,
    conversationId: stableConversationId,
    initialPrompt,
    append: async (message, options) => {
      await append(message, options);
    }
  });

  // Set up calendar event handlers
  const handleCreateCalendarEvent = createCalendarEventHandler(addToolResult);
  const handleCancelCalendarEvent = cancelCalendarEventHandler(addToolResult);
  const handleAbortToolCallLocally = (toolCallId: string) => {
    abortCalendarEventHandler(toolCallId, messages, setMessages);
  };
  const handleModifyCalendarEvent = modifyCalendarEventHandler(addToolResult, messages);
  const handleCancelModifyCalendarEvent = cancelModifyCalendarEventHandler(addToolResult);
  const handleDeleteCalendarEvent = deleteCalendarEventHandler(addToolResult);
  const handleCancelDeleteCalendarEvent = cancelDeleteCalendarEventHandler(addToolResult);
  const handleToolCallError = createToolCallErrorHandler(addToolResult);
  // Handle form submission
  const { handleSubmitWrapper } = useChatSubmit(
    messages, 
    async (e: FormEvent<HTMLFormElement>, options?: any) => {
      // Prevent default form submission if 'e' is provided, 
      // as handleSubmit from useChat will handle it.
      // However, we call it directly if submitting programmatically (e.g. initial prompt)
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      await handleSubmit(e as any, options);
    }, 
    handleAbortToolCallLocally
  );

  const handleInputSubmit = async (e: FormEvent<HTMLFormElement>, options?: any) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    if (input.length > 4000) {
      setInputError("Your message is too long. Please submit something shorter");
      if (posthog) {
        posthog.capture('chat_message_length_exceeded', {
          character_count: input.length,
          limit: 4000,
          conversation_id: stableConversationId
        });
      }
      return;
    }
    setInputError(null);
    // We pass the event and options to handleSubmitWrapper, which will then call handleSubmit
    // handleSubmit itself expects the event for form submissions or options for programmatic appends.
    await handleSubmitWrapper(e, options);
  };

  return (
    <ChatContainer
      conversationId={stableConversationId}
      isLoading={isLoading}
      isToolsLoading={status === "submitted" || status === "streaming"}
      isTyping={isTyping}
      userName={userName}
      input={input}
      messages={messages}
      error={inputError ? new Error(inputError) : error || null}
      status={status}
      attachments={attachments}
      enableAdvancedCalendarFeatures={enableAdvancedCalendarFeatures}
      setAttachments={setAttachments}
      handleInputChange={(e) => {
        // Clear input error when user types
        if (inputError) {
          setInputError(null);
        }
        handleInputChange(e);
      }}
      handleSubmitWrapper={handleInputSubmit}
      addToolResult={addToolResult}
      reload={reload}
      stop={stop}
      handleCreateCalendarEvent={handleCreateCalendarEvent}
      handleCancelCalendarEvent={handleCancelCalendarEvent}
      handleToolCallError={handleToolCallError}
      {...enableAdvancedCalendarFeatures ? {
        handleModifyCalendarEvent,
        handleCancelModifyCalendarEvent,
        handleDeleteCalendarEvent,
        handleCancelDeleteCalendarEvent
      } : {}}
    />
  );
}

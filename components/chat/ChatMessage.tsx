import { useMemo } from "react";
import { ChatMessageProps } from "./types";
import MessageUI from "./message-ui/MessageUI";
import { 
  createMarkdownComponents,
  createMarkdownComponentsFromParts, 
  shouldRenderMessage 
} from "./message-utils";

export default function ChatMessage({
  message,
  userName = "You",
  onToolResult,
  handleCreateCalendarEvent,
  handleCancelCalendarEvent,
  handleModifyCalendarEvent,
  handleCancelModifyCalendarEvent,
  handleDeleteCalendarEvent,
  handleCancelDeleteCalendarEvent,
  handleToolCallError,
  isLoading = false,
}: ChatMessageProps) {
  const { role, content, createdAt, experimental_attachments, parts } = message;

  // Combine both useMemo hooks into one to maintain consistent hook order
  const { shouldRenderMessage: shouldDisplay, memoizedMarkdowns } = useMemo(() => {
    // Check if message should be rendered
    const shouldRender = shouldRenderMessage(parts, content);
    
    // Create markdown components
    const markdowns = !parts?.length 
      ? createMarkdownComponents(content)
      : createMarkdownComponentsFromParts(parts);

    return {
      shouldRenderMessage: shouldRender,
      memoizedMarkdowns: markdowns
    };
  }, [parts, content]);

  // If all parts are cancelled/aborted tool calls, don't render anything
  if (!shouldDisplay) {
    return null;
  }

  return (
    <MessageUI
      role={role}
      userName={userName}
      experimental_attachments={experimental_attachments}
      memoizedMarkdowns={memoizedMarkdowns}
      parts={parts}
      handleCreateCalendarEvent={handleCreateCalendarEvent}
      handleCancelCalendarEvent={handleCancelCalendarEvent}
      handleModifyCalendarEvent={handleModifyCalendarEvent}
      handleCancelModifyCalendarEvent={handleCancelModifyCalendarEvent}
      handleDeleteCalendarEvent={handleDeleteCalendarEvent}
      handleCancelDeleteCalendarEvent={handleCancelDeleteCalendarEvent}
      handleToolCallError={handleToolCallError}
      isLoading={isLoading}
    />
  );
}

import { Message as UIMessage } from "@ai-sdk/react";
import { CalendarEvent } from "../../utils/calendarTypes";
import { ToolResultStatus } from "./calendar-handlers";

export interface ChatMessageProps {
  message: UIMessage;
  userName?: string;
  onToolResult?: ({
    toolCallId,
    result,
  }: {
    toolCallId: string;
    result: any;
  }) => void;
  handleCreateCalendarEvent?: (
    event: CalendarEvent,
    toolCallId: string
  ) => Promise<void>;
  handleCancelCalendarEvent?: (toolCallId: string) => void;
  handleModifyCalendarEvent?: (
    eventId: string, 
    toolCallId: string
  ) => Promise<void>;
  handleCancelModifyCalendarEvent?: (toolCallId: string) => void; 
  handleDeleteCalendarEvent?: (
    eventId: string,
    toolCallId: string
  ) => Promise<void>;
  handleCancelDeleteCalendarEvent?: (toolCallId: string) => void;
  handleToolCallError?: (toolCallId: string, errorMessage: any) => void;
  isLoading?: boolean;
}

export interface ToolInvocation {
  toolName: string;
  toolCallId: string;
  state: string;
  args: any;
  result?: {
    status: ToolResultStatus;
    message?: string;
  };
}

export interface CalendarChange {
  field: string;
  newValue: string;
}

export interface MarkdownItem {
  type: string;
  component?: React.ReactNode;
  toolInvocation?: any;
} 
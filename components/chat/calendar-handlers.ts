import { addCalendarEvent, modifyCalendarEvent, deleteCalendarEvent } from "@/actions/calendar";
import { CalendarEvent } from "@/utils/calendarTypes";

// Define the possible status values as a string literal type
export type ToolResultStatus = "complete" | "error" | "cancelled" | "aborted";

export type ToolResultHandler = (params: {
  toolCallId: string;
  result: any;
}) => void;

export const createToolCallErrorHandler = (addToolResult: ToolResultHandler) => {
  return (toolCallId: string, errorMessage: any) => {
    addToolResult({
      toolCallId,
      result: {
        status: "error",
        error: errorMessage,
      }
    });
  };
};

/**
 * Handles calendar event creation
 */
export const createCalendarEventHandler = (addToolResult: ToolResultHandler) => {
  return async (updatedEvent: CalendarEvent, toolCallId: string) => {
    try {
      console.log("Creating calendar event:", updatedEvent);
      const result = await addCalendarEvent(updatedEvent);
      console.log("Calendar event creation result:", result);

      if (result.success) {
        console.log("Success, adding tool result");
        
        addToolResult({
          toolCallId,
          result: {
            status: "complete",
            message: "Calendar event was successfully added to the user's calendar.",
            event: result.event,
            eventLink: result.eventLink,
          },
        });
      } else {
        addToolResult({
          toolCallId,
          result: {
            status: "error",
            error: result.error || "Failed to create calendar event",
            details: result.details,
          }
        });
      }
    } catch (error: any) {
      addToolResult({
        toolCallId,
        result: {
          status: "error",
          error: error.message || "Failed to create calendar event",
        }
      });
    }
  };
};

/**
 * Handles cancellation of calendar event creation
 */
export const cancelCalendarEventHandler = (addToolResult: ToolResultHandler) => {
  return (toolCallId: string) => {
    addToolResult({
      toolCallId,
      result: {
        status: "cancelled",
        message: "Calendar event creation cancelled by user. It was not added to their calendar. Please ask the user for feedback on how to improve the calendar event.",
      },
    });
  };
};

/**
 * Handles automatic abortion of calendar event creation by updating messages locally.
 * This function directly modifies the message list to reflect an aborted tool call
 * without triggering a new API call.
 */
export const abortCalendarEventHandler = (
  toolCallId: string,
  currentMessages: import("@ai-sdk/react").Message[], // UIMessage is Message + parts
  setMessages: (updater: import("@ai-sdk/react").Message[] | ((currentMessages: import("@ai-sdk/react").Message[]) => import("@ai-sdk/react").Message[])) => void
): void => {
  const abortedResult = {
    status: "aborted" as ToolResultStatus,
    message: "Calendar event creation was automatically aborted because the user sent another message. It was not added to their calendar. Listen to the user's feedback and improve the calendar event creation process.",
  };

  let messageUpdated = false;

  const newMessages = currentMessages.map(msg => {
    // We are working with UIMessage structure which includes 'parts'.
    // Cast to 'any' for easier manipulation of these internal structures.
    const uiMsg = msg as any;

    if (uiMsg.role === 'assistant' && uiMsg.parts && Array.isArray(uiMsg.parts)) {
      let partsChangedInThisMessage = false;
      const updatedParts = uiMsg.parts.map((part: any) => {
        if (
          part.type === 'tool-invocation' &&
          part.toolInvocation?.toolCallId === toolCallId &&
          part.toolInvocation?.state === 'call' // Only abort if it's in 'call' state
        ) {
          partsChangedInThisMessage = true;
          return {
            ...part,
            toolInvocation: {
              ...part.toolInvocation,
              state: 'result' as 'result', // Mark as completed with a result
              result: abortedResult,
            },
          };
        }
        return part;
      });

      if (partsChangedInThisMessage) {
        messageUpdated = true;
        // Return a new message object instance with the updated parts
        return { ...uiMsg, parts: updatedParts };
      }
    }
    // Return the original message object if no changes in this specific message
    return msg;
  });

  if (messageUpdated) {
    // `setMessages` expects Message[], but our `newMessages` are effectively UIMessage[].
    // The `useChat` hook's `setMessages` calls `fillMessageParts` internally,
    // which should handle this correctly.
    setMessages(newMessages as import("@ai-sdk/react").Message[]);
  } else {
    console.warn(`Tool call ID ${toolCallId} for abortion not found or not in 'call' state.`);
  }
};

/**
 * Handles modification of existing calendar events
 */
export const modifyCalendarEventHandler = (addToolResult: ToolResultHandler, messages: any[]) => {
  return async (eventId: string, toolCallId: string) => {
    try {
      // Get the args from the message part
      const lastAssistantMessage = messages.findLast((message: any) => message.role === 'assistant');
      if (!lastAssistantMessage || !lastAssistantMessage.parts) {
        throw new Error("Could not find tool call details");
      }

      const toolInvocationPart = lastAssistantMessage.parts.find(
        (part: any) => 
          part.type === 'tool-invocation' && 
          part.toolInvocation?.toolCallId === toolCallId
      ) as { type: 'tool-invocation'; toolInvocation: any } | undefined;

      if (!toolInvocationPart || !toolInvocationPart.toolInvocation || !toolInvocationPart.toolInvocation.args) {
        throw new Error("Could not find tool call arguments");
      }

      const args = typeof toolInvocationPart.toolInvocation.args === 'string' 
        ? JSON.parse(toolInvocationPart.toolInvocation.args) 
        : toolInvocationPart.toolInvocation.args;

      // Create a partial CalendarEvent object from the args
      const eventUpdates: Partial<CalendarEvent> = {};

      // Handle fields that might be specified
      if (args.summary !== undefined) eventUpdates.summary = args.summary;
      if (args.description !== undefined) eventUpdates.description = args.description;
      if (args.location !== undefined) eventUpdates.location = args.location;
      
      // Handle start and end times based on whether it's an all-day event or timed event
      if (args.startDate || args.endDate || args.startDateTime || args.endDateTime) {
        eventUpdates.start = {};
        eventUpdates.end = {};
        
        // For timed events
        if (args.startDateTime) {
          eventUpdates.start.dateTime = args.startDateTime;
          if (args.startTimeZone) eventUpdates.start.timeZone = args.startTimeZone;
        }
        
        if (args.endDateTime) {
          eventUpdates.end.dateTime = args.endDateTime;
          if (args.endTimeZone) eventUpdates.end.timeZone = args.endTimeZone;
        }
        
        // For all-day events
        if (args.startDate) {
          eventUpdates.start.date = args.startDate;
          if (args.startTimeZone) eventUpdates.start.timeZone = args.startTimeZone;
        }
        
        if (args.endDate) {
          eventUpdates.end.date = args.endDate;
          if (args.endTimeZone) eventUpdates.end.timeZone = args.endTimeZone;
        }
      }
      
      // Handle Google Meet integration
      if (args.addGoogleMeet === true) {
        eventUpdates.conferenceData = {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: "hangoutsMeet"
            }
          }
        };
      }

      // Remove Google Meet
      if (args.addGoogleMeet === false) {
        // @ts-ignore
        eventUpdates.conferenceData = null;
      }
      
      // Handle attendees
      if (args.attendees) {
        eventUpdates.attendees = args.attendees.map((email: string) => ({ email }));
      }
      
      // Handle notifications
      if (args.notificationMinutesBefore) {
        eventUpdates.reminders = {
          useDefault: false,
          overrides: args.notificationMinutesBefore.map((minutes: number) => ({
            method: "popup",
            minutes
          }))
        };
      }
      
      // Handle recurrence
      if (args.recurrence) {
        eventUpdates.recurrence = [args.recurrence];
      }

      // Remove recurrence
      if (args.recurrence === "") {
        eventUpdates.recurrence = [];
      }

      // Call the server action to modify the event
      const result = await modifyCalendarEvent(eventId, eventUpdates);

      // Add the tool result
      if (result.success) {
        addToolResult({
          toolCallId,
          result: {
            status: "complete",
            message: "Calendar event was successfully updated.",
            event: result.event,
            eventLink: result.eventLink,
          },
        });
      } else {
        addToolResult({
          toolCallId,
          result: {
            status: "error",
            error: result.error || "Failed to update calendar event",
            details: result.details,
          }
        });
      }
    } catch (error: any) {
      addToolResult({
        toolCallId,
        result: {
          status: "error",
          error: error.message || "Failed to update calendar event",
        }
      });
    }
  };
};

/**
 * Handles cancellation of calendar event modification
 */
export const cancelModifyCalendarEventHandler = (addToolResult: ToolResultHandler) => {
  return (toolCallId: string) => {
    addToolResult({
      toolCallId,
      result: {
        status: "cancelled",
        message: "Calendar event modification cancelled by user.",
      },
    });
  };
};

/**
 * Handles deletion of calendar events
 */
export const deleteCalendarEventHandler = (addToolResult: ToolResultHandler) => {
  return async (eventId: string, toolCallId: string) => {
    try {
      // Call the server action to delete the event
      const result = await deleteCalendarEvent(eventId);

      // Add the tool result
      if (result.success) {
        addToolResult({
          toolCallId,
          result: {
            status: "complete",
            message: "Calendar event was successfully deleted.",
            event: result.event,
          },
        });
      } else {
        addToolResult({
          toolCallId,
          result: {
            status: "error",
            error: result.error || "Failed to delete calendar event",
            details: result.details,
          }
        });
      }
    } catch (error: any) {
      addToolResult({
        toolCallId,
        result: {
          status: "error",
          error: error.message || "Failed to delete calendar event",
        }
      });
    }
  };
};

/**
 * Handles cancellation of calendar event deletion
 */
export const cancelDeleteCalendarEventHandler = (addToolResult: ToolResultHandler) => {
  return (toolCallId: string) => {
    addToolResult({
      toolCallId,
      result: {
        status: "cancelled",
        message: "Calendar event deletion cancelled by user.",
      },
    });
  };
};

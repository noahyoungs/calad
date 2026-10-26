import React from "react";
import { Icon } from "@iconify-icon/react";
import { Alert, Button, Link } from "@heroui/react";
import CalendarEventConfirmation from "../../CalendarEventConfirmation";
import ModifyEventConfirmation from "../../calendar/ModifyEventConfirmation";
import DeleteEventConfirmation from "../../calendar/DeleteEventConfirmation";
import { prepareModificationChanges } from "../formatters";
import { CalendarEvent } from "../../../utils/calendarTypes";
import { formatEventSummary } from "@/utils/calendar/event-confirmation-utils";

interface CalendarToolInvocationProps {
  toolInvocation: any;
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

const CalendarToolInvocation: React.FC<CalendarToolInvocationProps> = ({
  toolInvocation,
  handleCreateCalendarEvent,
  handleCancelCalendarEvent,
  handleModifyCalendarEvent,
  handleCancelModifyCalendarEvent,
  handleDeleteCalendarEvent,
  handleCancelDeleteCalendarEvent,
  handleToolCallError,
  isLoading = false,
}) => {
  const { toolName, toolCallId, state, args, result } = toolInvocation;

  // Handle event creation tools
  if (["createCalendarEvent", "createAllDayEvent"].includes(toolName)) {
    return renderEventCreationTool(
      toolName as "createCalendarEvent" | "createAllDayEvent",
      toolCallId,
      state,
      args,
      result,
      handleCreateCalendarEvent,
      handleCancelCalendarEvent,
      isLoading
    );
  }

  // Handle event modification tool
  if (toolName === "modifyCalendarEvent") {
    return renderEventModificationTool(
      toolCallId,
      state,
      args,
      result,
      handleModifyCalendarEvent,
      handleCancelModifyCalendarEvent,
      handleToolCallError
    );
  }

  // Handle event deletion tool
  if (toolName === "deleteCalendarEvent") {
    return renderEventDeletionTool(
      toolCallId,
      state,
      args,
      result,
      handleDeleteCalendarEvent,
      handleCancelDeleteCalendarEvent,
      handleToolCallError
    );
  }

  // Handle view calendar events tool
  if (toolName === "listCalendarEvents") {
    return renderlistCalendarEventsTool(toolCallId, state, result);
  }

  // Handle search calendar events tool
  if (toolName === "searchCalendarEvents") {
    return renderSearchCalendarEventsTool(toolCallId, state, args, result);
  }

  return null;
};

const renderEventCreationTool = (
  toolName: "createCalendarEvent" | "createAllDayEvent",
  toolCallId: string,
  state: string,
  args: any,
  result: any,
  handleCreateCalendarEvent?: (event: CalendarEvent, toolCallId: string) => Promise<void>,
  handleCancelCalendarEvent?: (toolCallId: string) => void,
  isLoading?: boolean
) => {
  switch (state) {
    case "partial-call":
      return (
        <CalendarEventConfirmation
          key={toolCallId}
          toolName={toolName}
          args={args}
          disabled={true}
          showButtons={false}
        />
      );

    case "call":
      return (
        <CalendarEventConfirmation
          key={toolCallId}
          toolName={toolName}
          args={args}
          onConfirm={(event) => {
            if (handleCreateCalendarEvent) {
              return handleCreateCalendarEvent(event, toolCallId);
            }
            return Promise.resolve();
          }}
          onCancel={() => handleCancelCalendarEvent?.(toolCallId)}
          disabled={isLoading}
        />
      );

    case "result":
      if (result.status === "complete") {
        return (
          <Alert
            key={toolCallId}
            className="sm:flex-row flex-col items-center gap-3 sm:items-start sm:gap-2 mt-2 text-pretty ph-no-capture"
            classNames={{
              title: "text-center sm:text-start",
              description: "text-center sm:text-start",
              mainWrapper: "items-center sm:items-start"
            }}
            color="success"
            variant="flat"
            title="Calendar event created successfully"
            description={formatEventSummary(result.event)}
            endContent={
              <div className="w-full sm:w-auto flex justify-center mt-3 sm:mt-0">
                <Button
                  as={Link}
                  href={result.eventLink}
                  color="success"
                  variant="flat"
                  startContent={
                    <Icon icon="tabler:calendar-share" width={20} height={20} />
                  }
                  isExternal
                >
                  View in Google Calendar
                </Button>
              </div>
            }
          />
        );
      } else if (result.status === "error") {
        return (
          <Alert
            key={toolCallId}
            className="sm:flex-row flex-col items-center gap-3 sm:items-start sm:gap-2 mt-2"
            classNames={{
              title: "text-center sm:text-start",
              description: "text-center sm:text-start",
              mainWrapper: "items-center sm:items-start"
            }}
            color="danger"
            variant="flat"
            title={`Error: ${result.error}`}
            description={result.details || "Failed to create the calendar event"}
            endContent={
              result.error === "Google authentication token not available" ? (
                <Button as={Link} href={`${process.env.NEXT_PUBLIC_APP_URL}/reauthorize`} color="danger" size="sm" variant="flat">
                  Reauthorize
                </Button>
              ) : null
            }
          />
        );
      } else if (result.status === "cancelled") {
        return (
          <Alert
            key={toolCallId}
            className="sm:flex-row flex-col items-center gap-3 sm:items-start sm:gap-2 mt-2"
            classNames={{
              title: "text-center sm:text-start",
              description: "text-center sm:text-start",
              mainWrapper: "items-center sm:items-start"
            }}
            color="default"
            variant="flat"
            title="Calendar event creation cancelled"
          />
        );
      }
      return null;
  }
};

const renderEventModificationTool = (
  toolCallId: string,
  state: string,
  args: any,
  result: any,
  handleModifyCalendarEvent?: (eventId: string, toolCallId: string) => Promise<void>,
  handleCancelModifyCalendarEvent?: (toolCallId: string) => void,
  handleToolCallError?: (toolCallId: string, errorMessage: any) => void
) => {

  // console.log('Tool args:', args);

  switch (state) {
    case "partial-call":
      return (
        <Alert
          key={toolCallId}
          className="sm:flex-row flex-col items-center gap-3 sm:items-start sm:gap-2 mt-2"
          classNames={{
              title: "text-center sm:text-start",
              description: "text-center sm:text-start",
              mainWrapper: "items-center sm:items-start"
            }}
          color="default"
          variant="flat"
          title="Preparing calendar event modification..."
        />
      );

    case "call":
      const changes = prepareModificationChanges(args);

      return (
        <ModifyEventConfirmation
          key={toolCallId}
          eventId={args.eventId}
          changes={changes}
          onConfirm={(eventId) => {
            if (handleModifyCalendarEvent) {
              return handleModifyCalendarEvent(eventId, toolCallId);
            }
            return Promise.resolve();
          }}
          onCancel={() => handleCancelModifyCalendarEvent?.(toolCallId)}
          onError={(errorMessage: string) => handleToolCallError?.(toolCallId, errorMessage)}
        />
      );

    case "result":
      if (result.status === "complete") {
        return (
          <Alert
            key={toolCallId}
            className="sm:flex-row flex-col items-center gap-3 sm:items-start sm:gap-2 mt-2 ph-no-capture"
            classNames={{
              title: "text-center sm:text-start",
              description: "text-center sm:text-start",
              mainWrapper: "items-center sm:items-start"
            }}
            color="success"
            variant="flat"
            title="Calendar event updated successfully"
            description={formatEventSummary(result.event)}
            endContent={
              <div className="w-full sm:w-auto flex justify-center mt-3 sm:mt-0">
                <Button
                  as={Link}
                  href={result.eventLink}
                  color="success"
                  variant="flat"
                  startContent={
                    <Icon icon="tabler:calendar-share" width={20} height={20} />
                  }
                  isExternal
                >
                  View in Google Calendar
                </Button>
              </div>
            }
          />
        );
      } else if (result.status === "error") {
        return (
          <Alert
            key={toolCallId}
            className="sm:flex-row flex-col items-center gap-3 sm:items-start sm:gap-2 mt-2"
            classNames={{
              title: "text-center sm:text-start",
              description: "text-center sm:text-start",
              mainWrapper: "items-center sm:items-start"
            }}
            color="danger"
            variant="flat"
            title={`Error: ${result.error}`}
            description={result.details || "Failed to update the calendar event"}
          />
        );
      } else if (result.status === "cancelled") {
        return (
          <Alert
            key={toolCallId}
            className="sm:flex-row flex-col items-center gap-3 sm:items-start sm:gap-2 mt-2"
            classNames={{
              title: "text-center sm:text-start",
              description: "text-center sm:text-start",
              mainWrapper: "items-center sm:items-start"
            }}
            color="default"
            variant="flat"
            title="Calendar event modification cancelled"
          />
        );
      }
      return null;
  }
};

const renderEventDeletionTool = (
  toolCallId: string,
  state: string,
  args: any,
  result: any,
  handleDeleteCalendarEvent?: (eventId: string, toolCallId: string) => Promise<void>,
  handleCancelDeleteCalendarEvent?: (toolCallId: string) => void,
  handleToolCallError?: (toolCallId: string, errorMessage: any) => void
) => {
  switch (state) {
    case "partial-call":
      return (
        <Alert
          key={toolCallId}
          className="sm:flex-row flex-col items-center gap-3 sm:items-start sm:gap-2 mt-2"
          classNames={{
            title: "text-center sm:text-start",
            description: "text-center sm:text-start",
            mainWrapper: "items-center sm:items-start"
          }}
          color="default"
          variant="flat"
          title="Preparing to delete calendar event..."
        />
      );

    case "call":
      return (
        <DeleteEventConfirmation
          key={toolCallId}
          eventId={args.eventId}
          eventDate={args.eventDate || ""}
          onConfirm={(eventId) => {
            if (handleDeleteCalendarEvent) {
              return handleDeleteCalendarEvent(eventId, toolCallId);
            }
            return Promise.resolve();
          }}
          onCancel={() => handleCancelDeleteCalendarEvent?.(toolCallId)}
          onError={(errorMessage: string) => handleToolCallError?.(toolCallId, errorMessage)}
        />
      );

    case "result":
      if (result.status === "complete") {
        return (
          <Alert
            key={toolCallId}
            className="sm:flex-row flex-col items-center gap-3 sm:items-start sm:gap-2 mt-2 ph-no-capture"
            classNames={{
              title: "text-center sm:text-start",
              description: "text-center sm:text-start",
              mainWrapper: "items-center sm:items-start"
            }}
            color="success"
            variant="flat"
            title="Calendar event deleted successfully"
            description={formatEventSummary(result.event)}
          />
        );
      } else if (result.status === "error") {
        return (
          <Alert
            key={toolCallId}
            className="sm:flex-row flex-col items-center gap-3 sm:items-start sm:gap-2 mt-2"
            classNames={{
              title: "text-center sm:text-start",
              description: "text-center sm:text-start",
              mainWrapper: "items-center sm:items-start"
            }}
            color="danger"
            variant="flat"
            title={`Error: ${result.error}`}
            description={result.details || "Failed to delete the calendar event"}
          />
        );
      } else if (result.status === "cancelled") {
        return (
          <Alert
            key={toolCallId}
            className="sm:flex-row flex-col items-center gap-3 sm:items-start sm:gap-2 mt-2"
            classNames={{
              title: "text-center sm:text-start",
              description: "text-center sm:text-start",
              mainWrapper: "items-center sm:items-start"
            }}
            color="default"
            variant="flat"
            title="Calendar event deletion cancelled"
          />
        );
      }
      return null;
  }
};

const renderlistCalendarEventsTool = (
  toolCallId: string,
  state: string,
  result: any
) => {
  if (state === "call") {
    return (
      <Alert
        key={toolCallId}
        className="sm:flex-row flex-col items-center gap-3 sm:items-start sm:gap-2 mt-2"
        classNames={{
          title: "text-center sm:text-start",
          description: "text-center sm:text-start",
          mainWrapper: "items-center sm:items-start"
        }}
        color="default"
        variant="flat"
        title="Fetching your calendar events..."
      />
    );
  }
  
  if (state === "result") {
    if (result.status === "complete") {
      return (
        <Alert
          key={toolCallId}
          className="sm:flex-row flex-col items-center gap-3 sm:items-start sm:gap-2 mt-2"
          classNames={{
            title: "text-center sm:text-start",
            description: "text-center sm:text-start",
            mainWrapper: "items-center sm:items-start"
          }}
          color="default"
          variant="flat"
          title="Viewed your calendar events"
        />
      );
    } else if (result.status === "error") {
      return (
        <Alert
          key={toolCallId}
          className="sm:flex-row flex-col items-center gap-3 sm:items-start sm:gap-2 mt-2"
          classNames={{
            title: "text-center sm:text-start",
            description: "text-center sm:text-start"
          }}
          color="danger"
          variant="flat"
          title={`Error: ${result.error}`}
          description={result.details || "Failed to retrieve calendar events"}
        />
      );
    }
  }
  return null;
};

const renderSearchCalendarEventsTool = (
  toolCallId: string,
  state: string,
  args: any,
  result: any
) => {
  if (state === "call") {
    return (
      <Alert
        key={toolCallId}
        className="sm:flex-row flex-col items-center gap-3 sm:items-start sm:gap-2 mt-2"
        classNames={{
          title: "text-center sm:text-start",
          description: "text-center sm:text-start"
        }}
        color="default"
        variant="flat"
        title={`Searching your calendar events for "${args.query}"...`}
      />
    );
  }
  
  if (state === "result") {
    if (result.status === "complete") {
      return (
        <Alert
          key={toolCallId}
          className="sm:flex-row flex-col items-center gap-3 sm:items-start sm:gap-2 mt-2"
          classNames={{
            title: "text-center sm:text-start",
            description: "text-center sm:text-start"
          }}
          color="default"
          variant="flat"
          title={`Searched your calendar events for "${args.query}"`}
          description={`Found ${result.eventInstances.length} events`}
        />
      );
    } else if (result.status === "error") {
      return (
        <Alert
          key={toolCallId}
          className="sm:flex-row flex-col items-center gap-3 sm:items-start sm:gap-2 mt-2"
          classNames={{
            title: "text-center sm:text-start",
            description: "text-center sm:text-start"
          }}
          color="danger"
          variant="flat"
          title={`Error: ${result.error}`}
          description={result.details || "Failed to search calendar events"}
        />
      );
    }
  }
  return null;
};

export default CalendarToolInvocation; 
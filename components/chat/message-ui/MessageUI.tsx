import React from "react";
import { Icon } from "@iconify-icon/react";
import { Link } from "@heroui/react";
import { renderTextPart } from "../message-utils";
import { MarkdownItem } from "../types";
import CalendarToolInvocation from "../calendar/CalendarToolInvocation";
import { CalendarEvent } from "../../../utils/calendarTypes";

interface MessageUIProps {
  role: string;
  userName?: string;
  experimental_attachments?: any[];
  memoizedMarkdowns: MarkdownItem[];
  parts?: any[];
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

const MessageUI: React.FC<MessageUIProps> = ({
  role,
  userName = "You",
  experimental_attachments,
  memoizedMarkdowns,
  parts,
  handleCreateCalendarEvent,
  handleCancelCalendarEvent,
  handleModifyCalendarEvent,
  handleCancelModifyCalendarEvent,
  handleDeleteCalendarEvent,
  handleCancelDeleteCalendarEvent,
  handleToolCallError,
  isLoading = false,
}) => {
  // Function to render message parts in order
  const renderMessageParts = () => {
    if (!parts?.length) {
      // If no parts are available, render the first memoized markdown
      return memoizedMarkdowns[0].type === 'text' ? renderTextPart(memoizedMarkdowns[0], 0) : null;
    }

    return (
      <div className="flex flex-col gap-4 max-w-full">
        {memoizedMarkdowns.map((item, index) => {
          if (item.type === "text") {
            return renderTextPart(item, index);
          } else if (item.type === "tool-invocation") {
            return (
              <CalendarToolInvocation
                key={`tool-${index}`}
                toolInvocation={item.toolInvocation}
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
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row items-start gap-3 w-full">
      {/* Mobile: Icon and Name Group, Desktop: Just Icon */}
      <div className="flex flex-row items-center gap-3 md:block">
        {/* ICON */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            role === "user"
              ? "bg-[#FFF3C8] text-[#ECBA00] dark:bg-[#7C6200] dark:text-secondary-[#FFE277"
              : role === "system"
                ? "bg-danger-100 text-danger-600 dark:bg-danger-800 dark:text-danger-300"
                : "bg-primary-100 text-primary-600 dark:bg-primary-800 dark:text-primary-300"
          }`}
        >
          {role === "user" ? (
            <Icon icon="tabler:user" width={16} height={16} />
          ) : role === "system" ? (
            <Icon icon="tabler:alert-circle" width={16} height={16} />
          ) : (
            <Icon icon="tabler:robot" width={16} height={16} />
          )}
        </div>

        {/* NAME - Only visible on mobile */}
        <div className="flex items-center md:hidden">
          <span className="font-medium text-sm">
            {role === "user" ? userName : role === "system" ? "System" : "cal.ad"}
          </span>
        </div>
      </div>

      {/* Content Group including Name for desktop */}
      <div className="w-full">
        {/* NAME - Only visible on desktop */}
        <div className="hidden md:flex items-center mb-1">
          <span className="font-medium text-sm">
            {role === "user" ? userName : role === "system" ? "System" : "cal.ad"}
          </span>
        </div>

        {/* ATTACHMENTS */}
        {experimental_attachments && experimental_attachments.length > 0 && (
          <div className="mb-2 flex flex-col gap-2">
            {/* PDFs Group */}
            {experimental_attachments.some(
              (a) => a.contentType === "application/pdf"
            ) && (
              <div className="flex flex-wrap gap-2">
                {experimental_attachments
                  .filter(
                    (attachment) => attachment.contentType === "application/pdf"
                  )
                  .map((attachment, index) => (
                    <div
                      key={`pdf-${index}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-default-300 !bg-default-200 !text-foreground"
                    >
                      <Icon
                        icon="tabler:file-type-pdf"
                        className="text-danger"
                        width={20}
                      />
                      <Link
                        href={attachment.url}
                        isExternal
                        showAnchorIcon
                        className="text-sm font-medium"
                        underline="hover"
                        size="sm"
                        color="foreground"
                        anchorIcon={<Icon icon="tabler:external-link" className="ml-2" width={16} height={16} />}
                      >
                        {attachment.name}
                      </Link>
                    </div>
                  ))}
              </div>
            )}

            {/* Images Group */}
            {experimental_attachments.some((a) =>
              a.contentType?.startsWith("image/")
            ) && (
              <div className="flex flex-wrap gap-2">
                {experimental_attachments
                  .filter((attachment) =>
                    attachment.contentType?.startsWith("image/")
                  )
                  .map((attachment, index) => (
                    <div
                      key={`image-${index}`}
                      className="flex flex-col overflow-hidden max-w-[200px] w-full !bg-default-100 !text-foreground rounded-lg"
                    >
                      <div className="border-t border-x border-default-300 !bg-default-200 !text-foreground px-2 py-1 text-xs font-medium rounded-t-lg w-full">
                        <div
                          className="truncate max-w-full"
                          title={attachment.name}
                        >
                          {attachment.name}
                        </div>
                      </div>
                      <div className="relative w-full aspect-square bg-default-200 border border-default-300 rounded-b-lg">
                        <img
                          src={attachment.url}
                          alt={attachment.name || "Attached image"}
                          className="w-full h-full object-contain absolute inset-0 rounded-b-lg"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Render all message parts in order */}
        {renderMessageParts()}
      </div>
    </div>
  );
};

export default MessageUI; 
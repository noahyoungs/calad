import { appendResponseMessages, Message, streamText, generateText, generateObject, NoSuchToolError } from "ai";
import { saveChat, updateConversationTitle } from "@/actions/chat-store-actions";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";
import { format as formatFns, parseISO as parseISOFns } from "date-fns";
import { toZonedTime, format as formatTz } from 'date-fns-tz';
import { convertTimeZone, timeZoneSchemaEnum } from "@/utils/timeZoneUtils";
import { fetchCalendarEvents, searchCalendarEvents } from "@/utils/calendar";
import { vertex, openai } from "@/utils/ai-config";
import { isProUser } from "@/utils/subscription-utils";
import { repairToolCall } from "@/utils/repairToolCall";
import { PostHog } from 'posthog-node';
import { formatEventSummary } from "@/utils/calendar/event-confirmation-utils";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const generateTitle = async (messages: Message[]) => {
  // console.log("Generating title for messages");

  // clean messages, remove tool calls that arent results
  const cleanedMessages = messages.map((message) => {
   return {
    content: message.content,
    role: message.role,
    experimental_attachments: message.experimental_attachments,
   }
  }).filter((message) => message.role !== "system");

  cleanedMessages.push({
    content: "Your task is to generate a short, concise title (max 5 words) for this conversation. If this conversation you had with the user is about one or more calendar events, describe the event(s) in the title. Don't give titles like `Calendar event management` or `Create calendar event`, because most of the time it's not about calendar events. If it's not about calendar events, just return a short description of the conversation. Respond with a title in <title></title> tags.",
    role: "user",
    experimental_attachments: [],
  });

  cleanedMessages.push({
    content: "<title>",
    role: "assistant",
    experimental_attachments: [],
  });

  const { text } = await generateText({
    model: vertex("gemini-2.0-flash-lite"),
    messages: cleanedMessages,
    stopSequences: ["</title>"],
  });

  // remove <title> and </title> tags
  const title = text.replace("<title>", "").replace("</title>", "");
  
  console.log("Generated title:", title);
  return title;
};

function formatEventDateTime(dateStr: string) {
  try {
    const date = parseISOFns(dateStr);
    // Use formatFns to avoid conflicts
    return formatFns(date, "EEEE, MMMM d, yyyy 'at' h:mm a");
  } catch (error) {
    return dateStr;
  }
}

// Function to convert between timezones has been moved to utils/timeZoneUtils.ts

export async function POST(req: Request) {
  const supabase = await createClient();

  try {
    // Check authentication - properly handle async
    const authResult = await supabase.auth.getUser();
    const user = authResult.data.user;

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get request data
    const { messages, id } = await req.json();

    if (!id) {
      return new Response("Conversation ID is required", { status: 400 });
    }

    // Intentionally redundant check in addition to RLS
    // Verify the user has access to this conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!conversation || conversation.user_id !== user.id) {
      return new Response("Unauthorized", { status: 401 });
    }


    // Determine if user has access to advanced calendar features
    const hasAdvancedCalendarFeatures = await isProUser(user.id);

    // Define basic tools for all users
    const basicTools = {
      createCalendarEvent: {
        description: "Create a Google Calendar event",
        parameters: z.object({
          summary: z.string().describe("The title of the event"),
          description: z.string().describe("The description of the event").optional(),
          location: z.string().describe("The location of the event").optional(),
          startDateTime: z.string().describe("The (inclusive) start date and time of the event in ISO format"),
          endDateTime: z.string().describe("The (exclusive) end date and time of the event in ISO format"),
          startTimeZone: timeZoneSchemaEnum,
          endTimeZone: timeZoneSchemaEnum,
          addGoogleMeet: z.boolean().describe("Whether to add Google Meet video conferencing to the event").optional(),
          attendees: z.array(z.string()).describe("List of email addresses to invite to the event").optional(),
          notificationMinutesBefore: z.array(z.number()).describe("When to send notifications before the event, in minutes (e.g. [10, 60, 1440] for 10 minutes, 1 hour, and 1 day before)").optional(),
          recurrence: z.string().describe(`Recurrence pattern in RFC 5545 format (e.g. "RRULE:FREQ=DAILY;COUNT=5" for daily for 5 occurrences, "RRULE:FREQ=WEEKLY;UNTIL=20240630T000000Z;BYDAY=MO,WE,FR" for MWF until June 30, 2024, "RRULE:FREQ=MONTHLY;BYMONTHDAY=10" for monthly on the 10th day)`).optional(),
        }),
      },
      createAllDayEvent: {
        description: "Create an all-day Google Calendar event",
        parameters: z.object({
          summary: z.string().describe("The title of the event"),
          description: z.string().describe("The description of the event").optional(),
          location: z.string().describe("The location of the event").optional(),
          startDate: z.string().describe("The (inclusive) start date of the all-day event in YYYY-MM-DD format"),
          endDate: z.string().describe("The (exclusive) end date of the all-day event in YYYY-MM-DD format"),
          startTimeZone: timeZoneSchemaEnum,
          endTimeZone: timeZoneSchemaEnum,
          addGoogleMeet: z.boolean().describe("Whether to add Google Meet video conferencing to the event").optional(),
          attendees: z.array(z.string()).describe("List of email addresses to invite to the event").optional(),
          notificationMinutesBefore: z.array(z.number()).describe("When to send notifications before the event, in minutes (e.g. [10, 60, 1440] for 10 minutes, 1 hour, and 1 day before)").optional(),
          recurrence: z.string().describe(`Recurrence pattern in RFC 5545 format (e.g. "RRULE:FREQ=DAILY;COUNT=5" for daily for 5 occurrences, "RRULE:FREQ=WEEKLY;UNTIL=20240630T000000Z;BYDAY=MO,WE,FR" for MWF until June 30, 2024, "RRULE:FREQ=MONTHLY;BYMONTHDAY=10" for monthly on the 10th day)`).optional(),
        }),
      },
      convertTimeZone: {
        description: "Convert a date and time between different time zones",
        parameters: z.object({
          dateTime: z.string().describe("The date and time to convert. Can be a time only (e.g., '3:00 PM', '15:00') or a full date and time (e.g., '2023-11-25T15:30:00'). If only a time is provided, today's date will be used."),
          fromTimeZone: timeZoneSchemaEnum,
          toTimeZone: timeZoneSchemaEnum,
        }),
        execute: async (parameters: {
          dateTime: string;
          fromTimeZone: string;
          toTimeZone: string;
        }) => {
          const { dateTime, fromTimeZone, toTimeZone } = parameters;
          
          try {
            const result = convertTimeZone(dateTime, fromTimeZone, toTimeZone);
            
            if ('error' in result) {
              return {
                status: "error", 
                error: result.error
              };
            }
            
            return {
              status: "complete",
              conversion: result
            };
          } catch (error) {
            return {
              status: "error",
              error: error instanceof Error ? error.message : "An unknown error occurred"
            };
          }
        }
      }
    };

    // Define premium tools that will only be added for premium users
    const premiumTools = {
      listCalendarEvents: {
        description: "View the user's calendar/schedule during a specified time range",
        parameters: z.object({
          timeMin: z.string().describe("The start time of the range to search for events in ISO format with no timezone offset (e.g. '2023-11-25T00:00:00')"),
          timeMax: z.string().describe("The end time of the range to search for events in ISO format with no timezone offset (e.g. '2023-11-26T23:59:59')"),
          timeZone: timeZoneSchemaEnum.describe("The time zone to use for the search"),
        }),
        execute: async (parameters: {
          timeMin: string;
          timeMax: string;
          timeZone: string;
        }) => {
          try {
            // Get the authenticated user
            const authResult = await supabase.auth.getUser();
            const user = authResult.data.user;
            if (!user) {
              return {
                status: "error",
                error: "User not authenticated"
              };
            }

            // --- Format timestamps with timezone offset ---
            // Parse the date strings without assuming a timezone initially
            // Google API expects RFC3339 format (e.g., '2011-06-03T10:00:00-07:00', or '2011-06-03T10:00:00Z')
            const timeMinDate = parseISOFns(parameters.timeMin);
            const timeMaxDate = parseISOFns(parameters.timeMax);
            
            // Convert the parsed date (interpreted as local time in the target timezone) to UTC
            const timeMinUtc = toZonedTime(timeMinDate, parameters.timeZone);
            const timeMaxUtc = toZonedTime(timeMaxDate, parameters.timeZone);

            // Format the UTC date into RFC3339 format with offset
            const formattedTimeMin = formatTz(timeMinUtc, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: parameters.timeZone });
            const formattedTimeMax = formatTz(timeMaxUtc, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: parameters.timeZone });
            // --- End Formatting ---

            // Use the fetchCalendarEvents function from calendar-utils.ts with formatted timestamps
            const result = await fetchCalendarEvents(
              user.id,
              formattedTimeMin, // Pass formatted timeMin
              formattedTimeMax, // Pass formatted timeMax
              parameters.timeZone // Keep passing original timeZone for reference if needed by the function internally
            );

            if (!result.success) {
              return {
                status: "error",
                error: result.error || "Failed to fetch calendar events",
                details: result.details
              };
            }

            let eventsToReturn = result.events;
            if (eventsToReturn && Array.isArray(eventsToReturn)) {
              eventsToReturn = eventsToReturn.map(event => {
                const gcalEvent = event as any;
                const transformedEvent = { ...gcalEvent };
                return transformedEvent;
              });
            }
            
            return {
              status: "complete",
              eventInstances: eventsToReturn
            };
          } catch (error: any) {
            console.error("Error fetching calendar events:", error);
            return {
              status: "error",
              error: error.message || "An error occurred while fetching calendar events",
              details: error.response?.data?.error || "Unknown error"
            };
          }
        }
      },
      searchCalendarEvents: {
        description: "Search for calendar events matching specific terms",
        parameters: z.object({
          query: z.string().describe("Free text search terms to find events that match these terms in summary, description, location, attendee names/emails, etc."),
          timeMin: z.string().optional().describe("Optional: The start time of the range to search for events in ISO format (e.g. '2023-11-25T00:00:00Z')"),
          timeMax: z.string().optional().describe("Optional: The end time of the range to search for events in ISO format (e.g. '2023-11-26T23:59:59Z')"),
          timeZone: timeZoneSchemaEnum.optional().describe("Optional: The time zone to use for the search"),
        }),
        execute: async (parameters: {
          query: string;
          timeMin?: string;
          timeMax?: string;
          timeZone?: string;
        }) => {
          try {
            // Get the authenticated user
            const authResult = await supabase.auth.getUser();
            const user = authResult.data.user;
            if (!user) {
              return {
                status: "error",
                error: "User not authenticated"
              };
            }

            // --- Format timestamps if provided ---
            let formattedTimeMin: string | undefined = undefined;
            let formattedTimeMax: string | undefined = undefined;

            if (parameters.timeMin && parameters.timeZone) {
              const timeMinDate = parseISOFns(parameters.timeMin);
              const timeMinUtc = toZonedTime(timeMinDate, parameters.timeZone);
              formattedTimeMin = formatTz(timeMinUtc, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: parameters.timeZone });
            }
            if (parameters.timeMax && parameters.timeZone) {
              const timeMaxDate = parseISOFns(parameters.timeMax);
              const timeMaxUtc = toZonedTime(timeMaxDate, parameters.timeZone);
              formattedTimeMax = formatTz(timeMaxUtc, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: parameters.timeZone });
            }
            // --- End Formatting ---

            // Use the searchCalendarEvents function
            const result = await searchCalendarEvents(
              user.id,
              parameters.query,
              formattedTimeMin, // Pass formatted timeMin
              formattedTimeMax, // Pass formatted timeMax
              parameters.timeZone
            );

            if (!result.success) {
              return {
                status: "error",
                error: result.error || "Failed to search calendar events",
                details: result.details
              };
            }

            let eventsToReturn = result.events;
            if (eventsToReturn && Array.isArray(eventsToReturn)) {
              eventsToReturn = eventsToReturn.map(event => {
                const gcalEvent = event as any;
                const transformedEvent = { ...gcalEvent };
                return transformedEvent;
              });
            }

            return {
              status: "complete",
              eventInstances: eventsToReturn
            };
          } catch (error: any) {
            console.error("Error searching calendar events:", error);
            return {
              status: "error",
              error: error.message || "An error occurred while searching calendar events",
              details: error.response?.data?.error || "Unknown error"
            };
          }
        }
      },
      modifyCalendarEvent: {
        description: "Modify an existing Google Calendar event",
        parameters: z.object({
          eventId: z.string().describe("The ID of the event to modify"),
          summary: z.string().describe("The title of the event").optional(),
          description: z.string().describe("The description of the event").optional(),
          location: z.string().describe("The location of the event").optional(),
          startDateTime: z.string().describe("The (inclusive) start date and time of the event in ISO format (e.g. '2023-11-25T15:30:00')").optional(),
          endDateTime: z.string().describe("The (exclusive) end date and time of the event in ISO format (e.g. '2023-11-25T16:30:00')").optional(),
          startDate: z.string().describe("The (inclusive) start date of an all-day event in YYYY-MM-DD format (e.g. '2023-11-25')").optional(),
          endDate: z.string().describe("The (exclusive) end date of an all-day event in YYYY-MM-DD format").optional(),
          startTimeZone: timeZoneSchemaEnum.optional(),
          endTimeZone: timeZoneSchemaEnum.optional(),
          addGoogleMeet: z.boolean().describe("Set to true to add Google Meet video conferencing to the event. Set to false to remove it.").optional(),
          attendees: z.array(z.string()).describe("List of email addresses to invite to the event. Set to an empty array to remove all attendees.").optional(),
          notificationMinutesBefore: z.array(z.number()).describe("When to send notifications before the event, in minutes (e.g. [10, 60, 1440] for 10 minutes, 1 hour, and 1 day before. Set to an empty array to disable notifications.)").optional(),
          recurrence: z.string().describe("Recurrence pattern in RFC 5545 format. Set to an empty string to remove the recurrence.").optional(),
        }),
      },
      deleteCalendarEvent: {
        description: "Delete a Google Calendar event",
        parameters: z.object({
          eventId: z.string().describe("The ID of the event to delete"),
        }),
      }
    };

    // Select the tools based on the user's plan
    const tools = hasAdvancedCalendarFeatures ? { ...basicTools, ...premiumTools } : basicTools;

    // Add the text that will be shown to the user after the tool call is finished
    // To prevent LLM from generating redundant text
    // Create a deep copy of messages for modification
    const messagesForStream = JSON.parse(JSON.stringify(messages));

    if (messagesForStream.length > 0) {
      console.debug("Processing messages, length:", messagesForStream.length);
      const lastMessage = messagesForStream[messagesForStream.length - 1];
      
      if (lastMessage.role === 'assistant' && Array.isArray(lastMessage.parts)) {
        console.debug("Found assistant message with parts array");
        const toolResultParts = lastMessage.parts.filter((part: any) => 
          part.type === 'tool-invocation' && 
          part.toolInvocation?.state === 'result'
        );
        console.debug("Found tool result parts");

        // Add markdown conversions of what the user sees for tool call results, to prevent the LLM from generating redundant text
        if (toolResultParts.length > 0) {
          const resultTexts = toolResultParts.map((part: any) => {
            if (part.toolInvocation.name === 'createCalendarEvent' || part.toolInvocation.name === 'createAllDayEvent') {
              console.debug("Processing tool result part:", JSON.stringify(part, null, 2));
              const result = part.toolInvocation.result;
              
              if (result.status === "complete") {
                return `> ✅ Calendar event created successfully\n> ${formatEventSummary(result.event)}\n> [View in Google Calendar](${result.eventLink})\n\n `;
              } else if (result.status === "error") {
                return `> ❌ Error: ${result.error}\n\n`;
              } else if (result.status === "cancelled") {
                return `> ℹ️ Calendar event creation cancelled\n\n`;
              }
            } else if (part.toolInvocation.name === 'modifyCalendarEvent') {
              const result = part.toolInvocation.result;
              
              if (result.status === "complete") {
                const event = result.event;
                return `> ✅ Calendar event updated successfully\n> ${formatEventSummary(event)}\n> [View in Google Calendar](${result.eventLink})\n\n`;
              } else if (result.status === "error") {
                return `> ❌ Error: ${result.error}\n\n`;
              } else if (result.status === "cancelled") {
                return `> ℹ️ Calendar event modification cancelled\n\n`;
              }
            } else if (part.toolInvocation.name === 'deleteCalendarEvent') {
              const result = part.toolInvocation.result;
              
              if (result.status === "complete") {
                const event = result.event || {};
                return `> ✅ Calendar event deleted successfully\n> ${formatEventSummary(event)}\n\n`;
              } else if (result.status === "error") {
                return `> ❌ Error: ${result.error}\n\n`;
              } else if (result.status === "cancelled") {
                return `> ℹ️ Calendar event deletion cancelled\n\n`;
              }
            } else if (part.toolInvocation.name === 'listCalendarEvents') {
              const result = part.toolInvocation.result;
              
              if (result.status === "complete") {
                const { events } = result;
                if (events.length === 0) {
                  return `> 📅 No events found in your calendar\n\n`;
                }
                
                return `> 📅 Retrieved ${events.length} events from your calendar\n\n`;
              } else if (result.status === "error") {
                return `> ❌ Error fetching events: ${result.error}${result.details ? ` (Details: ${JSON.stringify(result.details)})` : ''}\n\n`;
              }
            } else if (part.toolInvocation.name === 'searchCalendarEvents') {
              const result = part.toolInvocation.result;
              
              if (result.status === "complete") {
                const { events } = result;
                const timeRange = result.timeMin && result.timeMax 
                  ? `${formatEventDateTime(result.timeMin)} to ${formatEventDateTime(result.timeMax)}` // Format returned times
                  : 'all time';
                
                if (events.length === 0) {
                  return `> 🔍 No events found matching in your calendar${timeRange !== 'all time' ? ` for ${timeRange}` : ''}\n\n`;
                }
                
                return `> 🔍 Found ${events.length} events matching in your calendar\n> Time period: ${timeRange}\n\n`;
              } else if (result.status === "error") {
                 return `> ❌ Error searching events: ${result.error}${result.details ? ` (Details: ${JSON.stringify(result.details)})` : ''}\n\n`;
              }
            } else if (part.toolInvocation.name === 'convertTimeZone') {
              const result = part.toolInvocation.result;
              if (result.status === "complete") {
                const conversion = result.conversion;
                return `> ✅ Time conversion completed\n> ${conversion.originalDateTime} in ${conversion.originalTimeZone}\n> ➡️ ${conversion.convertedDateTime} in ${conversion.targetTimeZone}\n\n`;
              } else if (result.status === "error") {
                return `> ❌ Time conversion error: ${result.error}\n\n`;
              }
            }
            return null;
          }).filter(Boolean);

          console.debug("Generated result texts:", resultTexts);
          
          if (resultTexts.length > 0) {
            // Add a text part with the markdown representation
            const newTextPart = {
              type: 'text',
              text: '\n\n' + resultTexts.join('\n\n')
            };
            console.debug("Adding new text part:", JSON.stringify(newTextPart, null, 2));
            lastMessage.parts.push(newTextPart);
            console.debug("Updated message parts:", JSON.stringify(lastMessage.parts, null, 2));
          }
        }
      }
    }

    // Process the chat with AI using the modified copy of messages
    const result = streamText({
      model: hasAdvancedCalendarFeatures ? vertex("gemini-2.5-flash") : vertex("gemini-2.0-flash"),
      messages: messagesForStream,
      tools,
      onError: (event) => {
        console.error("Chat API Error:", event.error);
        try {
          // Attempt to extract stack trace if the error is an Error object
          const errorObj = event.error as Error;
          if (errorObj && errorObj.stack) {
            console.error("Error Stack Trace:", errorObj.stack);
          }
        } catch (e) {
          console.error("Could not extract stack trace from error");
        }
      },
      async onFinish({ response }) {
        try {
          // Save the messages
          const updatedMessages = appendResponseMessages({
            messages,
            responseMessages: response.messages,
          });

          console.debug("Saving messages");

          const saveResult = await saveChat({
            id,
            messages: updatedMessages,
          });

          if (!saveResult.success) {
            console.error("Failed to save chat:", saveResult.error);
            return;
          }

          // Capture PostHog event if conditions are met
          const lastMessage = updatedMessages[updatedMessages.length - 1];
          if (
            lastMessage &&
            lastMessage.role === "assistant" &&
            typeof lastMessage.content === "string" &&
            lastMessage.content.includes(`${process.env.NEXT_PUBLIC_APP_URL}/plus-upgrade`)
          ) {
            const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
              host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
              flushAt: 1,
              flushInterval: 0
            });
            posthogClient.capture({
              distinctId: user.id,
              event: "chat_ai_upsell",
            });
            await posthogClient.shutdown(); // Ensure the event is sent
            console.log("Captured chat_ai_upsell event for user:", user.id);
          }

          // Generate a title
          if (messages.length >= 1) {
            try {
              const newTitle = await generateTitle(messages);
              if (newTitle) {
                // Update the conversation title
                await updateConversationTitle(id, newTitle);
                console.log("Title updated in database");
              } else {
                console.warn("No title generated");
              }
            } catch (error: unknown) {
              const err = error as Error;
              console.warn("Error generating title");
              // Log stack trace for title generation errors
              console.debug("Title Generation Error Stack:", err.stack);
            }
          }
        } catch (error: unknown) {
          const err = error as Error;
          console.error("Error in onFinish callback:", err);
          // Log stack trace for onFinish errors
          console.error("onFinish Error Stack:", err.stack);
        }
      },
      toolCallStreaming: true,
      maxRetries: 10,
      //@ts-ignore
      experimental_repairToolCall: repairToolCall,
    });

    // Consume the stream to ensure it runs to completion even if client disconnects
    result.consumeStream();

    return result.toDataStreamResponse();
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Unhandled error in chat API route:", err);
    // Log stack trace for unhandled errors
    console.error("Unhandled Error Stack:", err.stack);
    return new Response(JSON.stringify({ error: "Internal server error" }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}

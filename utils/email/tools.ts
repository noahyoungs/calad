import { tool } from "ai";
import { 
  addCalendarEventInternal, 
  modifyCalendarEventInternal, 
  deleteCalendarEventInternal 
} from "@/utils/calendar";
import { fetchCalendarEvents, searchCalendarEvents } from "@/utils/calendar";
import { createEmailSchemas } from "./types";
import { convertTimeZone } from "@/utils/timeZoneUtils";
import { sendEmailReply } from "@/utils/email/email-utils";
import { CalendarEvent } from "@/utils/calendarTypes";
import crypto from "crypto";
import { recordEmailEvent, checkEmailEventLimit } from "@/utils/subscription-utils";
import { format as formatFns, parseISO as parseISOFns } from "date-fns";
import { toZonedTime, format as formatTz } from 'date-fns-tz';
import PostHogClient from "@/utils/posthog";

export function createEmailTools(
  userId: string, 
  sender: string, 
  bodyPlain: string, 
  controller: AbortController,
  defaultTimeZone: string,
  enableAdvancedCalendarFeatures: boolean,
  messageId?: string,
  references?: string
) {
  // Create schemas with the defaultTimeZone
  const {
    emailReplySchema,
    timeZoneConversionSchema,
    listCalendarEventsSchema,
    searchCalendarEventsSchema,
    modifyCalendarEventSchema,
    deleteCalendarEventSchema,
    timedEventSchema,
    allDayEventSchema
  } = createEmailSchemas(defaultTimeZone);

  // Define the basic tools 
  const basicTools = {
    createTimedEvent: tool({
      description: "Create a calendar event with specific start and end times",
      parameters: timedEventSchema,
      async execute(args) {
        console.log('Starting createTimedEvent execution with args:', {
          summary: args.summary,
          startDateTime: args.startDateTime,
          endDateTime: args.endDateTime,
          startTimeZone: args.startTimeZone,
          endTimeZone: args.endTimeZone,
          location: args.location,
          attendees: args.attendees
        });

        try {
          // Check if user is a free user and if they've exceeded their email event limit
          if (!enableAdvancedCalendarFeatures && messageId) {
            const canCreateEvent = await checkEmailEventLimit(userId);
            if (!canCreateEvent) {
              console.log('User has exceeded email event limit:', userId);
              
              // Capture PostHog event
              const posthogClient = PostHogClient();
              posthogClient.capture({
                distinctId: userId,
                event: "email_event_limit_exceeded",
                properties: {
                  source: "createTimedEvent",
                  message_id: messageId
                }
              });
              await posthogClient.shutdown();

              // Send an email to the user informing them they've reached their limit
              await sendEmailReply(
                sender,
                "Email Event Limit Reached - Upgrade to cal.ad Plus",
                `You have reached your limit of 10 email-to-calendar events per month on the Free plan. Upgrade to cal.ad Plus for unlimited email events and additional features like viewing, modifying, and deleting events.\n\nUpgrade your plan [here](${process.env.NEXT_PUBLIC_APP_URL}/plus-upgrade).`,
                bodyPlain,
                undefined,
                messageId,
                references
              );
              
              // Abort the controller to stop further processing
              controller.abort();
              
              return {
                status: "error",
                error: "Email event limit exceeded. You have reached your limit of 10 email-to-calendar events per month on the Free plan."
              };
            }
          }
          // Create the event data
          const eventData: CalendarEvent = {
            summary: args.summary,
            description: args.description,
            location: args.location,
            start: {
              dateTime: args.startDateTime?.replace(/([+-]\d{2}:?\d{2})?Z?$/, ''),
              timeZone: args.startTimeZone
            },
            end: {
              dateTime: args.endDateTime?.replace(/([+-]\d{2}:?\d{2})?Z?$/, ''),
              timeZone: args.endTimeZone
            },
            attendees: args.attendees?.map((email: string) => ({ email })),
            conferenceData: args.addGoogleMeet ? {
              createRequest: {
                requestId: crypto.randomUUID(),
                conferenceSolutionKey: {
                  type: 'hangoutsMeet'
                }
              }
            } : undefined,
            // Add reminders if provided
            reminders: args.notificationMinutesBefore ? {
              useDefault: false,
              overrides: args.notificationMinutesBefore.map((minutes: number) => ({
                method: "popup",
                minutes
              }))
            } : undefined,
            // Add recurrence if provided
            recurrence: args.recurrence ? [args.recurrence] : undefined
          };

          const result = await addCalendarEventInternal(userId, eventData);
          
          if (!result.success) {
            console.error('Failed to create timed calendar event:', {
              error: result.error,
              details: result.details,
              source: result.source,
              context: {
                userId,
                eventSummary: args.summary,
                eventType: 'timed',
                hasAttendees: !!args.attendees?.length,
                hasGoogleMeet: args.addGoogleMeet
              }
            });
            return {
              status: "error",
              error: result.error || "Failed to create calendar event"
            };
          }

          const response = {
            status: "complete",
            event: result.event,
            eventLink: result.eventLink
          };
          
          // Record the email event usage for free users
          if (!enableAdvancedCalendarFeatures && messageId) {
            await recordEmailEvent(userId, messageId);
          }
          
          return response;
        } catch (error: any) {
          console.error('Error in createTimedEvent execute:', {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack
            },
            context: {
              userId,
              eventSummary: args.summary,
              eventType: 'timed',
              hasAttendees: !!args.attendees?.length,
              hasGoogleMeet: args.addGoogleMeet
            }
          });
          return {
            status: "error",
            error: error.message || "An unexpected error occurred while creating the timed calendar event"
          };
        }
      }
    }),

    createAllDayEvent: tool({
      description: "Create an all-day calendar event spanning one or more days",
      parameters: allDayEventSchema,
      async execute(args) {
        console.log('Starting createAllDayEvent execution with args:', {
          summary: args.summary,
          startDate: args.startDate,
          endDate: args.endDate,
          startTimeZone: args.startTimeZone,
          endTimeZone: args.endTimeZone,
          location: args.location,
          attendees: args.attendees
        });

        try {
          // Check if user is a free user and if they've exceeded their email event limit
          if (!enableAdvancedCalendarFeatures && messageId) {
            const canCreateEvent = await checkEmailEventLimit(userId);
            if (!canCreateEvent) {
              console.log('User has exceeded email event limit:', userId);
              
              // Capture PostHog event
              const posthogClient = PostHogClient();
              posthogClient.capture({
                distinctId: userId,
                event: "email_event_limit_exceeded",
                properties: {
                  source: "createAllDayEvent",
                  message_id: messageId
                }
              });
              await posthogClient.shutdown();

              // Send an email to the user informing them they've reached their limit
              await sendEmailReply(
                sender,
                "Email Event Limit Reached - Upgrade to cal.ad Plus",
                `You have reached your limit of 10 email-to-calendar events per month on the Free plan. Upgrade to cal.ad Plus for unlimited email events and additional features like viewing, modifying, and deleting events.\n\nUpgrade your plan [here](${process.env.NEXT_PUBLIC_APP_URL}/plus-upgrade).`,
                bodyPlain,
                undefined,
                messageId,
                references
              );
              
              // Abort the controller to stop further processing
              controller.abort();
              
              return {
                status: "error",
                error: "Email event limit exceeded. You have reached your limit of 10 email-to-calendar events per month on the Free plan."
              };
            }
          }
          // Create the event data
          // For dumb model Add a day to the end date because its exclusive
          const endDate = new Date(args.endDate);
          if (!enableAdvancedCalendarFeatures) {
            endDate.setDate(endDate.getDate() + 1);
          }

          const eventData: CalendarEvent = {
            summary: args.summary,
            description: args.description,
            location: args.location,
            start: {
              date: args.startDate,
              timeZone: args.startTimeZone
            },
            end: {
              date: endDate.toISOString().split('T')[0],
              timeZone: args.endTimeZone
            },
            attendees: args.attendees?.map((email: string) => ({ email })),
            conferenceData: args.addGoogleMeet ? {
              createRequest: {
                requestId: crypto.randomUUID(),
                conferenceSolutionKey: {
                  type: 'hangoutsMeet'
                }
              }
            } : undefined,
            // Add reminders if provided
            reminders: args.notificationMinutesBefore ? {
              useDefault: false,
              overrides: args.notificationMinutesBefore.map((minutes: number) => ({
                method: "popup",
                minutes
              }))
            } : undefined,
            // Add recurrence if provided
            recurrence: args.recurrence ? [args.recurrence] : undefined
          };

          const result = await addCalendarEventInternal(userId, eventData);
          
          if (!result.success) {
            console.error('Failed to create all-day calendar event:', {
              error: result.error,
              details: result.details,
              source: result.source,
              context: {
                userId,
                eventSummary: args.summary,
                eventType: 'all-day',
                hasAttendees: !!args.attendees?.length,
                hasGoogleMeet: args.addGoogleMeet
              }
            });
            return {
              status: "error",
              error: result.error || "Failed to create calendar event"
            };
          }

          // Extract and format simplified event details

          const response = {
            status: "complete",
            event: result.event,
            eventLink: result.eventLink
          };
          
          // Record the email event usage for free users
          if (!enableAdvancedCalendarFeatures && messageId) {
            await recordEmailEvent(userId, messageId);
          }
          
          return response;
        } catch (error: any) {
          console.error('Error in createAllDayEvent execute:', {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack
            },
            context: {
              userId,
              eventSummary: args.summary,
              eventType: 'all-day',
              hasAttendees: !!args.attendees?.length,
              hasGoogleMeet: args.addGoogleMeet
            }
          });
          return {
            status: "error",
            error: error.message || "An unexpected error occurred while creating the all-day calendar event"
          };
        }
      }
    }),

    convertTimeZone: tool({
      description: "Convert a date and time between different time zones",
      parameters: timeZoneConversionSchema,
      async execute(args) {
        console.log('Starting convertTimeZone execution with args:', args);
        try {
          const { dateTime, fromTimeZone, toTimeZone } = args;
          
          console.log('Converting time zone:', {
            dateTime,
            fromTimeZone,
            toTimeZone
          });
          const result = convertTimeZone(
            dateTime, 
            fromTimeZone, 
            toTimeZone
          );
          console.log('Time zone conversion result:', result);
          
          if ('error' in result) {
            console.error('Time zone conversion error:', result.error);
            return {
              status: "error", 
              error: result.error
            };
          }
          
          return {
            status: "complete",
            conversion: result
          };
        } catch (error: any) {
          console.error('Error in convertTimeZone execute:', {
            error: error.message,
            stack: error.stack
          });
          return {
            status: "error",
            error: error.message
          };
        }
      }
    }),

    sendEmailReply: tool({
      description: "Send a reply email to the user",
      parameters: emailReplySchema,
      async execute(args) {
        console.log('Starting sendEmailReply execution with args:', {
          sender,
          subject: args.subject,
          bodyLength: args.body.length,
          hasMessageId: !!messageId,
          hasReferences: !!references
        });
        try {
          console.log('Sending email reply to:', sender);
          
          const emailResponse = await sendEmailReply(
            sender,
            args.subject,
            args.body,
            bodyPlain,
            undefined, // recipientName
            messageId,
            references
          );
          console.log('Email reply sent successfully:', {
            emailId: emailResponse.id,
            recipient: sender
          });

          // Capture PostHog event if the email body contains the upsell link
          if (args.body.includes(`${process.env.NEXT_PUBLIC_APP_URL}/plus-upgrade`)) {
            const posthogClient = PostHogClient();
            posthogClient.capture({
              distinctId: userId,
              event: "email_ai_upsell",
              properties: {
                source: "sendEmailReply",
                message_id: messageId
              }
            });
            await posthogClient.shutdown();
            console.log('Captured email_ai_upsell event for user:', userId);
          }

          // abort the controller, so that the LLM gets cut off
          controller.abort();
          return {
            status: "complete",
            message: "Email sent successfully"
          };
        } catch (error: any) {
          console.error('Error in sendEmailReply execute:', {
            error: error.message,
            stack: error.stack
          });
          return {
            status: "error",
            error: error.message
          };
        }
      }
    })
  };

  // Define advanced tools that are only available when enableAdvancedCalendarFeatures is true
  const advancedTools = {
    listCalendarEvents: tool({
      description: "View the user's calendar/schedule during a specified time range",
      parameters: listCalendarEventsSchema,
      async execute(args) {
        console.log('Starting listCalendarEvents execution with args:', {
          timeMin: args.timeMin,
          timeMax: args.timeMax,
          timeZone: args.timeZone
        });

        try {
          // Parse the date strings
          const timeMinDate = parseISOFns(args.timeMin);
          const timeMaxDate = parseISOFns(args.timeMax);
          
          // Convert to zoned time
          const timeMinZoned = toZonedTime(timeMinDate, args.timeZone);
          const timeMaxZoned = toZonedTime(timeMaxDate, args.timeZone);
          
          // Format with timezone offset
          const formattedTimeMin = formatTz(timeMinZoned, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: args.timeZone });
          const formattedTimeMax = formatTz(timeMaxZoned, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: args.timeZone });

          // Use the fetchCalendarEvents function with formatted times
          const result = await fetchCalendarEvents(
            userId,
            formattedTimeMin,
            formattedTimeMax,
            args.timeZone
          );

          if (!result.success) {
            console.error('Failed to fetch calendar events:', {
              error: result.error,
              details: result.details,
              source: result.source,
              context: {
                userId,
                timeRange: `${formattedTimeMin} to ${formattedTimeMax}`,
                timeZone: args.timeZone
              }
            });
            return {
              status: "error",
              error: result.error || "Failed to fetch calendar events",
              details: result.details
            };
          }

          return {
            status: "complete",
            eventInstances: result.events
          };
        } catch (error: any) {
          console.error("Error in listCalendarEvents execute:", {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack
            },
            context: {
              userId,
              timeRange: `${args.timeMin} to ${args.timeMax}`,
              timeZone: args.timeZone
            }
          });
          return {
            status: "error",
            error: error.message || "An error occurred while fetching calendar events",
            details: error.response?.data?.error || "Unknown error"
          };
        }
      }
    }),
    
    searchCalendarEvents: tool({
      description: "Search for calendar events matching specific terms",
      parameters: searchCalendarEventsSchema,
      async execute(args) {
        console.log('Starting searchCalendarEvents execution with args:', {
          query: args.query,
          timeMin: args.timeMin,
          timeMax: args.timeMax,
          timeZone: args.timeZone
        });

        try {
          // Format timestamps if provided
          let formattedTimeMin: string | undefined = undefined;
          let formattedTimeMax: string | undefined = undefined;

          if (args.timeMin && args.timeZone) {
            const timeMinDate = parseISOFns(args.timeMin);
            const timeMinZoned = toZonedTime(timeMinDate, args.timeZone);
            formattedTimeMin = formatTz(timeMinZoned, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: args.timeZone });
          }
          
          if (args.timeMax && args.timeZone) {
            const timeMaxDate = parseISOFns(args.timeMax);
            const timeMaxZoned = toZonedTime(timeMaxDate, args.timeZone);
            formattedTimeMax = formatTz(timeMaxZoned, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: args.timeZone });
          }

          // Use the searchCalendarEvents function with formatted times
          const result = await searchCalendarEvents(
            userId,
            args.query,
            formattedTimeMin,
            formattedTimeMax,
            args.timeZone
          );

          if (!result.success) {
            console.error('Failed to search calendar events:', {
              error: result.error,
              details: result.details,
              source: result.source,
              context: {
                userId,
                query: args.query,
                timeRange: args.timeMin && args.timeMax ? `${formattedTimeMin} to ${formattedTimeMax}` : 'all time',
                timeZone: args.timeZone
              }
            });
            return {
              status: "error",
              error: result.error || "Failed to search calendar events",
              details: result.details
            };
          }

          return {
            status: "complete",
            eventInstances: result.events
          };
        } catch (error: any) {
          console.error("Error in searchCalendarEvents execute:", {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack
            },
            context: {
              userId,
              query: args.query,
              timeRange: args.timeMin && args.timeMax ? `${args.timeMin} to ${args.timeMax}` : 'all time',
              timeZone: args.timeZone
            }
          });
          return {
            status: "error",
            error: error.message || "An error occurred while searching calendar events",
            details: error.response?.data?.error || "Unknown error"
          };
        }
      }
    }),
    
    modifyCalendarEvent: tool({
      description: "Modify an existing Google Calendar event. Only specify fields that should be changed - any fields not specified will keep their existing values. For example, if you only need to update the time, only provide the start/end time parameters.",
      parameters: modifyCalendarEventSchema,
      async execute(args) {
        console.log('Starting modifyCalendarEvent execution with args:', {
          eventId: args.eventId,
          summary: args.summary,
          startDateTime: args.startDateTime,
          endDateTime: args.endDateTime,
          startDate: args.startDate,
          endDate: args.endDate
        });

        try {

          // Error if both startDateTime and startDate are provided
          if (args.startDateTime && args.startDate) {
            throw new Error("Cannot specify both startDateTime and startDate parameters. If you want to make this an all-day event, use the startDate parameter. If you want to make this a timed event, use the startDateTime parameter.");
          }

          // Error if both endDateTime and endDate are provided
          if (args.endDateTime && args.endDate) {
            throw new Error("Cannot specify both endDateTime and endDate parameters. If you want to make this an all-day event, use the endDate parameter. If you want to make this a timed event, use the endDateTime parameter.");
          }

          // Prepare event data for modification - only include fields that are explicitly provided
          const eventData: Partial<CalendarEvent> = {};
          
          // Only add summary if explicitly provided
          if (args.summary !== undefined) {
            eventData.summary = args.summary;
          }
          
          // Only add description if explicitly provided
          if (args.description !== undefined) {
            eventData.description = args.description;
          }
          
          // Only add location if explicitly provided
          if (args.location !== undefined) {
            eventData.location = args.location;
          }

          // Add notifications if provided
          if (args.notificationMinutesBefore !== undefined) {
            eventData.reminders = {
              useDefault: false,
              overrides: args.notificationMinutesBefore.map(minutes => ({
                method: "popup",
                minutes
              }))
            };
          }

          // Add recurrence if provided
          if (args.recurrence !== undefined) {
            eventData.recurrence = args.recurrence ? [args.recurrence] : undefined;
          }

          // Remove recurrence
          if (args.recurrence === "") {
            eventData.recurrence = [];
          }

          // Ensure start and end objects exist if we have any date/time values
          if (args.startDateTime || args.endDateTime || args.startDate || args.endDate ||
              args.startTimeZone || args.endTimeZone) {
            eventData.start = eventData.start || {};
            eventData.end = eventData.end || {};
          }

          // Add start date directly if provided
          if (args.startDate) {
            console.log(`Setting start date to ${args.startDate}`);
            eventData.start = eventData.start || {};
            eventData.start.date = args.startDate;
            eventData.start.dateTime = null; // Remove dateTime
          }

          // Add end date directly if provided
          if (args.endDate) {
            console.log(`Original end date from args: ${args.endDate}`);
            
            eventData.end = eventData.end || {};
            eventData.end.date = args.endDate;
            eventData.end.dateTime = null; // Remove dateTime
          }
          
          // Handle timed events
          if (args.startDateTime || args.endDateTime || args.startTimeZone || args.endTimeZone) {
            if (!eventData.start) eventData.start = {};
            if (!eventData.end) eventData.end = {};
            
            if (args.startDateTime) {
              eventData.start.dateTime = args.startDateTime;
              // Explicitly indicate we want to remove date by setting it to null
              eventData.start.date = null;
            }
            
            if (args.startTimeZone) {
              eventData.start.timeZone = args.startTimeZone;
            }
            
            if (args.endDateTime) {
              eventData.end.dateTime = args.endDateTime;
              // Explicitly indicate we want to remove date by setting it to null
              eventData.end.date = null;
            }
            
            if (args.endTimeZone) {
              eventData.end.timeZone = args.endTimeZone;
            }
          }

          console.debug('Event data before modification:', JSON.stringify(eventData, null, 2));

          // Add attendees if provided
          if (args.attendees) {
            eventData.attendees = args.attendees.map(email => ({ email }));
          }

          // Add Google Meet if requested
          if (args.addGoogleMeet === true) {
            eventData.conferenceData = {
              createRequest: {
                requestId: crypto.randomUUID(),
                conferenceSolutionKey: {
                  type: 'hangoutsMeet'
                }
              }
            };
          } else if (args.addGoogleMeet === false) {
            eventData.conferenceData = null;
          }
          // If args.addGoogleMeet is undefined or null, eventData.conferenceData will remain undefined

          // Call the internal function to modify the event
          const result = await modifyCalendarEventInternal(userId, args.eventId, eventData);
          
          if (!result.success) {
            console.error('Failed to modify calendar event:', {
              error: result.error,
              details: result.details,
              source: result.source,
              context: {
                userId,
                eventId: args.eventId,
                eventSummary: args.summary
              }
            });
            return {
              status: "error",
              error: result.error || "Failed to modify calendar event"
            };
          }

          // Extract and format simplified event details for modified event
          const eventDetails = result.event ? {
            id: result.event.id,
            summary: result.event.summary,
            description: result.event.description,
            location: result.event.location,
            // Handle both timed and all-day events
            startDateTime: result.event.start.dateTime ? formatEventTime(result.event.start.dateTime, result.event.start.timeZone) : undefined,
            startDate: result.event.start.date,
            startTimeZone: result.event.start.timeZone,
            endDateTime: result.event.end.dateTime ? formatEventTime(result.event.end.dateTime, result.event.end.timeZone) : undefined,
            endDate: result.event.end.date ? formatEventDate(result.event.end.date, result.event.end.timeZone) : undefined,
            endTimeZone: result.event.end.timeZone,
            attendees: result.event.attendees?.map((attendee: any) => attendee.email),
            googleMeetLink: result.event.hangoutLink,
            // Include notifications
            notificationMinutesBefore: result.event.reminders?.overrides?.map((override: any) => override.minutes),
            // Include recurrence
            recurrence: result.event.recurrence?.[0]
          } : null;

          return {
            status: "complete",
            eventDetails,
            eventLink: result.eventLink
          };
        } catch (error: any) {
          console.error("Error in modifyCalendarEvent execute:", {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack
            },
            context: {
              userId,
              eventId: args.eventId,
              eventSummary: args.summary
            }
          });
          return {
            status: "error",
            error: error.message || "An unexpected error occurred while modifying the calendar event"
          };
        }
      }
    }),
    
    deleteCalendarEvent: tool({
      description: "Delete a Google Calendar event",
      parameters: deleteCalendarEventSchema,
      async execute(args) {
        console.log('Starting deleteCalendarEvent execution with args:', {
          eventId: args.eventId
        });

        try {
          // Call the internal function to delete the event
          const result = await deleteCalendarEventInternal(userId, args.eventId);
          
          if (!result.success) {
            console.error('Failed to delete calendar event:', {
              error: result.error,
              details: result.details,
              source: result.source,
              context: {
                userId,
                eventId: args.eventId
              }
            });
            return {
              status: "error",
              error: result.error || "Failed to delete calendar event"
            };
          }

          return {
            status: "complete",
            event: result.event
          };
        } catch (error: any) {
          console.error("Error in deleteCalendarEvent execute:", {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack
            },
            context: {
              userId,
              eventId: args.eventId
            }
          });
          return {
            status: "error",
            error: error.message || "An unexpected error occurred while deleting the calendar event"
          };
        }
      }
    })
  };

  // Return either all tools or just the basic tools based on the flag
  return enableAdvancedCalendarFeatures 
    ? { 
        // Basic tools
        createTimedEvent: basicTools.createTimedEvent,
        createAllDayEvent: basicTools.createAllDayEvent,
        convertTimeZone: basicTools.convertTimeZone,
        sendEmailReply: basicTools.sendEmailReply,
        // Advanced tools
        listCalendarEvents: advancedTools.listCalendarEvents,
        searchCalendarEvents: advancedTools.searchCalendarEvents,
        modifyCalendarEvent: advancedTools.modifyCalendarEvent,
        deleteCalendarEvent: advancedTools.deleteCalendarEvent
      } 
    : {
        // Only basic tools
        createTimedEvent: basicTools.createTimedEvent,
        createAllDayEvent: basicTools.createAllDayEvent,
        convertTimeZone: basicTools.convertTimeZone,
        sendEmailReply: basicTools.sendEmailReply
      };
}

/**
 * Format event time in the specified time zone without timezone offset
 * @param dateTimeStr ISO datetime string
 * @param timeZone IANA timezone
 * @returns Formatted datetime string in the specified timezone without offset
 */
function formatEventTime(dateTimeStr?: string, timeZone?: string): string | undefined {
  if (!dateTimeStr || !timeZone) return undefined;
  
  try {
    const date = new Date(dateTimeStr);
    // Format the date in the specified timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(date);
    const year = parts.find(part => part.type === 'year')?.value;
    const month = parts.find(part => part.type === 'month')?.value;
    const day = parts.find(part => part.type === 'day')?.value;
    const hour = parts.find(part => part.type === 'hour')?.value;
    const minute = parts.find(part => part.type === 'minute')?.value;
    const second = parts.find(part => part.type === 'second')?.value;
    
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  } catch (error) {
    console.error('Error formatting event time:', error);
    // Return the original string with timezone offset removed
    return dateTimeStr.replace(/([+-]\d{2}:?\d{2})Z?$/, '');
  }
}

/**
 * Format event date in the specified time zone without timezone offset
 * @param dateStr ISO date string
 * @param timeZone IANA timezone
 * @returns Formatted date string in the specified timezone without offset
 */
export function formatEventDate(dateStr?: string, timeZone?: string): string | undefined {
  if (!dateStr || !timeZone) return undefined;
  
  try {
    const date = new Date(dateStr);
    // Format the date in the specified timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(date);
    const year = parts.find(part => part.type === 'year')?.value;
    const month = parts.find(part => part.type === 'month')?.value;
    const day = parts.find(part => part.type === 'day')?.value;
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting event date:', error);
    // Return the original string with timezone offset removed
    return dateStr.replace(/([+-]\d{2}:?\d{2})Z?$/, '');
  }
}

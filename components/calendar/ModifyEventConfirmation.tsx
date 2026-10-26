'use client';

import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Form,
  Spinner
} from "@heroui/react";
import { getCalendarEventById } from '@/actions/calendar';
import {
  formatRecurrence,
  formatAttendees,
  getFieldValue,
  formatFieldValue,
  formatDateTimeDiffMinimal,
  formatEventSummary
} from '@/utils/calendar/event-confirmation-utils';

interface ModifyEventConfirmationProps {
  eventId: string;
  changes: {
    field: string;
    newValue: any;
  }[];
  onConfirm: (eventId: string) => Promise<void>;
  onCancel: () => void;
  onError?: (errorMessage: string) => void;
  processing?: boolean;
}

export default function ModifyEventConfirmation({
  eventId,
  changes,
  onConfirm,
  onCancel,
  onError,
  processing = false,
}: ModifyEventConfirmationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch current event data
  useEffect(() => {
    let isMounted = true;
    
    async function fetchEventData() {
      if (!eventId) return;
      
      setLoading(true);
      try {
        const result = await getCalendarEventById(eventId);
        if (isMounted) {
          if (result.success && result.event) {
            console.log('Google Calendar Event Data:', JSON.stringify(result.event, null, 2));
            setEvent(result.event);
          } else {
            setError(result.error || "Unknown error");
            onError?.(result.error || "Unknown error");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load event");
          onError?.(err.message || "Failed to load event");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchEventData();
    
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onConfirm(eventId);
    } catch (error) {
      console.error("Error updating calendar event:", error);
      // Keep isSubmitting true to prevent further submissions
    }
  };

  // Filter changes to only show those with actual differences
  const getFilteredChanges = () => {
    if (!event) return [];
    
    return changes.filter(change => {
      // Skip invalid entries
      if (change.newValue === undefined) return false;
      
      const currentValue = getFieldValue(change.field, event);
      const formattedCurrentValue = formatFieldValue(change.field, currentValue);
      const formattedNewValue = formatFieldValue(change.field, change.newValue);
      
      // Skip rows with "Invalid Date"
      if (formattedCurrentValue.includes('Invalid Date') || formattedNewValue.includes('Invalid Date')) {
        console.log(`Skipping row with Invalid Date: ${change.field}`);
        return false;
      }
      
      // Special case for time zones to make sure exact matches don't show up
      if (change.field.toLowerCase().includes('time zone')) {
        return String(currentValue || '').trim() !== String(change.newValue || '').trim();
      }
      
      // For date/time fields, use the formatDateTimeDiffMinimal function to detect changes
      const fieldNameLower = change.field.toLowerCase();
      if (fieldNameLower.includes('date') || fieldNameLower.includes('time') || 
          (typeof currentValue === 'string' && currentValue.includes('at') && 
           typeof change.newValue === 'string' && change.newValue.includes('at'))) {
        
        // Generate a diff to see if there are any actual changes
        const diff = formatDateTimeDiffMinimal(formattedCurrentValue, formattedNewValue);
        
        // If the diff contains <del> or <ins> tags, there are changes
        return diff.includes('<del>') || diff.includes('<ins>');
      }
      
      // For all other fields, compare the formatted values directly
      return formattedCurrentValue !== formattedNewValue;
    });
  };

  const getEventSummaryWithChanges = () => {
    if (!event) return false;
    
    // create a copy of the event, and apply the changes to the copy
    const eventCopy = JSON.parse(JSON.stringify(event));    

    // we just need the summary, startTime, startDateTime, endTime, and endDateTime

    console.log('Event Copy:', JSON.stringify(eventCopy, null, 2));
    console.log('Changes:', JSON.stringify(changes, null, 2));

    // apply the changes to the copy
    changes.forEach(change => {
      if (change.field === 'summary') {
        eventCopy.summary = change.newValue;
      }
      if (change.field === 'start date') {
        eventCopy.start.date= change.newValue;
        eventCopy.start.dateTime = null;
      }
      if (change.field === 'start date/time') {
        eventCopy.start.dateTime = change.newValue;
        eventCopy.start.date = null;
      }
      if (change.field === 'end date') {
        eventCopy.end.date = change.newValue;
        eventCopy.end.dateTime = null;
      } 
      if (change.field === 'end date/time') {
        eventCopy.end.dateTime = change.newValue;
        eventCopy.end.date = null;
      }
      if (change.field === 'start time zone') {
        eventCopy.start.timeZone = change.newValue;
      }
      if (change.field === 'end time zone') {
        eventCopy.end.timeZone = change.newValue;
      }
      
    });

    // return the formatted event summary
    return formatEventSummary(eventCopy);
  }
      

  // If we're still loading the event data
  if (loading) {
    return (
      <Card className="mb-4 p-2" shadow="sm">
        <CardBody className="py-4 flex justify-center items-center">
          <Spinner size="md" color="primary" />
          <span className="ml-2">Loading current event details...</span>
        </CardBody>
      </Card>
    );
  }

  // If there was an error loading the event
  if (error) {
    return (
      <Card className="mb-4 p-2" shadow="sm">
        <CardBody className="py-4">
          <div className="text-danger">Error: {error}</div>
        </CardBody>
      </Card>
    );
  }

  const filteredChanges = getFilteredChanges();
  

  return (
    <Card className="mb-4 p-2" shadow="sm">
      <CardHeader className="pb-0">
        <h3 className="text-lg font-medium">
          {processing ? "Modifying Calendar Event..." : "Confirm Calendar Event Changes"}
        </h3>
      </CardHeader>

      <Form onSubmit={handleSubmit}>
        <CardBody className="py-4 ph-no-capture">
          <div className="space-y-4">
            <p className="text-base text-foreground/80">
              The following changes will be made to the calendar event:
            </p>
            
            {/* Event summary with strikethrough for changed parts */}
            <div className="bg-content2 p-4 rounded-md">
              {formatEventSummary(event) === getEventSummaryWithChanges() ? (
                <p className="text-md">{formatEventSummary(event)}</p>
              ) : (
                <>
                  <p className="text-md"><s>{formatEventSummary(event)}</s></p>
                  <p className="text-md text-primary">
                    {getEventSummaryWithChanges()}
                  </p>
                </>
              )}
              
              {/* Show recurrence section only when there is recurrence or recurrence changes */}
              {(Array.isArray(event?.recurrence) && event.recurrence.length > 0 || 
                filteredChanges.some(c => c.field.toLowerCase().includes('recurrence'))) && (
                <p className="text-base text-foreground/80 mt-1">
                  🔄 {
                    filteredChanges.some(c => c.field.toLowerCase().includes('recurrence'))
                      ? <>
                          <s>
                            {Array.isArray(event?.recurrence) && event.recurrence.length > 0 
                              ? formatRecurrence(event.recurrence) 
                              : `No recurrence`}
                          </s>
                          &nbsp;
                          <span className="text-primary">
                            {(() => {
                              const newValue = filteredChanges.find(c => c.field.toLowerCase().includes('recurrence'))?.newValue;
                              if (!newValue) return `No recurrence`;
                              
                              // Try to format the new recurrence rule, fall back to raw text
                              if (typeof newValue === 'string' && newValue.includes('FREQ=')) {
                                return formatRecurrence(newValue);
                              }
                              
                              // If it's an array with content
                              if (Array.isArray(newValue) && newValue.length > 0) {
                                return formatRecurrence(newValue);
                              }
                              
                              // Fallback to raw value
                              return String(newValue);
                            })()}
                          </span>
                        </>
                      : Array.isArray(event?.recurrence) && event.recurrence.length > 0 
                        ? formatRecurrence(event.recurrence) 
                        : `No recurrence`
                  }
                </p>
              )}
              
              {/* Show location if it exists or is being changed */}
              {(event?.location || filteredChanges.some(c => c.field.toLowerCase().includes('location'))) && (
                <p className="text-base text-foreground/80 mt-1">
                  📍 {
                    filteredChanges.some(c => c.field.toLowerCase().includes('location'))
                      ? <>
                          <s>{event?.location}</s>
                          &nbsp;
                          <span className="text-primary">{
                            filteredChanges.find(c => c.field.toLowerCase().includes('location'))?.newValue
                          }</span>
                        </>
                      : event?.location
                  }
                </p>
              )}
              
              {/* Show description if it exists or is being changed */}
              {(event?.description || filteredChanges.some(c => c.field.toLowerCase().includes('description'))) && (
                <p className="text-base text-foreground/80 mt-1">
                  📝 {
                    filteredChanges.some(c => c.field.toLowerCase().includes('description'))
                      ? <>
                          <s>{event?.description}</s>
                          <br />
                          <span className="text-primary">{
                            filteredChanges.find(c => c.field.toLowerCase().includes('description'))?.newValue
                          }</span>
                        </>
                      : event?.description
                  }
                </p>
              )}
              
              {/* Show attendees if they exist or are being changed */}
              {(event?.attendees || filteredChanges.some(c => c.field.toLowerCase().includes('attendee'))) && (
                <p className="text-base text-foreground/80 mt-1">
                  👥 {
                    filteredChanges.some(c => c.field.toLowerCase().includes('attendee'))
                      ? <>
                          <s>
                            {event?.attendees?.length} {event?.attendees?.length === 1 ? 'attendee' : 'attendees'}: {formatAttendees(event?.attendees)}
                          </s>
                          <br />
                          <span className="text-primary">
                            {
                              (() => {
                                const newAttendees = filteredChanges.find(c => c.field.toLowerCase().includes('attendee'))?.newValue;
                                if (!newAttendees) return '';
                                if (newAttendees === "No attendees") return 'No attendees';
                                // Parse attendees properly
                                let attendeesList;
                                if (typeof newAttendees === 'string') {
                                  // Try to parse if it's a JSON string
                                  try {
                                    if (newAttendees.startsWith('[') || newAttendees.startsWith('{')) {
                                      attendeesList = JSON.parse(newAttendees);
                                    } else {
                                      // Split by commas if it's a comma-separated string
                                      attendeesList = newAttendees.split(',').map(a => a.trim());
                                    }
                                  } catch (e) {
                                    // If parsing fails, treat as a single attendee
                                    attendeesList = [newAttendees];
                                  }
                                } else if (Array.isArray(newAttendees)) {
                                  attendeesList = newAttendees;
                                } else if (newAttendees && typeof newAttendees === 'object') {
                                  // If it's an object with email property
                                  attendeesList = [newAttendees];
                                } else {
                                  attendeesList = [];
                                }
                                
                                // Count actual attendees
                                const count = Array.isArray(attendeesList) ? attendeesList.length : 0;
                                return `${count} ${count === 1 ? 'attendee' : 'attendees'}: ${formatAttendees(newAttendees)}`;
                              })()
                            }
                          </span>
                        </>
                      : `${event?.attendees?.length} ${event?.attendees?.length === 1 ? 'attendee' : 'attendees'}: ${formatAttendees(event?.attendees)}`
                  }
                </p>
              )}
              
              {/* Show Google Meet if it exists or is being changed */}
              {(event?.conferenceData || filteredChanges.some(c => c.field === "add Google Meet")) && (
                <p className="text-base text-foreground/80 mt-1">
                  🧑‍💻 {
                    (() => {
                      // Find the Google Meet change
                      let meetChange = filteredChanges.find(c => c.field === "add Google Meet");
                      
                      // Get current meet status
                      const currentMeetStatus = event?.conferenceData 
                        ? 'Google Meet included' 
                        : 'Google Meet not included';

                      // Set meetChange to undefined if there's no change
                      if (meetChange && (Boolean(event?.conferenceData) == Boolean(meetChange?.newValue))) {
                        meetChange.newValue = undefined;
                      }
                      
                      // Don't show anything if no conferenceData and no changes
                      if (!event?.conferenceData && (!meetChange || meetChange.newValue === undefined)) {
                        return null;
                      }
                        
                      // If there's a meeting change, show strikethrough and new status
                      if (meetChange) {
                        if (meetChange.newValue === undefined) {
                          return currentMeetStatus;
                        }
                        
                        return (
                          <>
                            <s>{currentMeetStatus}</s>
                            &nbsp;
                            <span className="text-primary">
                              {meetChange.newValue === true
                                ? 'Google Meet will be added' 
                                : 'Google Meet will be removed'
                              }
                            </span>
                          </>
                        );
                      }
                      
                      // Just show current status if no changes
                      return currentMeetStatus;
                    })()
                  }
                </p>
              )}
              
              {/* Show notifications if they exist or are being changed */}
              {(event?.reminders?.overrides || filteredChanges.some(c => c.field.toLowerCase().includes('notification') || c.field.toLowerCase().includes('reminder'))) && (
                <p className="text-base text-foreground/80 mt-1">
                  🔔 Notifications: {
                    filteredChanges.some(c => c.field.toLowerCase().includes('notification') || c.field.toLowerCase().includes('reminder'))
                      ? <>
                          <s>
                            {Array.isArray(event?.reminders?.overrides) && event.reminders.overrides.length > 0
                              ? event.reminders.overrides.map((reminder: any) => 
                                  reminder.minutes >= 60 
                                    ? `${Math.floor(reminder.minutes / 60)} hour${Math.floor(reminder.minutes / 60) !== 1 ? 's' : ''}` 
                                    : `${reminder.minutes} minute${reminder.minutes !== 1 ? 's' : ''}`
                                ).join(', ') + ' before'
                              : 'none'}
                          </s>
                          &nbsp;
                          <span className="text-primary">
                            {
                              (() => {
                                const newNotifications = filteredChanges.find(c => c.field.toLowerCase().includes('notification') || c.field.toLowerCase().includes('reminder'))?.newValue;
                                if (!newNotifications) return '';
                                const notificationsList = Array.isArray(newNotifications) ? newNotifications : [newNotifications];
                                return notificationsList.map((min: number) => 
                                  min >= 60 
                                    ? `${Math.floor(min / 60)} hour${Math.floor(min / 60) !== 1 ? 's' : ''}` 
                                    : `${min}`
                                ).join(', ') + '';
                              })()
                            }
                          </span>
                        </>
                      : `${Array.isArray(event?.reminders?.overrides) && event.reminders.overrides.length > 0
                          ? event.reminders.overrides.map((reminder: any) => 
                              reminder.minutes >= 60 
                                ? `${Math.floor(reminder.minutes / 60)} hour${Math.floor(reminder.minutes / 60) !== 1 ? 's' : ''}` 
                                : `${reminder.minutes} minute${reminder.minutes !== 1 ? 's' : ''}`
                            ).join(', ') + ' before'
                        : 'none'}`
                  }
                </p>
              )}
            </div>
          </div>
        </CardBody>

        <CardFooter className="flex justify-end gap-2">
          <Button
            onPress={onCancel}
            variant="light"
            color="danger"
            type="button"
            isDisabled={isSubmitting || processing}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            color="primary" 
            isLoading={isSubmitting}
            isDisabled={processing}
            className="!text-white"
          >
            Confirm Changes
          </Button>
        </CardFooter>
      </Form>
    </Card>
  );
}

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
  formatEventSummary
} from '@/utils/calendar/event-confirmation-utils';

interface DeleteEventConfirmationProps {
  eventId: string;
  eventDate: string;
  onConfirm: (eventId: string) => Promise<void>;
  onCancel: () => void;
  processing?: boolean;
  onError?: (errorMessage: string) => void;
}

export default function DeleteEventConfirmation({
  eventId,
  eventDate,
  onConfirm,
  onCancel,
  processing = false,
  onError,
}: DeleteEventConfirmationProps) {
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
            // console.log('Google Calendar Event Data:', JSON.stringify(result.event, null, 2));
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
      console.error("Error deleting calendar event:", error);
      // Keep isSubmitting true to prevent further submissions
    }
  };

  // If we're still loading the event data
  if (loading) {
    return (
      <Card className="mb-4 p-2" shadow="sm">
        <CardBody className="py-4 flex justify-center items-center">
          <Spinner size="md" color="primary" />
          <span className="ml-2">Loading event details...</span>
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

  return (
    <Card className="mb-4 p-2" shadow="sm">
      <CardHeader className="pb-0">
        <h3 className="text-lg font-medium">
          {processing ? "Deleting Calendar Event..." : "Confirm Calendar Event Deletion"}
        </h3>
      </CardHeader>

      <Form onSubmit={handleSubmit}>
        <CardBody className="py-4 ph-no-capture">
          <div className="space-y-4">
            <p className="text-base text-foreground/70">
              Are you sure you want to delete this event?
            </p>
            
            {/* Display event details in the same style as CalendarEventConfirmation */}
            <div className="bg-content2 p-4 rounded-md">
              <p className="text-md">{formatEventSummary(event)}</p>
              {event?.recurrence && (
                <p className="text-base text-foreground/70 mt-1">🔄 {formatRecurrence(event.recurrence)}</p>
              )}
              {event?.location && (
                <p className="text-base text-foreground/70 mt-1">📍 {event.location}</p>
              )}
              {event?.description && (
                <p className="text-base text-foreground/70 mt-1">📝 {event.description}</p>
              )}
              {event?.attendees && event.attendees.length > 0 && (
                <p className="text-base text-foreground/70 mt-1">
                  👥 {event.attendees.length} {event.attendees.length === 1 ? 'attendee' : 'attendees'}: {formatAttendees(event.attendees)}
                </p>
              )}
              {event?.conferenceData && (
                <p className="text-base text-foreground/70 mt-1">🧑‍💻 Google Meet included</p>
              )}
              {event?.reminders?.overrides && (
                <p className="text-base text-foreground/70 mt-1">
                  🔔 Notifications: {event.reminders.overrides.map((reminder: any) => 
                    reminder.minutes >= 60 
                      ? `${Math.floor(reminder.minutes / 60)} hour${Math.floor(reminder.minutes / 60) !== 1 ? 's' : ''}` 
                      : `${reminder.minutes} minute${reminder.minutes !== 1 ? 's' : ''}`
                  ).join(', ')} before
                </p>
              )}
            </div>
            
            <p className="text-sm text-rose-600">
              This action cannot be undone.
            </p>
          </div>
        </CardBody>

        <CardFooter className="flex justify-end gap-2">
          <Button
            onPress={onCancel}
            variant="light"
            color="primary"
            type="button"
            isDisabled={isSubmitting || processing}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            color="danger" 
            isLoading={isSubmitting}
            isDisabled={processing}
            className="!text-white"
          >
            Delete Event
          </Button>
        </CardFooter>
      </Form>
    </Card>
  );
}

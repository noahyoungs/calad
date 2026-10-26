'use client';

import React, { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Spinner } from "@heroui/react";
import { getCalendarEventById } from '@/actions/calendar';

// Loading component
const EventDetailsLoading = () => (
  <div className="flex items-center justify-center py-4">
    <Spinner size="md" color="primary" />
    <span className="ml-2 text-sm">Loading event details...</span>
  </div>
);

// Main component
export default function EventDetails({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchEventData() {
      if (!eventId) return;
      
      setLoading(true);
      try {
        const result = await getCalendarEventById(eventId);
        if (isMounted) {
          if (result.success && result.event) {
            // console.log('Google Calendar Event Data (EventDetails):', JSON.stringify(result.event, null, 2));
            setEvent(result.event);
          } else {
            setError(result.error || "Unknown error");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load event");
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

  // Format date from event
  const formatDateTime = (dateTime: string) => {
    try {
      const date = new Date(dateTime);
      // Format like "Thursday, April 17, 2025 at 2:00 PM"
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) + ' at ' + date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateTime;
    }
  };

  const getDateDisplay = (dateTimeObj: any) => {
    if (!dateTimeObj) return "Not specified";
    if (dateTimeObj.date) {
      const date = new Date(dateTimeObj.date);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    if (dateTimeObj.dateTime) {
      return formatDateTime(dateTimeObj.dateTime);
    }
    return "Not specified";
  };

  if (loading) {
    return <EventDetailsLoading />;
  }

  if (error) {
    return (
      <div className="p-2 text-danger text-sm">
        Failed to load event details: {error}
      </div>
    );
  }

  return (
    <div className="py-2">
      <h4 className="text-sm font-medium mb-2">Event Details</h4>
      <Table 
        aria-label="Event Details"
        removeWrapper
        className="text-sm"
        classNames={{
          td: "py-1.5",
          th: "py-1.5 bg-content3",
        }}
      >
        <TableHeader>
          <TableColumn>Field</TableColumn>
          <TableColumn>Value</TableColumn>
        </TableHeader>
        <TableBody>
          {event.summary && (
            <TableRow>
              <TableCell className="font-medium">Title</TableCell>
              <TableCell>{event.summary}</TableCell>
            </TableRow>
          )}
          {event.description && (
            <TableRow>
              <TableCell className="font-medium">Description</TableCell>
              <TableCell>{event.description}</TableCell>
            </TableRow>
          )}
          {event.location && (
            <TableRow>
              <TableCell className="font-medium">Location</TableCell>
              <TableCell>{event.location}</TableCell>
            </TableRow>
          )}
          {event.start && getDateDisplay(event.start) !== "Not specified" && (
            <TableRow>
              <TableCell className="font-medium">Start</TableCell>
              <TableCell>{getDateDisplay(event.start)}</TableCell>
            </TableRow>
          )}
          {event.end && getDateDisplay(event.end) !== "Not specified" && (
            <TableRow>
              <TableCell className="font-medium">End</TableCell>
              <TableCell>{getDateDisplay(event.end)}</TableCell>
            </TableRow>
          )}
          {event.attendees && event.attendees.length > 0 && (
            <TableRow>
              <TableCell className="font-medium">Attendees</TableCell>
              <TableCell>
                {event.attendees.map((attendee: any, index: number) => (
                  <div key={index}>{attendee.email}</div>
                ))}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 
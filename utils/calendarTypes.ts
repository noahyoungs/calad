export interface CalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string | null;
    date?: string | null;
    timeZone?: string;
  };
  end: {
    dateTime?: string | null;
    date?: string | null;
    timeZone?: string;
  };
  // New fields for Google Meet
  conferenceData?: {
    createRequest?: {
      requestId?: string;
      conferenceSolutionKey?: {
        type: string;
      };
    }
  } | null;
  // Attendees support
  attendees?: Array<{
    email: string;
    displayName?: string;
    optional?: boolean;
    responseStatus?: string;
  }>;
  // Reminders and notifications
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{
      method: "email" | "popup";
      minutes: number;
    }>;
  };
  // Support for recurring events
  recurrence?: string[];
} 
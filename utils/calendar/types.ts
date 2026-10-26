import { CalendarEvent } from "@/utils/calendarTypes";

export type CalendarActionResult = {
  success: boolean;
  event?: any;
  events?: any[];
  rawEvents?: any[];
  eventLink?: string;
  error?: string;
  details?: string;
  source?: string;
  timeZone?: string;
  timeMin?: string;
  timeMax?: string;
  calendarId?: string;
  errorCode?: number;
  errorReason?: string;
  requestParameters?: any;
};

export type OAuthTokens = {
  accessToken: string | null;
  refreshToken: string | undefined;
  expiresAt: number | null;
  source?: string | null;
};

export type GoogleCalendarEvent = {
  id: string;
  summary: string;
  description: string;
  location: string;
  isAllDay: boolean;
  start: string;
  end: string;
  startTimeZone: string;
  endTimeZone: string;
  attendees: string;
  notifications: string[];
  link: string;
  recurrence: string;
};

export type { CalendarEvent };

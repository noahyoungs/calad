'use server';

import { CalendarEvent } from "@/utils/calendarTypes";

export type CalendarActionResult = {
  success: boolean;
  event?: any;
  eventLink?: string;
  error?: string;
  details?: string;
  source?: string;
};

export type { CalendarEvent };

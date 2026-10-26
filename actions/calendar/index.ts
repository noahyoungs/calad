'use server';

import { CalendarEvent, CalendarActionResult } from './types';
import { addCalendarEvent } from './add-event';
import { modifyCalendarEvent } from './modify-event';
import { deleteCalendarEvent } from './delete-event';
import { getCalendarEventById } from './get-event';

export type { CalendarEvent, CalendarActionResult };
export { addCalendarEvent, modifyCalendarEvent, deleteCalendarEvent, getCalendarEventById };

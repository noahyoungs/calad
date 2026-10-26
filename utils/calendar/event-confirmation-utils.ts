/**
 * Utility functions for calendar event confirmation components
 * Shared logic extracted from:
 * - CalendarEventConfirmation.tsx
 * - ModifyEventConfirmation.tsx
 * - DeleteEventConfirmation.tsx
 */

'use client';

import { RRule, rrulestr } from 'rrule';
import { diffWords, diffChars } from 'diff';

// Type for any event with summary, start, and end as described
export type EventWithSummaryAndTime = {
  summary: string;
  start: {
    date?: string;
    dateTime?: string;
    timeZone: string;
    [key: string]: any;
  };
  end: {
    date?: string;
    dateTime?: string;
    timeZone: string;
    [key: string]: any;
  };
  [key: string]: any;
};

/**
 * Format recurrence rule to be human-readable using the rrule library
 * @param recurrenceRule - The recurrence rule string or array of strings
 * @returns A human-readable representation of the recurrence rule
 */
export function formatRecurrence(recurrenceRule: string | string[] | undefined): string {
  if (!recurrenceRule || recurrenceRule === "undefined") return "";
  
  // Handle array of recurrence rules
  if (Array.isArray(recurrenceRule)) {
    if (recurrenceRule.length === 0) return "";
    
    // Format each rule in the array and join with commas
    return recurrenceRule
      .map(rule => formatSingleRecurrenceRule(rule))
      .filter(Boolean)
      .join(", ");
  }
  
  // If it's a single rule, format it directly
  return formatSingleRecurrenceRule(recurrenceRule);
}

/**
 * Format a single recurrence rule string to human-readable text
 * @param recurrenceRule - The recurrence rule string
 * @returns A human-readable representation of the recurrence rule
 */
function formatSingleRecurrenceRule(recurrenceRule: string): string {
  
  // Remove array notation and quotes if present
  let cleanRule = recurrenceRule;
  if (typeof cleanRule === 'string') {
    if (cleanRule.startsWith('["') && cleanRule.endsWith('"]')) {
      cleanRule = cleanRule.slice(2, -2);
    }
    
    // Handle incomplete or partial recurrence values
    if (cleanRule === "Every" || !cleanRule.includes('FREQ=')) {
      return cleanRule; // Return as is if it's already in readable format or invalid
    }
  }
  
  try {
    // Use the rrule library to parse and format the recurrence rule
    const rule = rrulestr(String(cleanRule));
    
    // Get the text representation with default options
    const text = rule.toText();
    
    // Capitalize the first letter
    return text.charAt(0).toUpperCase() + text.slice(1);
  } catch (e) {
    console.error("Error parsing recurrence rule:", e);
    
    // Fallback to basic parsing if rrule library fails
    try {
      // Extract frequency and interval info from RRULE format
      const freqMatch = String(cleanRule).match(/FREQ=([^;]+)/i);
      const intervalMatch = String(cleanRule).match(/INTERVAL=([^;]+)/i);
      const bydayMatch = String(cleanRule).match(/BYDAY=([^;]+)/i);
      const countMatch = String(cleanRule).match(/COUNT=([^;]+)/i);
      const untilMatch = String(cleanRule).match(/UNTIL=([^;]+)/i);
      const bymonthMatch = String(cleanRule).match(/BYMONTH=([^;]+)/i);
      const bymonthdayMatch = String(cleanRule).match(/BYMONTHDAY=([^;]+)/i);
      
      if (!freqMatch) {
        return String(cleanRule); // Return original if no FREQ found
      }
      
      const frequency = freqMatch[1].toLowerCase();
      const interval = intervalMatch ? parseInt(intervalMatch[1]) : 1;
      const days = bydayMatch ? bydayMatch[1].split(',') : [];
      const count = countMatch ? parseInt(countMatch[1]) : null;
      const until = untilMatch ? untilMatch[1] : null;
      const months = bymonthMatch ? bymonthMatch[1].split(',').map(Number) : [];
      const monthDays = bymonthdayMatch ? bymonthdayMatch[1].split(',').map(Number) : [];
      
      // Map RRULE day abbreviations to full day names
      const dayMap: Record<string, string> = {
        'MO': 'Monday',
        'TU': 'Tuesday',
        'WE': 'Wednesday',
        'TH': 'Thursday',
        'FR': 'Friday',
        'SA': 'Saturday',
        'SU': 'Sunday'
      };
      
      // Create readable frequency text
      let readableText = "";
      
      // Handle interval
      const intervalText = interval > 1 ? ` ${interval}` : '';
      
      switch (frequency) {
        case "daily":
          readableText = `Every${intervalText} day${interval > 1 ? 's' : ''}`;
          break;
        case "weekly":
          if (days.length) {
            const dayNames = days.map(day => dayMap[day] || day);
            readableText = days.length === 1 
              ? `Every${intervalText} ${dayNames[0]}` 
              : `Every${intervalText} ${dayNames.slice(0, -1).join(', ')} and ${dayNames[dayNames.length - 1]}`;
            
            if (interval > 1) {
              readableText += ` (every ${interval} weeks)`;
            }
          } else {
            readableText = `Every${intervalText} week${interval > 1 ? 's' : ''}`;
          }
          break;
        case "monthly":
          if (monthDays.length) {
            const dayText = monthDays.length === 1 
              ? getOrdinalSuffix(monthDays[0]) 
              : monthDays.map(getOrdinalSuffix).join(', ');
            readableText = `Every${intervalText} month${interval > 1 ? 's' : ''} on the ${dayText}`;
          } else {
            readableText = `Every${intervalText} month${interval > 1 ? 's' : ''}`;
          }
          break;
        case "yearly":
          if (months.length) {
            const monthNames = months.map(m => {
              const date = new Date(2000, m - 1, 1);
              return date.toLocaleString('en-US', { month: 'long' });
            });
            readableText = months.length === 1 
              ? `Every${intervalText} ${monthNames[0]}` 
              : `Every${intervalText} ${monthNames.slice(0, -1).join(', ')} and ${monthNames[monthNames.length - 1]}`;
            
            if (interval > 1) {
              readableText += ` (every ${interval} years)`;
            }
          } else {
            readableText = `Every${intervalText} year${interval > 1 ? 's' : ''}`;
          }
          break;
        default:
          readableText = `Every${intervalText} ${frequency}`;
      }
      
      // Add count or until information
      if (count) {
        readableText += `, ${count} times`;
      } else if (until) {
        try {
          const untilDate = new Date(until.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
          readableText += `, until ${untilDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
        } catch (e) {
          readableText += ", with end date";
        }
      }
      
      return readableText || String(cleanRule);
    } catch (fallbackError) {
      console.error("Fallback parsing also failed:", fallbackError);
      return String(cleanRule); // Return original as last resort
    }
  }
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 * @param n - The number
 * @returns The number with ordinal suffix
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Format attendees list to display email addresses
 * @param attendees - The attendees array or string
 * @returns A formatted string of attendee email addresses
 */
export function formatAttendees(attendeesValue: any): string {
  if (!attendeesValue || attendeesValue === "undefined") return "";
  
  try {
    // Handle string representation of JSON array
    let attendees = attendeesValue;
    if (typeof attendeesValue === 'string') {
      // Try to parse if it looks like JSON
      if (attendeesValue.startsWith('[') || attendeesValue.startsWith('{')) {
        attendees = JSON.parse(attendeesValue);
      } else {
        return attendeesValue; // Return as is if just a simple string
      }
    }
    
    // Handle array of objects with email property
    if (Array.isArray(attendees)) {
      return attendees.map(att => {
        if (typeof att === 'object' && att !== null && 'email' in att) {
          return att.email;
        }
        return String(att);
      }).join(', ');
    }
    
    // Fallback to stringifying the value
    return String(attendeesValue);
  } catch (e) {
    console.error("Error formatting attendees:", e);
    return String(attendeesValue);
  }
}

/**
 * Format a date in a human-readable way
 * @param dateStr - The date string to format
 * @returns A formatted date string
 */
export function formatDateReadable(dateStr: string): string {
  try {
    if (!dateStr) return "Not set";
    const date = new Date(dateStr);
    
    // Check if date is valid before formatting
    if (isNaN(date.getTime())) {
      console.log(`Invalid date string: ${dateStr}`);
      return dateStr || "Not set";
    }
    
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
    console.log(`Error formatting date: ${dateStr}`, e);
    return dateStr || "Not set";
  }
}

/**
 * Format event summary for display
 * @param event - The event object, expecting summary, start (dateTime/date, timeZone), end (dateTime/date, timeZone)
 * @returns A formatted event summary string
 */
export function formatEventSummary(event: EventWithSummaryAndTime): string {
  if (!event || !event.summary) {
    return "Loading event details...";
  }

  const { summary, start, end } = event;
  if (!start || (!start.date && !start.dateTime)) {
    return `${summary} — Date not set`;
  }

  // Helper function to parse dateTime string considering its nature (offset vs. local-like)
  function parseDateTimeWithContext(dateTimeStr: string, associatedZone: string | undefined): Date {
    const hasOffset = /[+-]\d{2}:\d{2}|Z$/.test(dateTimeStr);

    if (hasOffset) {
      return new Date(dateTimeStr); // Correctly parses to a UTC instant
    }

    // It's a local-like string, e.g., "2025-06-08T01:45:00"
    // It represents wall-clock time in `associatedZone`.
    if (!associatedZone) {
      console.warn(`Local-like dateTime string "${dateTimeStr}" received without an associated timezone. Parsing as system local.`);
      return new Date(dateTimeStr); // Fallback, might be incorrect
    }

    const y = parseInt(dateTimeStr.substring(0, 4), 10);
    const mo_js = parseInt(dateTimeStr.substring(5, 7), 10) - 1; // JS month is 0-indexed
    const d = parseInt(dateTimeStr.substring(8, 10), 10);
    const h = parseInt(dateTimeStr.substring(11, 13), 10);
    const mi = parseInt(dateTimeStr.substring(14, 16), 10);
    const s = dateTimeStr.length > 17 ? parseInt(dateTimeStr.substring(17, 19), 10) : 0;
    const ms = dateTimeStr.length > 20 ? parseInt(dateTimeStr.substring(20, 23), 10) : 0;

    // 1. Create a Date object as if the input wall time components were UTC components.
    const initialUtcGuessMs = Date.UTC(y, mo_js, d, h, mi, s, ms);
    const initialUtcGuessDate = new Date(initialUtcGuessMs);

    // 2. Find out what wall time 'initialUtcGuessDate' corresponds to in the 'associatedZone'.
    const formatter = new Intl.DateTimeFormat("en-US", { 
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: associatedZone,
      hourCycle: 'h23' // Crucial: ensures hour is 00-23
    });
    const parts = formatter.formatToParts(initialUtcGuessDate);
    
    const getPartValue = (type: Intl.DateTimeFormatPartTypes): number => {
        const part = parts.find(p => p.type === type);
        if (!part) {
            // Fallback for simple parsing if parts missing, though less robust
            console.warn(`DateTimeFormatPart type "${type}" not found for timezone "${associatedZone}". Using direct Date methods as fallback for this part.`);
            switch(type) {
                case 'year': return initialUtcGuessDate.getFullYear();
                case 'month': return initialUtcGuessDate.getMonth() + 1;
                case 'day': return initialUtcGuessDate.getDate();
                case 'hour': return initialUtcGuessDate.getHours();
                case 'minute': return initialUtcGuessDate.getMinutes();
                case 'second': return initialUtcGuessDate.getSeconds();
                default: throw new Error(`Unhandled DateTimeFormatPart type "${type}" in fallback.`);
            }
        }
        return parseInt(part.value, 10);
    };
    
    const zoneWallY = getPartValue('year');
    const zoneWallMo_js = getPartValue('month') - 1; // Adjust to 0-indexed for Date.UTC
    const zoneWallD = getPartValue('day');
    let zoneWallH = getPartValue('hour'); 
    if (zoneWallH === 24) zoneWallH = 0; // Intl.DateTimeFormat with h23 can return 24 for midnight.
    const zoneWallMi = getPartValue('minute');
    const zoneWallS = getPartValue('second');
    
    // 3. Calculate the millisecond representation of this determined wall time *as if it were UTC*.
    const zoneWallTimeAsUtcMs = Date.UTC(zoneWallY, zoneWallMo_js, zoneWallD, zoneWallH, zoneWallMi, zoneWallS, ms);
    
    // 4. The 'offsetCorrectionMs' is the difference between our initial UTC guess (based on input numbers)
    //    and the UTC value of what that guess *actually represents* as a wall time in the target zone.
    const offsetCorrectionMs = initialUtcGuessMs - zoneWallTimeAsUtcMs;

    // 5. The actual UTC instant is the initial guess adjusted by this correction.
    const finalCorrectUtcMs = initialUtcGuessMs + offsetCorrectionMs;
    
    return new Date(finalCorrectUtcMs);
  }

  const isAllDay = !!start.date;
  let startDateObj: Date;
  let inclusiveEndDateObj: Date | null = null;

  if (isAllDay) {
    if (start.date) {
      const [sY, sMo, sD] = start.date.split('-').map(Number);
      startDateObj = new Date(Date.UTC(sY, sMo - 1, sD)); // Store as UTC midnight
    } else {
      startDateObj = new Date(0); // fallback to epoch if missing
    }
    if (end && end.date) {
      const [eY, eMo, eD] = end.date.split('-').map(Number);
      // end.date is exclusive for Google Calendar. To get inclusive end day:
      const exclusiveEndUtc = new Date(Date.UTC(eY, eMo - 1, eD));
      inclusiveEndDateObj = new Date(exclusiveEndUtc.getTime() - (24 * 60 * 60 * 1000));
    }
  } else {
    startDateObj = parseDateTimeWithContext(start.dateTime || '', start.timeZone);
    if (end && end.dateTime) {
      inclusiveEndDateObj = parseDateTimeWithContext(end.dateTime, end.timeZone || start.timeZone);
    }
  }

  const currentYear = new Date().getUTCFullYear();

  // displayTZ is the target timezone for displaying the date part.
  // For all-day events, we display the date as per UTC components.
  // For timed events, we display as per the event's specific timezone.
  const formatDatePart = (d: Date, displayTZ: string | undefined, forceYear?: boolean): string => {
    const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
    const effectiveDisplayTZ = isAllDay ? 'UTC' : displayTZ;
    if (effectiveDisplayTZ) {
        opts.timeZone = effectiveDisplayTZ;
    }
    
    // Determine year in the context of the display timezone
    const yearCheckDate = new Date(d.valueOf()); // Clone to avoid modifying original
    const yearOpts: Intl.DateTimeFormatOptions = { year: 'numeric' };
    if (effectiveDisplayTZ) yearOpts.timeZone = effectiveDisplayTZ;
    const yearInDisplayContext = parseInt(new Intl.DateTimeFormat('en-US', yearOpts).format(yearCheckDate), 10);

    if (forceYear || yearInDisplayContext !== currentYear) {
      opts.year = 'numeric';
    }
    return d.toLocaleDateString('en-US', opts);
  };

  // tz is the target timezone for displaying the time part.
  const formatCasualTime = (d: Date, tz: string | undefined): string => {
    const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    if (tz) {
      options.timeZone = tz;
    }
    let timeStr = d.toLocaleTimeString('en-US', options);
    timeStr = timeStr.replace(' AM', 'am').replace(' PM', 'pm');
    timeStr = timeStr.replace(':00pm', 'pm').replace(':00am', 'am');
    return timeStr;
  };

  // tz is the timezone context for determining the calendar date components.
  const getCalendarDateInTZ = (d: Date, tz: string | undefined): {year: number, month: number, day: number} => {
    const effectiveCalTZ = isAllDay ? 'UTC' : (tz || 'UTC');
    const parts = new Intl.DateTimeFormat('en-CA', { 
        year: 'numeric', month: '2-digit', day: '2-digit', timeZone: effectiveCalTZ 
    }).formatToParts(d);
    return {
        year: parseInt(parts.find(p => p.type === 'year')!.value, 10),
        month: parseInt(parts.find(p => p.type === 'month')!.value, 10) -1, // JS month 0-indexed
        day: parseInt(parts.find(p => p.type === 'day')!.value, 10)
    };
  };
  
  let baseDateDisplay = formatDatePart(startDateObj, start.timeZone ?? undefined);
  let result = `${summary} — ${baseDateDisplay}`;

  if (isAllDay) {
    const displayTZ = 'UTC'; // For all-day, base dates are UTC for stability
    baseDateDisplay = formatDatePart(startDateObj, displayTZ);
    if (inclusiveEndDateObj) {
        const startCalAllDay = getCalendarDateInTZ(startDateObj, displayTZ);
        const endCalAllDay = getCalendarDateInTZ(inclusiveEndDateObj, displayTZ);
        const isDifferentDay = (startCalAllDay.year !== endCalAllDay.year ||
                              startCalAllDay.month !== endCalAllDay.month ||
                              startCalAllDay.day !== endCalAllDay.day);
        if (isDifferentDay) {
            baseDateDisplay = `${formatDatePart(startDateObj, displayTZ)} - ${formatDatePart(inclusiveEndDateObj, displayTZ)}`;
        }
    }
    result = `${summary} — ${baseDateDisplay}, all day`;
    // The original start.timeZone for an all-day event is contextual, not for shifting the date itself.
    if (start.timeZone) {
      result += ` (${start.timeZone})`; 
    }
  } else {
    // Timed event
    const sTime = formatCasualTime(startDateObj, start.timeZone ?? undefined);
    const eTime = inclusiveEndDateObj ? formatCasualTime(inclusiveEndDateObj, (end?.timeZone ?? start.timeZone) || undefined) : null;

    const eventStartTZ = start.timeZone;
    const eventEndTZ = inclusiveEndDateObj ? ((end?.timeZone ?? eventStartTZ) || undefined) : undefined;

    let timeDetails = "";
    let endDatePrefix = "";

    if (inclusiveEndDateObj && eTime) {
        const sCal = getCalendarDateInTZ(startDateObj, eventStartTZ);
        const eCal = getCalendarDateInTZ(inclusiveEndDateObj, eventEndTZ);
        const isDifferentCalDate = (sCal.year !== eCal.year || sCal.month !== eCal.month || sCal.day !== eCal.day);
        
        if (isDifferentCalDate) {
            const endDateStr = formatDatePart(inclusiveEndDateObj, eventEndTZ);
            if (endDateStr && endDateStr.includes(',')) { // Date string already has a comma (e.g., due to year)
                endDatePrefix = endDateStr + " ";
            } else if (endDateStr) {
                endDatePrefix = endDateStr + ", ";
            }
        }

        if (eventStartTZ && eventEndTZ && eventStartTZ === eventEndTZ) {
            timeDetails = `${sTime} -> ${endDatePrefix}${eTime} (${eventStartTZ})`;
        } else {
            timeDetails = `${sTime}${eventStartTZ ? ` (${eventStartTZ})` : ''} -> ${endDatePrefix}${eTime}${eventEndTZ ? ` (${eventEndTZ})` : ''}`;
        }
    } else {
        timeDetails = sTime;
        if (eventStartTZ) {
            timeDetails += ` (${eventStartTZ})`;
        }
    }
    result += `, ${timeDetails}`;
  }
  return result.trim();
}


/**
 * Get field value from an event object
 * @param fieldPath - The field path to get
 * @param obj - The event object
 * @returns The field value
 */
export function getFieldValue(fieldPath: string, obj: any) {
  if (!obj) return undefined;
  
  // Convert fieldPath to lowercase for case-insensitive comparison
  const fieldLower = fieldPath.toLowerCase();
  
  if (fieldLower === 'start date/time' || fieldLower === 'start date' || fieldLower === 'start') {
    if (obj.start?.dateTime) {
      return formatDateReadable(obj.start.dateTime);
    }
    if (obj.start?.date) {
      return formatDateReadable(obj.start.date);
    }
    return undefined;
  }
  
  if (fieldLower === 'end date/time' || fieldLower === 'end date' || fieldLower === 'end') {
    if (obj.end?.dateTime) {
      return formatDateReadable(obj.end.dateTime);
    }
    if (obj.end?.date) {
      return formatDateReadable(obj.end.date);
    }
    return undefined;
  }
  
  if (fieldLower === 'start time zone') {
    return obj.start?.timeZone;
  }
  
  if (fieldLower === 'end time zone') {
    return obj.end?.timeZone;
  }
  
  if (fieldLower === 'location') {
    return obj.location;
  }
  
  if (fieldLower === 'summary' || fieldLower === 'title') {
    return obj.summary;
  }
  
  if (fieldLower === 'description') {
    return obj.description;
  }

  if (fieldLower === 'attendees') {
    return obj.attendees;
  }

  if (fieldLower === 'recurrence') {
    return obj.recurrence;
  }
  
  // Handle nested paths like 'start.dateTime'
  const parts = fieldPath.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  
  return current;
}

/**
 * Format field value based on field type
 * @param fieldName - The field name
 * @param value - The field value
 * @returns A formatted field value string
 */
export function formatFieldValue(fieldName: string, value: any): string {
  // Check for truly empty values
  if (value === undefined || value === null) {
    return "None";
  }
  
  // Handle string "undefined"
  if (value === "undefined" || value === "") {
    return "None";
  }
  
  const fieldNameLower = fieldName.toLowerCase();
  
  // Handle date fields with improved formatting
  if (fieldNameLower.includes('date') || fieldNameLower.includes('start') || fieldNameLower.includes('end')) {
    // If it's already a formatted date string with "at" (like from getFieldValue), return as is
    if (typeof value === 'string' && value.includes(' at ') && !value.includes('Invalid Date')) {
      return value;
    }
    
    // Try to parse and format date strings
    if (typeof value === 'string' && (value.includes('T') || value.includes('-'))) {
      return formatDateReadable(value);
    }
  }
  
  if (fieldNameLower.includes('recurrence')) {
    return formatRecurrence(value);
  }
  
  if (fieldNameLower.includes('attendee')) {
    return formatAttendees(value);
  }
  
  // Ensure we return a string
  return String(value);
}

/**
 * Get emoji for field type
 * @param fieldName - The field name
 * @returns An emoji representing the field type
 */
export function getFieldEmoji(fieldName: string): string {
  const fieldNameLower = fieldName.toLowerCase();
  if (fieldNameLower.includes('summary') || fieldNameLower.includes('title')) return '📋';
  if (fieldNameLower.includes('description')) return '📝';
  if (fieldNameLower.includes('location')) return '📍';
  if (fieldNameLower.includes('start') || fieldNameLower.includes('date')) return '📅';
  if (fieldNameLower.includes('time')) return '🕒';
  if (fieldNameLower.includes('recurrence')) return '🔄';
  if (fieldNameLower.includes('attendee')) return '👥';
  if (fieldNameLower.includes('meet') || fieldNameLower.includes('conference')) return '🧑‍💻';
  if (fieldNameLower.includes('notification') || fieldNameLower.includes('reminder')) return '🔔';
  return '✏️';
}

/**
 * Capitalize first letter of each word in the field name
 * @param fieldName - The field name
 * @returns A formatted field name
 */
export function formatFieldName(fieldName: string): string {
  return fieldName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Escape HTML special characters to prevent injection
 * @param text - The text to escape
 * @returns The escaped text
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Normalize spacing in a string by removing extra spaces
 * @param text - The text to normalize
 * @returns The normalized text
 */
function normalizeSpacing(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Compare two date/time strings and output only the changed parts with formatting
 * @param oldText - Original date/time string
 * @param newText - Updated date/time string
 * @returns HTML string with only the changed parts wrapped in <del> and custom span for additions
 */
export function formatDateTimeDiffMinimal(oldText: string, newText: string): string {
  // Handle empty or undefined inputs
  if (!oldText && !newText) return '';
  if (!oldText) return escapeHtml(newText);
  if (!newText) return `<del>${escapeHtml(oldText)}</del>`;
  
  // Normalize spacing and escape HTML
  const normalizedOld = normalizeSpacing(oldText);
  const normalizedNew = normalizeSpacing(newText);
  
  // If they're identical after normalization, return as is
  if (normalizedOld === normalizedNew) {
    return escapeHtml(normalizedNew);
  }
  
  // Determine if we should use word-level or character-level diffing
  // For time changes like 10:00 → 9:00, character diffing works better
  const isTimeChange = (
    // Check for time patterns like "10:00 AM" or "9:00"
    (/\d{1,2}:\d{2}/).test(normalizedOld) && 
    (/\d{1,2}:\d{2}/).test(normalizedNew)
  );
  
  // Use character diffing for short strings or time changes
  const useCharDiff = isTimeChange || 
                      normalizedOld.length < 10 || 
                      normalizedNew.length < 10;
  
  // Perform the diff
  const diffResult = useCharDiff 
    ? diffChars(normalizedOld, normalizedNew) 
    : diffWords(normalizedOld, normalizedNew);
  
  // Build the HTML output
  let result = '';
  let lastPartWasRemoved = false;
  
  diffResult.forEach(part => {
    // Escape the text to prevent HTML injection
    const escapedValue = escapeHtml(part.value);
    
    if (part.added) {
      // Add a space between deleted and added content if needed
      if (lastPartWasRemoved) {
        result += ' ';
      }
      
      // Added parts get a span with text-primary class instead of <ins> to avoid underline
      result += `<span class="text-primary">${escapedValue}</span>`;
      lastPartWasRemoved = false;
    } else if (part.removed) {
      // Removed parts get <del> tags
      result += `<del>${escapedValue}</del>`;
      lastPartWasRemoved = true;
    } else {
      // Unchanged parts remain as is
      result += escapedValue;
      lastPartWasRemoved = false;
    }
  });
  
  return result;
}


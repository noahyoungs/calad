import { 
  DateValue, 
  parseDate,
  parseDateTime, 
  toZoned, 
  getLocalTimeZone, 
  today,
  ZonedDateTime,
  CalendarDateTime
} from "@internationalized/date";

// Helper to convert DateValue to ISO format string for Google Calendar API
export const dateValueToISOString = (date: DateValue, timeZone?: string): string => {
  try {
    // For Google Calendar API, we need to represent the local time in UTC
    // Create a JavaScript Date from the date value
    const jsDate = new Date(date.toString());
    
    // If no timezone specified, just return the ISO string directly
    if (!timeZone) {
      return jsDate.toISOString();
    }
    
    // Create a string representation in the format YYYY-MM-DDTHH:MM:SS
    // WITHOUT timezone suffix - this is crucial
    const year = jsDate.getFullYear();
    const month = String(jsDate.getMonth() + 1).padStart(2, '0');
    const day = String(jsDate.getDate()).padStart(2, '0');
    const hours = String(jsDate.getHours()).padStart(2, '0');
    const minutes = String(jsDate.getMinutes()).padStart(2, '0');
    const seconds = String(jsDate.getSeconds()).padStart(2, '0');
    
    // Format the string without Z suffix
    // This is important - the absence of timezone indicator means 
    // the time should be interpreted in the specified timezone
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000`;
  } catch (e) {
    console.error('Error formatting date:', e);
    // Fall back to simple conversion but WITHOUT Z suffix
    const jsDate = new Date(date.toString());
    return jsDate.toISOString().replace('Z', '');
  }
};

// Helper to convert DateValue to YYYY-MM-DD format
export const dateValueToDateString = (date: DateValue): string => {
  return date.toString().split('T')[0];
}; 
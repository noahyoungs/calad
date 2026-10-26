import { z } from "zod";

// Get valid IANA time zones and create a schema for validation
const validTimeZones = Intl.supportedValuesOf('timeZone');

// Create a TimeZone enum type from the valid IANA time zones
export const TimeZone = {
  ...Object.fromEntries(validTimeZones.map(tz => [tz.replace(/\//g, '_').replace(/-/g, '_'), tz])),
} as const;

// Create a union type from the enum values
export type TimeZone = (typeof TimeZone)[keyof typeof TimeZone];

// Create a zod schema using string with validation
export const timeZoneSchemaEnum = z
  .enum(validTimeZones as [string, ...string[]])
  .describe("Must be a valid IANA time zone, like America/New_York or Europe/London");

export const timeZoneSchemaUnvalidated = z.string().describe("Must be a valid IANA time zone, like America/New_York or Europe/London");

/**
 * Converts a time or datetime from one timezone to another
 * 
 * @param dateTimeStr - The date and time to convert. Can be a time only (e.g., '3:00 PM', '15:00') 
 *                     or a full date and time (e.g., '2023-11-25T15:30:00')
 * @param fromTimeZone - Source IANA timezone (e.g., 'America/New_York')
 * @param toTimeZone - Target IANA timezone (e.g., 'Europe/London')
 * @returns An object with the original and converted datetime information
 */
export function convertTimeZone(
  dateTimeStr: string, 
  fromTimeZone: string, 
  toTimeZone: string
) {
  // Validate time zones
  const validTimeZones = Intl.supportedValuesOf('timeZone');
  if (!validTimeZones.includes(fromTimeZone)) {
    return {
      status: "error",
      error: `Invalid source time zone: ${fromTimeZone}. Must be a valid IANA time zone.`
    };
  }
  
  if (!validTimeZones.includes(toTimeZone)) {
    return {
      status: "error",
      error: `Invalid target time zone: ${toTimeZone}. Must be a valid IANA time zone.`
    };
  }
  try {
    // For time-only strings like "3:00 PM" or "15:00", add today's date
    const timeOnlyRegex = /^(\d{1,2})(:\d{2})?(:\d{2})?\s*(am|pm|AM|PM)?$/;
    let date: Date;
    let timeString: string = dateTimeStr;
    
    if (timeOnlyRegex.test(dateTimeStr)) {
      // It's a time-only string, extract the components
      const timeMatch = dateTimeStr.match(timeOnlyRegex);
      if (!timeMatch) {
        throw new Error("Failed to parse time format");
      }
      
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2].substring(1), 10) : 0;
      const seconds = timeMatch[3] ? parseInt(timeMatch[3].substring(1), 10) : 0;
      const ampm = timeMatch[4]?.toLowerCase();
      
      // Convert to 24-hour format if needed
      if (ampm === 'pm' && hours < 12) {
        hours += 12;
      } else if (ampm === 'am' && hours === 12) {
        hours = 0;
      }
      
      // Get today's date in the source timezone
      const todayInSourceTZ = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: fromTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      
      // Format today's date in the source timezone
      const dateParts = formatter.formatToParts(todayInSourceTZ);
      const year = dateParts.find(part => part.type === 'year')?.value;
      const month = dateParts.find(part => part.type === 'month')?.value;
      const day = dateParts.find(part => part.type === 'day')?.value;
      
      if (!year || !month || !day) {
        throw new Error("Could not determine current date in source timezone");
      }
      
      // Build a datetime string that specifies the timezone
      timeString = `${year}-${month}-${day}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Now, use Intl.DateTimeFormat to handle the timezone conversion directly
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'long',
    };
    
    // Create a new date object from our time string
    date = new Date(timeString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date or time format");
    }
    
    // Format the date in the source timezone
    const sourceFormatter = new Intl.DateTimeFormat('en-US', {
      ...options,
      timeZone: fromTimeZone
    });
    const originalDateTime = sourceFormatter.format(date);
    
    // Format the same date in the target timezone
    const targetFormatter = new Intl.DateTimeFormat('en-US', {
      ...options,
      timeZone: toTimeZone
    });
    const convertedDateTime = targetFormatter.format(date);
    
    return {
      originalDateTime,
      originalTimeZone: fromTimeZone,
      convertedDateTime,
      targetTimeZone: toTimeZone
    };
  } catch (error) {
    console.error("Time conversion error:", error);
    if (error instanceof Error) {
      return {
        status: "error",
        error: error.message
      };
    }
    return {
      status: "error",
      error: "An unknown error occurred during timezone conversion"
    };
  }
}

/**
 * Validates if a string is a valid IANA time zone
 * 
 * @param timeZone - The time zone string to validate
 * @returns An object indicating if the time zone is valid and an error message if not
 */
export function validateTimeZone(timeZone: string): { valid: boolean; error?: string } {
  if (!timeZone) {
    return { valid: false, error: "Time zone is required" };
  }
  
  if (!validTimeZones.includes(timeZone)) {
    return { 
      valid: false, 
      error: `Invalid time zone: ${timeZone}. Must be a valid IANA time zone like America/New_York or Europe/London.` 
    };
  }
  
  return { valid: true };
}
/**
 * Utility functions for generating a markdown calendar.
 */

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday, ...
}

export function generateMarkdownCalendar(year: number, month: number, highlightDate: Date): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  let markdown = `## ${monthNames[month]} ${year}\n\n`;
  markdown += '| Su | Mo | Tu | We | Th | Fr | Sa |\n';
  markdown += '|----|----|----|----|----|----|----|\n';

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month); // 0 (Sun) to 6 (Sat)

  let currentRow = '|';
  let dayOfMonth = 1;
  let dayOfWeekCounter = 0;

  // Add empty cells for days before the first of the month
  for (let i = 0; i < firstDay; i++) {
    currentRow += '    |'; // 4 spaces for empty cell content
    dayOfWeekCounter++;
  }

  // Add cells for each day of the month
  while (dayOfMonth <= daysInMonth) {
    const isHighlightDay = year === highlightDate.getFullYear() &&
                         month === highlightDate.getMonth() &&
                         dayOfMonth === highlightDate.getDate();

    let cellContent: string;
    const dayString = dayOfMonth.toString();

    if (isHighlightDay) {
      if (dayOfMonth < 10) { // Single digit highlightDay
        cellContent = `[${dayString}] `; // e.g. \"[7] \" - 4 chars
      } else { // Double digit highlightDay
        cellContent = `[${dayString}]`;   // e.g. \"[17]\" - 4 chars
      }
    } else { // Not highlightDay
      if (dayOfMonth < 10) { // Single digit other day
        cellContent = `  ${dayString} `; // e.g. \"  7 \" - 4 chars
      } else { // Double digit other day
        cellContent = ` ${dayString} `;  // e.g. \" 17 \" - 4 chars
      }
    }
    currentRow += cellContent + '|';
    dayOfMonth++;
    dayOfWeekCounter++;

    if (dayOfWeekCounter % 7 === 0) {
      markdown += currentRow + '\n';
      if (dayOfMonth <= daysInMonth) { // Start a new row only if there are more days
        currentRow = '|';
      } else {
        currentRow = ''; // No more days, clear currentRow to prevent adding an empty row
      }
      dayOfWeekCounter = 0; // Reset for the new week
    }
  }

  // Fill remaining cells in the last row if it\'s not full
  if (dayOfWeekCounter > 0 && dayOfWeekCounter < 7) {
    while (dayOfWeekCounter < 7) {
      currentRow += '    |'; // 4 spaces for empty cell content
      dayOfWeekCounter++;
    }
    markdown += currentRow + '\n';
  } else if (currentRow) { // Handles case where the month ends exactly on Saturday but currentRow wasn\'t reset (and thus contains content)
    markdown += currentRow + '\n';
  }

  return markdown;
}

/**
 * Generates markdown calendars for both the current month and the next month
 * @param dateString A date string to parse for determining the current date
 * @returns Markdown containing both calendars or an error message if parsing fails
 */
export function generateMarkdownCalendars(dateString: string): string {
  try {
    // Extract month, day, and year using regex
    const dateRegex = /([A-Za-z]+),\s+([A-Za-z]+)\s+(\d+),\s+(\d+)/;
    const match = dateString.match(dateRegex);
    
    if (match && match.length >= 5) {
      // match[2] is the month name, match[3] is the day, match[4] is the year
      const monthName = match[2]; // e.g., "May"
      const day = parseInt(match[3], 10); // e.g., 19
      const year = parseInt(match[4], 10); // e.g., 2025
      
      // Convert month name to month number (0-11)
      const monthMap: {[key: string]: number} = {
        'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
        'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
      };
      
      const month = monthMap[monthName];
      
      if (month !== undefined && !isNaN(day) && !isNaN(year)) {
        // Create a date object for highlighting the current day
        const date = new Date(year, month, day);
        
        // Generate current month calendar
        const currentMonthCalendar = generateMarkdownCalendar(year, month, date);
        
        // Calculate next month and year
        let nextMonth = month + 1;
        let nextYear = year;
        if (nextMonth > 11) {
          nextMonth = 0; // January
          nextYear += 1;
        }
        
        // Generate next month calendar
        const nextMonthCalendar = generateMarkdownCalendar(nextYear, nextMonth, date);
        
        // Combine both calendars
        return currentMonthCalendar + '\n' + nextMonthCalendar;
      } else {
        throw new Error('Failed to parse month, day, or year');
      }
    } else {
      throw new Error('Date string format not recognized');
    }
  } catch (error) {
    return '[Calendar display unavailable. Could not extract date components.]\n';
  }
}

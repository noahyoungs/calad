// Utility functions for chat component

/**
 * Formats a date for a specific timezone
 */
export const formatDateForTimezone = (timezone: string): string => {
  return new Date().toLocaleString('en-US', { 
    timeZone: timezone,
    dateStyle: 'full',
    timeStyle: 'long'
  });
};

/**
 * Gets the browser's local timezone
 */
export const getLocalTimeZone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Clears the isNewChat parameter from URL
 */
export const clearNewChatParam = (router: any): void => {
  const url = new URL(window.location.href);
  url.searchParams.delete("isNewChat");
  router.replace(url.pathname + url.search, { scroll: false });
}; 
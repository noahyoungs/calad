import SettingsLayoutBase from "@/components/settings/settings-layout-base";
import {
  fetchUserSettings,
  fetchUserGoogleCalendars,
  fetchSelectedCalendar,
  fetchUserEmails,
  type UserSettings,
  type UserEmail,
} from "@/actions/settings-actions";
import type { GoogleCalendarListItem } from "@/utils/fetch-google-calendars";

export default async function SettingsPage() {
  // Fetch initial data in parallel
  const [
    userSettingsResponse,
    googleCalendarsResult,
    selectedCalendarResponse,
    emailsResponse,
  ] = await Promise.all([
    fetchUserSettings(),
    fetchUserGoogleCalendars(),
    fetchSelectedCalendar(),
    fetchUserEmails(),
  ]);

  // Extract data and provide defaults
  const initialUserSettings: UserSettings = userSettingsResponse.data || {
    name: null,
    timezone: null,
    custom_instructions: null,
  };

  // Handle potential error fetching Google calendars (e.g., user not authenticated with Google yet)
  const initialAvailableCalendars: GoogleCalendarListItem[] = 
    googleCalendarsResult.data?.calendars || [];
  const googleCalendarError = googleCalendarsResult.data?.error;

  const initialSelectedCalendarId: string = selectedCalendarResponse.data || "";
  const initialEmails: UserEmail[] = emailsResponse.data || [];

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-full">
        <SettingsLayoutBase
          initialUserSettings={initialUserSettings}
          initialAvailableCalendars={initialAvailableCalendars}
          initialSelectedCalendarId={initialSelectedCalendarId}
          initialEmails={initialEmails}
          // Pass down any errors if needed for display
          googleCalendarError={googleCalendarError}
        />
      </div>
    </div>
  );
}

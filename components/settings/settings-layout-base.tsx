"use client";

import React, { useEffect, useState } from "react";
import { Tab, Tabs } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";

import GeneralSetting from "./general-setting";
// import MemorySetting from "./memory-setting"; // Assuming Memory is still commented out
import CalendarSetting from "./calendar-setting";
import EmailSetting from "./email-setting";
// import BillingSetting from "./billing-setting"; // Assuming Billing is still commented out

// Import types for props
import type {
  UserSettings,
  UserEmail,
} from "@/actions/settings-actions";
import type { GoogleCalendarListItem } from "@/utils/fetch-google-calendars";
import BillingSetting from "./billing-setting";

interface SettingsLayoutBaseProps {
  initialUserSettings: UserSettings | null;
  initialAvailableCalendars: GoogleCalendarListItem[];
  initialSelectedCalendarId: string | null;
  initialEmails: UserEmail[];
  googleCalendarError?: string; // Optional error prop
}

export default function SettingsLayoutBase({
  initialUserSettings,
  initialAvailableCalendars,
  initialSelectedCalendarId,
  initialEmails,
  googleCalendarError,
}: SettingsLayoutBaseProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTab, setSelectedTab] = useState("general");

  useEffect(() => {
    // Get tab from URL search param
    const tab = searchParams.get("tab");
    if (tab && ["general", "calendars", "email", "billing"].includes(tab)) {
      setSelectedTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (key: React.Key) => {
    setSelectedTab(key.toString());
    // Update URL without refreshing the page
    const url = new URL(window.location.href);
    url.searchParams.set("tab", key.toString());
    window.history.pushState({}, "", url);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 sm:mt-4 p-4">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold leading-9 text-foreground">Settings</h1>
        <h2 className="mt-2 text-small text-default-500">
          Customize settings, email preferences, and web appearance.
        </h2>
      </div>

      {/*  Tabs */}
      <Tabs
        fullWidth
        variant="bordered"
        color="primary"
        selectedKey={selectedTab}
        onSelectionChange={handleTabChange}
        classNames={{
          base: "mt-6",
          tabList: "gap-4",
          cursor: "bg-primary",
          panel: "w-full p-0 pt-4",
          tabContent: "group-data-[selected=true]:text-white",
        }}
      >
        <Tab key="general" title="General">
          <GeneralSetting initialSettings={initialUserSettings} />
        </Tab>
        {/* <Tab key="memory" title="Memory">
          <MemorySetting />
        </Tab> */}
        <Tab key="calendars" title="Calendars">
          <CalendarSetting
            availableCalendars={initialAvailableCalendars}
            selectedCalendarId={initialSelectedCalendarId}
            googleCalendarError={googleCalendarError}
          />
        </Tab>
        <Tab key="email" title="Email">
          <EmailSetting initialEmails={initialEmails} />
        </Tab>
        <Tab key="billing" title="Billing">
          <BillingSetting /> 
        </Tab>
      </Tabs>
    </div>
  );
}

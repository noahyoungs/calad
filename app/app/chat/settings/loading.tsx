"use client";

import { Skeleton, Tab, Tabs } from "@heroui/react";

export default function SettingsLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl mx-auto mt-10 md:mt-4 p-4">
        {/* Hardcoded Title */}
        <div>
          <h1 className="text-3xl font-bold leading-9 text-foreground">Settings</h1>
          <h2 className="mt-2 text-small text-default-500">
            Customize settings, email preferences, and web appearance.
          </h2>
        </div>

        {/* Use actual Tabs component */}
        <Tabs
          fullWidth
          variant="bordered"
          color="primary"
          classNames={{
            base: "mt-6",
            tabList: "gap-4",
            cursor: "bg-primary",
            panel: "w-full p-0 pt-4",
            tabContent: "group-data-[selected=true]:text-white",
          }}
          isDisabled
        >
          <Tab key="general" title="General">
            {/* General Settings Form Skeleton */}
            <div>
              {/* Name Field */}
              <div className="mb-8">
                <Skeleton className="h-6 w-20 rounded-md mb-1" />
                <Skeleton className="h-4 w-64 rounded-md mb-2" />
                <Skeleton className="h-12 w-full rounded-large" />
              </div>
              
              {/* Time Zone Field */}
              <div className="mb-8">
                <Skeleton className="h-6 w-40 rounded-md mb-1" />
                <Skeleton className="h-4 w-3/4 rounded-md mb-2" />
                <div className="flex gap-2">
                  <Skeleton className="h-12 flex-1 rounded-large" />
                  <Skeleton className="h-12 w-32 rounded-large" />
                </div>
              </div>
              
              {/* Custom Instructions */}
              <div className="mb-8">
                <Skeleton className="h-6 w-48 rounded-md mb-1" />
                <Skeleton className="h-4 w-64 rounded-md mb-2" />
                <div className="border border-default-200 rounded-medium overflow-hidden">
                  <div className="flex items-center p-2 border-b border-default-200">
                    <Skeleton className="h-6 w-6 rounded-md mr-1" />
                    <Skeleton className="h-6 w-6 rounded-md mr-1" />
                    <Skeleton className="h-6 w-24 rounded-md mx-1" />
                    <Skeleton className="h-6 w-6 rounded-md ml-2" />
                    <Skeleton className="h-6 w-6 rounded-md ml-1" />
                    <Skeleton className="h-6 w-6 rounded-md ml-1" />
                  </div>
                  <Skeleton className="h-[300px] w-full rounded-none" /> {/* Editor content */}
                </div>
                <Skeleton className="h-4 w-72 rounded-md mt-2" />
              </div>
              
              {/* Update Button */}
              <Skeleton className="h-12 w-28 rounded-large my-6" />
              
              {/* Delete Account Section */}
              <div className="border-t border-divider pt-6">
                <Skeleton className="h-6 w-36 rounded-md mb-1" />
                <Skeleton className="h-4 w-full rounded-md mb-4" />
                <Skeleton className="h-12 w-36 rounded-large" />
              </div>
            </div>
          </Tab>
          <Tab key="calendars" title="Calendars">
            {null}
          </Tab>
          <Tab key="email" title="Email">
            {null}
          </Tab>
          <Tab key="billing" title="Billing">
            {null}
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}

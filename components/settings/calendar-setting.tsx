"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { RadioGroup, Radio, Button, Spacer, addToast, cn } from "@heroui/react";
import { updateSelectedCalendar } from "@/actions/settings-actions";
import type { GoogleCalendarListItem } from "@/utils/fetch-google-calendars";
import { FormMessage } from "@/components/form-message";

interface CalendarSettingCardProps {
  className?: string;
  availableCalendars: GoogleCalendarListItem[];
  selectedCalendarId: string | null;
  googleCalendarError?: string;
}

const CalendarSetting = React.forwardRef<
  HTMLDivElement,
  CalendarSettingCardProps
>(
  (
    {
      className,
      availableCalendars,
      selectedCalendarId: initialSelectedId,
      googleCalendarError,
      ...props
    },
    ref
  ) => {
    const [selectedId, setSelectedId] = useState<string | undefined>(
      initialSelectedId || undefined
    );
    const [isPending, startTransition] = useTransition();

    const handleSave = async () => {
      if (!selectedId) {
        addToast({
          title: "No calendar selected",
          description: "Please select a calendar to save.",
          color: "warning",
        });
        return;
      }

      const formData = new FormData();
      formData.append("calendarId", selectedId);

      startTransition(async () => {
        const result = await updateSelectedCalendar(formData);
        if (result.success) {
          addToast({ title: "Default calendar updated", color: "success" });
        } else {
          addToast({
            title: "Error updating calendar",
            description: result.error || "An unknown error occurred.",
            color: "danger",
          });
        }
      });
    };

    return (
      <div
        ref={ref}
        className={cn("p-2", className)}
        {...props}
      >
        <p className="text-base font-medium text-default-700">
          Default Calendar
        </p>
        <p className="mt-1 text-sm font-normal text-default-400">
          cal.ad can currently work with only one calendar at a time. Select
          which calendar you want to use.

          If no calendar is selected, the google calendar default will be used.
        </p>

        {googleCalendarError && (
          <div className="mt-2">
            <FormMessage
              message={{
                error: `Error fetching calendars: ${googleCalendarError}. Please ensure your Google account is connected.`,
              }}
            />
          </div>
        )}

        {availableCalendars.length > 0 ? (
          <>
            <RadioGroup
              label="Select a calendar"
              value={selectedId}
              onValueChange={setSelectedId}
              className="mt-4 ph-no-capture"
              classNames={{ label: "sr-only" }}
            >
              {availableCalendars.map((calendar) => (
                <Radio
                  key={calendar.id}
                  value={calendar.id}
                  classNames={{
                    base: "group relative",
                    wrapper:
                      "border-2 group-data-[selected=true]:border-primary",
                    control: cn(
                      "after:bg-white after:rounded-full",
                      "before:bg-current before:rounded-full",
                      "group-data-[selected=true]:before:scale-100",
                      "group-data-[selected=true]:after:scale-100"
                    ),
                    labelWrapper: "flex flex-col gap-1 flex-1",
                  }}
                >
                  <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex flex-col">
                      <span className="text-default-700">
                        {calendar.summary}
                      </span>
                      {calendar.primary && (
                        <span className="text-xs text-default-400">
                          Primary Calendar
                        </span>
                      )}
                    </div>
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: calendar.backgroundColor || "#039BE5",
                      }}
                    />
                  </div>
                </Radio>
              ))}
            </RadioGroup>
            <Spacer y={6} />
            <div className="flex gap-2">
              <Button
                color="primary"
                onPress={handleSave}
                isLoading={isPending}
                className="!text-white"
                isDisabled={!selectedId || selectedId === initialSelectedId}
              >
                {isPending ? "Saving..." : "Save Calendar"}
              </Button>
            </div>
          </>
        ) : (
          !googleCalendarError && (
            <p className="mt-4 text-sm text-default-500">
              No Google Calendars found or account not connected.
            </p>
          )
        )}
      </div>
    );
  }
);

CalendarSetting.displayName = "CalendarSetting";

export default CalendarSetting;

import React, { useMemo } from "react";
import {
  Autocomplete,
  AutocompleteItem,
  AutocompleteSection,
} from "@heroui/react";
import { getLocalTimeZone } from "@internationalized/date";
import { TimeZoneItem, ALL_TIMEZONES, getGroupedTimeZones } from "../../utils/timeZones";

interface TimeZoneSelectorProps {
  id: string;
  selectedTimeZone: string;
  onTimeZoneChange: (timeZone: string) => void;
  label: string;
  helpText?: string;
  variant?: "bordered" | "underlined";
}

const TimeZoneSelector = React.memo(function TimeZoneSelector({
  id,
  selectedTimeZone,
  onTimeZoneChange,
  label,
  helpText,
  variant,
}: TimeZoneSelectorProps) {
  // Memoize grouped time zones to prevent recalculation on every render
  const groupedTimeZoneItems = useMemo(() => getGroupedTimeZones(), []);

  return (
    <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <Autocomplete<TimeZoneItem>
        id={id}
        defaultItems={groupedTimeZoneItems.flatMap(group => group.items)}
        selectedKey={selectedTimeZone || getLocalTimeZone()}
        onSelectionChange={(key) => onTimeZoneChange(key as string)}
        placeholder="Search time zones..."
        allowsCustomValue={false}
        defaultFilter={(textValue, inputValue) => 
          textValue.toLowerCase().includes(inputValue.toLowerCase())
        }
        isInvalid={selectedTimeZone !== "" && !ALL_TIMEZONES.includes(selectedTimeZone)}
        errorMessage="Please select a valid time zone"
        isVirtualized
        variant={variant}
      >
        {groupedTimeZoneItems.map(group => (
          <AutocompleteSection key={group.region} title={group.region}>
            {group.items.map(item => (
              <AutocompleteItem key={item.value} textValue={item.value}>
                {item.label}
              </AutocompleteItem>
            ))}
          </AutocompleteSection>
        ))}
      </Autocomplete>
      {helpText && <p className="text-xs text-gray-500">{helpText}</p>}
    </div>
  );
});

export default TimeZoneSelector; 
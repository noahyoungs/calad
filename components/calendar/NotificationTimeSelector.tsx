import React, { useState } from "react";
import { NumberInput, Select, SelectItem, Button, Chip } from "@heroui/react";
import { Icon } from "@iconify-icon/react";

// Time units with their conversion to minutes
const TIME_UNITS = [
  { key: "minutes", label: "Minutes", multiplier: 1 },
  { key: "hours", label: "Hours", multiplier: 60 },
  { key: "days", label: "Days", multiplier: 1440 },
  { key: "weeks", label: "Weeks", multiplier: 10080 },
];

// Format minutes to a human-readable string
export function formatMinutesToHumanReadable(minutes: number): string {
  if (minutes === 0) {
    return "At the time of event";
  }
  if (minutes === 1) {
    return "1 minute before";
  }
  if (minutes < 60) {
    return `${minutes} minutes before`;
  }
  if (minutes === 60) {
    return "1 hour before";
  }
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} before`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''} before`;
  }
  if (minutes === 1440) {
    return "1 day before";
  }
  if (minutes < 10080) {
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    if (remainingHours === 0) {
      return `${days} day${days > 1 ? 's' : ''} before`;
    }
    return `${days} day${days > 1 ? 's' : ''} ${remainingHours} hour${remainingHours > 1 ? 's' : ''} before`;
  }
  if (minutes === 10080) {
    return "1 week before";
  }
  
  const weeks = Math.floor(minutes / 10080);
  const remainingDays = Math.floor((minutes % 10080) / 1440);
  if (remainingDays === 0) {
    return `${weeks} week${weeks > 1 ? 's' : ''} before`;
  }
  return `${weeks} week${weeks > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''} before`;
}

interface NotificationTimeSelectorProps {
  notificationTimes: number[];
  onChange: (times: number[]) => void;
  disabled?: boolean;
}

export default function NotificationTimeSelector({
  notificationTimes,
  onChange,
  disabled = false,
}: NotificationTimeSelectorProps) {
  // State for new notification input
  const [timeValue, setTimeValue] = useState<number>(0);
  const [timeUnit, setTimeUnit] = useState<string>("minutes");
  
  // Add a new notification time
  const handleAddNotification = () => {
    if (timeValue <= 0) return;
    
    // Convert to minutes based on the selected unit
    const selectedUnit = TIME_UNITS.find(unit => unit.key === timeUnit);
    if (!selectedUnit) return;
    
    const minutesValue = timeValue * selectedUnit.multiplier;
    
    // Only add if not already in the list
    if (!notificationTimes.includes(minutesValue)) {
      const newTimes = [...notificationTimes, minutesValue];
      // Sort by time (from earliest to latest)
      newTimes.sort((a, b) => a - b);
      onChange(newTimes);
    }
  };
  
  // Remove a notification time
  const handleRemoveNotification = (time: number) => {
    onChange(notificationTimes.filter(t => t !== time));
  };
  
  // Handle key press (add on Enter)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNotification();
    }
  };

  return (
    <div className="space-y-4">
      {/* Display current notification times as chips */}
      {notificationTimes.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {notificationTimes
            .slice() // Create a copy to avoid modifying the original array
            .sort((a, b) => a - b) // Sort from earliest to latest
            .map((time) => (
              <Chip
                key={time}
                onClose={() => handleRemoveNotification(time)}
                variant="flat"
                color="primary"
                radius="sm"
                isDisabled={disabled}
              >
                {formatMinutesToHumanReadable(time)}
              </Chip>
            ))}
        </div>
      )}
      
      {/* Input for adding new notification times */}
      <div className="flex items-end justify-start">
        <NumberInput
          label="Notify"
          min={1}
          value={timeValue}
          onValueChange={setTimeValue}
          onKeyDown={handleKeyPress}
          isDisabled={disabled}
          className="flex-1"
          classNames={{
            label: "text-small font-medium",
          }}
          radius="lg"
          labelPlacement="outside-left"
        />
        
        <Select
          aria-label="Time unit"
          selectedKeys={[timeUnit]}
          onSelectionChange={(keys) => {
            const key = Array.from(keys)[0] as string;
            setTimeUnit(key);
          }}
          isDisabled={disabled}
          className="flex-1"
        >
          {TIME_UNITS.map((unit) => (
            <SelectItem key={unit.key}>
              {unit.label}
            </SelectItem>
          ))}
        </Select>
        <p className="text-default-600 text-sm font-medium text-foreground my-auto mx-4">before</p>
        
        <Button
          color="primary"
          onPress={handleAddNotification}
          isDisabled={disabled || timeValue <= 0}
          isIconOnly
          variant="flat"
        >
          <Icon icon="tabler:plus" className="" />
        </Button>
      </div>
    </div>
  );
} 
"use client";

import * as React from "react";
import { useState } from "react";
import { Spacer } from "@heroui/react";
import { DataTable, ColumnDefinition } from "../ui/data-table";

// Types for invitees and locations
type Invitee = {
  id: string;
  email: string;
  name?: string;
  notes?: string;
};

type Location = {
  id: string;
  location: string;
  notes?: string;
};

interface MemorySettingCardProps {
  className?: string;
}

const MemorySetting = React.forwardRef<HTMLDivElement, MemorySettingCardProps>(
  ({ className, ...props }, ref) => {
    // Sample data for invitees
    const [invitees, setInvitees] = useState<Invitee[]>([
      { id: "1", email: "john@example.com", name: "John Doe", notes: "Colleague" },
      { id: "2", email: "jane@example.com", name: "Jane Smith", notes: "Manager" },
    ]);

    // Sample data for locations
    const [locations, setLocations] = useState<Location[]>([
      { id: "1", location: "Conference Room A", notes: "3rd floor" },
      { id: "2", location: "Virtual Meeting", notes: "Zoom link required" },
    ]);

    // Column definitions for invitees table
    const inviteeColumns: ColumnDefinition<Invitee>[] = [
      { key: "email", label: "Email", required: true },
      { key: "name", label: "Name" },
      { key: "notes", label: "Notes", inputType: "textarea" },
    ];

    // Column definitions for locations table
    const locationColumns: ColumnDefinition<Location>[] = [
      { key: "location", label: "Location", required: true },
      { key: "notes", label: "Notes", inputType: "textarea" },
    ];

    // Handle updating an invitee
    const handleUpdateInvitee = (oldItem: Invitee, newItem: Invitee) => {
      setInvitees((prev) => 
        prev.map((item) => (item.id === oldItem.id ? newItem : item))
      );
    };

    // Handle updating a location
    const handleUpdateLocation = (oldItem: Location, newItem: Location) => {
      setLocations((prev) => 
        prev.map((item) => (item.id === oldItem.id ? newItem : item))
      );
    };

    return (
      <div ref={ref} className={className} {...props}>
        {/* Invitees Table */}
        <DataTable<Invitee>
          title="Known Invitees"
          description="Manage your frequently used contacts for calendar events."
          items={invitees}
          columns={inviteeColumns}
          itemKey="id"
          onAddItem={(item) => {
            const newItem = { ...item, id: Date.now().toString() };
            setInvitees((prev) => [...prev, newItem]);
          }}
          onDeleteItem={(item) => {
            setInvitees((prev) => prev.filter((i) => i.id !== item.id));
          }}
          onUpdateItem={handleUpdateInvitee}
          actionsEnabled={true}
          addButtonText="Add Invitee"
          modalTitle="Add New Invitee"
          editModalTitle="Edit Invitee"
        />

        <Spacer y={8} />

        {/* Locations Table */}
        <DataTable<Location>
          title="Known Locations"
          description="Manage your frequently used locations for calendar events."
          items={locations}
          columns={locationColumns}
          itemKey="id"
          onAddItem={(item) => {
            const newItem = { ...item, id: Date.now().toString() };
            setLocations((prev) => [...prev, newItem]);
          }}
          onDeleteItem={(item) => {
            setLocations((prev) => prev.filter((i) => i.id !== item.id));
          }}
          onUpdateItem={handleUpdateLocation}
          actionsEnabled={true}
          addButtonText="Add Location"
          modalTitle="Add New Location"
          editModalTitle="Edit Location"
        />
      </div>
    );
  }
);

MemorySetting.displayName = "MemorySetting";

export default MemorySetting; 
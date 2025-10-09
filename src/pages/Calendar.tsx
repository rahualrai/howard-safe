import React from "react";
import { EventsCalendar } from "@/components/EventsCalendar";
import { CalendarSync } from "@/components/CalendarSync";

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <h1 className="text-2xl font-bold mb-4">Calendar</h1>
      <div className="mb-8">
        <CalendarSync />
      </div>
      <EventsCalendar />
    </div>
  );
}
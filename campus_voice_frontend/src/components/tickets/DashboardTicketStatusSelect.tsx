"use client";

import type { TicketStatus } from "@/lib/types";

const statusLabel: Record<TicketStatus, string> = {
  SUBMITTED: "Submitted",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

const statusSelectClass: Record<TicketStatus, string> = {
  SUBMITTED: "border-slate-200 bg-white text-slate-700",
  IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-700",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const statusOptions: TicketStatus[] = ["SUBMITTED", "IN_PROGRESS", "RESOLVED"];

type DashboardTicketStatusSelectProps = {
  value: TicketStatus;
  canUpdate: boolean;
  isUpdating: boolean;
  onChange: (status: TicketStatus) => void;
};

export function DashboardTicketStatusSelect({
  value,
  canUpdate,
  isUpdating,
  onChange,
}: DashboardTicketStatusSelectProps) {
  if (!canUpdate) {
    return (
      <span
        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusSelectClass[value]}`}
      >
        {statusLabel[value]}
      </span>
    );
  }

  return (
    <select
      value={value}
      disabled={isUpdating}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.value as TicketStatus)}
      className={`h-8 rounded-full border px-2.5 text-xs font-medium outline-none transition focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 ${statusSelectClass[value]}`}
      aria-label="Update ticket status"
    >
      {statusOptions.map((status) => (
        <option key={status} value={status}>
          {statusLabel[status]}
        </option>
      ))}
    </select>
  );
}

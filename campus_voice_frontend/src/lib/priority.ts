import type { TicketPriority } from "@/lib/types";

export function formatPriorityLabel(priority: TicketPriority) {
  return priority === "HIGH" ? "HIGH Priority" : priority;
}

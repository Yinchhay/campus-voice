import { auth } from "@/lib/auth";
import type { Attachment, TicketPriority, TicketStatus } from "@/lib/types";
import type {
  StudentTicket,
  StudentTicketMessage,
  StudentTicketResolution,
} from "@/lib/student-api";

type BackendStudentTicket = Omit<
  StudentTicket,
  "category" | "category_id" | "category_name" | "has_media" | "attachments"
> & {
  category: number | { id: number | string; name?: string };
  category_name?: string;
  has_media?: boolean;
  attachments?: Attachment[];
  messages?: StudentTicketMessage[];
  priority: TicketPriority;
  status: TicketStatus;
  resolution?: StudentTicketResolution | null;
};

function buildServerApiUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;

  const absolutePublicApiUrl =
    process.env.NEXT_PUBLIC_API_URL && /^https?:\/\//.test(process.env.NEXT_PUBLIC_API_URL)
      ? process.env.NEXT_PUBLIC_API_URL
      : undefined;

  const baseUrl =
    process.env.SERVER_API_URL ??
    absolutePublicApiUrl ??
    (process.env.BACKEND_ORIGIN ? `${process.env.BACKEND_ORIGIN}/api` : undefined) ??
    "http://localhost:8000/api";

  const normalizedPath =
    baseUrl.endsWith("/api") && path.startsWith("/api/")
      ? path.slice(5)
      : path.replace(/^\//, "");

  return new URL(normalizedPath, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
}

function normalizeStudentTicket(ticket: BackendStudentTicket): StudentTicket {
  const categoryId =
    typeof ticket.category === "object"
      ? Number(ticket.category.id)
      : Number(ticket.category);

  return {
    ...ticket,
    category: categoryId,
    category_id: categoryId,
    attachments: ticket.attachments ?? [],
    has_media: Boolean(ticket.has_media || ticket.attachments?.length),
    category_name:
      ticket.category_name ||
      (typeof ticket.category === "object" ? ticket.category.name ?? "Unknown" : "Unknown"),
  };
}

async function getAuthHeaders() {
  const session = await auth();
  if (!session?.accessToken) return null;

  return {
    Authorization: `Bearer ${session.accessToken}`,
    "Content-Type": "application/json",
  };
}

export async function listMyTicketsServer() {
  const headers = await getAuthHeaders();
  if (!headers) throw new Error("Missing authenticated session.");

  const response = await fetch(buildServerApiUrl("/api/v1/tickets"), {
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load your reports.");
  }

  const data = (await response.json()) as BackendStudentTicket[];
  return data.map(normalizeStudentTicket);
}

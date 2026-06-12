import type { Attachment } from "@/lib/types";

const apiBaseURL =
  process.env.NEXT_PUBLIC_API_URL && /^https?:\/\//.test(process.env.NEXT_PUBLIC_API_URL)
    ? process.env.NEXT_PUBLIC_API_URL
    : "http://localhost:8000/api";

const apiOrigin = apiBaseURL.replace(/\/api\/?$/, "");

export function attachmentName(attachment: Attachment) {
  return attachment.original_name || attachment.file.split("/").pop() || "Attachment";
}

export function attachmentHref(attachment: Attachment) {
  if (/^https?:\/\//.test(attachment.file)) return attachment.file;
  if (attachment.file.startsWith("/")) return `${apiOrigin}${attachment.file}`;
  return `${apiOrigin}/${attachment.file}`;
}

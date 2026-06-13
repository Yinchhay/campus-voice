import type { Attachment } from "@/lib/types";

const apiBaseURL = process.env.NEXT_PUBLIC_API_URL || "/api";
const apiOrigin = apiBaseURL.startsWith("http")
  ? apiBaseURL.replace(/\/api\/?$/, "")
  : "";

export function attachmentName(attachment: Attachment) {
  return (
    attachment.original_name || attachment.file.split("/").pop() || "Attachment"
  );
}

export function attachmentHref(attachment: Attachment) {
  if (/^https?:\/\//.test(attachment.file)) return attachment.file;
  if (attachment.file.startsWith("/")) return `${apiOrigin}${attachment.file}`;
  return `${apiOrigin}/${attachment.file}`;
}

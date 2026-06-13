import type { Attachment } from "@/lib/types";
import { apiBaseURL } from "@/lib/axios";

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

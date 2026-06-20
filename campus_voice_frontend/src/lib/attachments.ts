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

export function attachmentExtension(attachment: Attachment) {
  const name = attachmentName(attachment).split("?")[0];
  const extension = name.split(".").pop();
  return extension ? extension.toLowerCase() : "";
}

export function isImageAttachment(attachment: Attachment) {
  return ["jpg", "jpeg", "png", "gif", "webp", "avif", "bmp", "svg"].includes(
    attachmentExtension(attachment),
  );
}

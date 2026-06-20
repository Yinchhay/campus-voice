"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { FileText, ImageIcon, Paperclip, X } from "lucide-react";
import {
  attachmentHref,
  attachmentName,
  isImageAttachment,
} from "@/lib/attachments";
import type { Attachment } from "@/lib/types";

type AttachmentPreviewProps = {
  attachment: Attachment;
  tone?: "default" | "success" | "chat" | "chatInverse";
  compact?: boolean;
};

const toneClass = {
  default:
    "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white",
  success:
    "border-emerald-200 bg-white/80 text-emerald-800 hover:bg-white",
  chat:
    "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
  chatInverse:
    "border-white/20 bg-white/10 text-white hover:bg-white/15",
};

export function AttachmentPreview({
  attachment,
  tone = "default",
  compact = false,
}: AttachmentPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const name = attachmentName(attachment);
  const href = attachmentHref(attachment);
  const isImage = isImageAttachment(attachment);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isImage) return;

    const controller = new AbortController();
    let objectUrl: string | null = null;

    async function loadFilePreview() {
      setIsLoadingFile(true);
      setFileError(null);
      setFilePreviewUrl(null);

      try {
        const response = await fetch(href, {
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load attachment.");
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setFilePreviewUrl(objectUrl);
      } catch {
        if (!controller.signal.aborted) {
          setFileError("This file could not be loaded for preview.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingFile(false);
        }
      }
    }

    loadFilePreview();

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [href, isImage, isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`group min-w-0 overflow-hidden rounded-xl border text-left transition ${toneClass[tone]} ${
          compact ? "mt-2 block max-w-56" : "block"
        }`}
        aria-label={`Preview ${name}`}
      >
        {isImage ? (
          <span className="block">
            <span
              className={`block overflow-hidden bg-slate-100 ${
                compact ? "h-28" : "aspect-video"
              }`}
            >
              <img
                src={href}
                alt={name}
                className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
              />
            </span>
            <span className="flex min-w-0 items-center gap-2 px-3 py-2 text-xs font-medium">
              <ImageIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="truncate">{name}</span>
            </span>
          </span>
        ) : (
          <span className="flex min-w-0 items-center gap-2 px-3 py-2 text-sm">
            <Paperclip className="h-4 w-4 shrink-0 opacity-70" />
            <span className="truncate">{name}</span>
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={name}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="flex h-[min(48rem,92vh)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                {isImage ? (
                  <ImageIcon className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {name}
                </p>
                <p className="text-xs text-slate-500">Attachment preview</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Close attachment preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 bg-slate-100">
              {isImage ? (
                <div className="flex h-full items-center justify-center p-4">
                  <img
                    src={href}
                    alt={name}
                    className="max-h-full max-w-full rounded-xl object-contain shadow-sm"
                  />
                </div>
              ) : isLoadingFile ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Loading preview...
                </div>
              ) : fileError ? (
                <div className="flex h-full items-center justify-center p-6 text-center">
                  <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <FileText className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-3 text-sm font-medium text-slate-900">
                      Preview unavailable
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{fileError}</p>
                  </div>
                </div>
              ) : filePreviewUrl ? (
                <iframe
                  src={filePreviewUrl}
                  title={name}
                  className="h-full w-full bg-white"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Preview unavailable.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

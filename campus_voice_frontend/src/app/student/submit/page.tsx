"use client";

import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Building2,
  CheckCircle2,
  FileText,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
  Tag,
  X,
} from "lucide-react";
import type { CategoryIssueType } from "@/lib/types";
import {
  createStudentTicket,
  listStudentCategories,
  type StudentCategory,
  type StudentTicket,
} from "@/lib/student-api";
import { AttachmentPreview } from "@/components/tickets/AttachmentPreview";

// ── Types ──────────────────────────────────────────────────────────────────────
type FormState = {
  category_id: string;
  title: string;
  description: string;
  is_anonymous: boolean;
  attachments: File[];
};

type FormErrors = Partial<
  Record<keyof Omit<FormState, "attachments" | "is_anonymous">, string>
>;

// ── Helpers ────────────────────────────────────────────────────────────────────
const MAX_ATTACHMENT_SIZE_MB = 10;
const MAX_ATTACHMENTS = 1;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ISSUE_TYPE_OPTIONS: Array<{
  value: CategoryIssueType;
  label: string;
  description: string;
  Icon: typeof Building2;
}> = [
  {
    value: "SERVICE",
    label: "Campus Services",
    description:
      "Facilities, safety, housing, transport, documents, and support services.",
    Icon: Building2,
  },
  {
    value: "ACADEMIC",
    label: "Academic Experience",
    description:
      "Classes, schedules, curriculum, instructors, labs, and academic results.",
    Icon: BookOpen,
  },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.category_id) errors.category_id = "Please select a category.";
  if (!form.title.trim()) errors.title = "Title is required.";
  else if (form.title.trim().length < 5)
    errors.title = "Title must be at least 5 characters.";
  else if (form.title.trim().length > 255)
    errors.title = "Title must be under 255 characters.";
  if (!form.description.trim()) errors.description = "Description is required.";
  else if (form.description.trim().length < 20)
    errors.description = "Please provide at least 20 characters of detail.";
  return errors;
}

function extractApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    if ("error" in data) {
      const apiError = data.error;
      if (typeof apiError === "string") return apiError;
      return JSON.stringify(apiError);
    }
    if ("detail" in data && typeof data.detail === "string") return data.detail;
  }

  return fallback;
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
      {message}
    </p>
  );
}

function FormLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-slate-700"
    >
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function SubmitReportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<StudentTicket | null>(
    null,
  );
  const [contentWasCensored, setContentWasCensored] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [categories, setCategories] = useState<StudentCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeIssueType, setActiveIssueType] =
    useState<CategoryIssueType>("SERVICE");
  const [categorySearch, setCategorySearch] = useState("");

  const [form, setForm] = useState<FormState>({
    category_id: "",
    title: "",
    description: "",
    is_anonymous: true,
    attachments: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const selectedCategory = categories.find(
    (c) => c.id === Number(form.category_id),
  );
  const visibleCategories = categories
    .filter((category) => category.issue_type === activeIssueType)
    .filter((category) => {
      const query = categorySearch.trim().toLowerCase();
      if (!query) return true;
      return `${category.name} ${category.description}`.toLowerCase().includes(query);
    });
  const categoryCounts = ISSUE_TYPE_OPTIONS.reduce(
    (counts, option) => {
      counts[option.value] = categories.filter(
        (category) => category.issue_type === option.value,
      ).length;
      return counts;
    },
    {} as Record<CategoryIssueType, number>,
  );

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      setIsLoadingCategories(true);
      setCategoryError(null);

      try {
        const data = await listStudentCategories();
        if (!isMounted) return;
        setCategories(data);
        setActiveIssueType((current) =>
          data.some((category) => category.issue_type === current)
            ? current
            : data[0]?.issue_type ?? current,
        );
      } catch (error) {
        if (!isMounted) return;
        setCategoryError(extractApiError(error, "Failed to load categories."));
      } finally {
        if (isMounted) setIsLoadingCategories(false);
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!submitted) return;

    const redirectTimer = window.setTimeout(() => {
      router.replace("/student/dashboard");
    }, 3000);

    return () => window.clearTimeout(redirectTimer);
  }, [router, submitted]);

  function handleCategoryChange(id: string) {
    setForm((prev) => ({
      ...prev,
      category_id: id,
    }));
    setTouched((prev) => ({ ...prev, category_id: true }));
  }

  function handleIssueTypeChange(issueType: CategoryIssueType) {
    setActiveIssueType(issueType);
    setForm((prev) => {
      const currentCategory = categories.find(
        (category) => category.id === Number(prev.category_id),
      );
      if (!currentCategory || currentCategory.issue_type === issueType) {
        return prev;
      }
      return {
        ...prev,
        category_id: "",
      };
    });
  }

  function handleFieldChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleAnonymousChange(value: boolean) {
    setForm((prev) => ({ ...prev, is_anonymous: value }));
  }

  function handleBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const newErrors = validate(form);
    setErrors(newErrors);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setAttachmentError(null);
    const file = files[0];

    if (!file) return;

    if (files.length > MAX_ATTACHMENTS) {
      setAttachmentError("Please attach one file at a time.");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setAttachmentError(`"${file.name}" is not a supported file type.`);
      return;
    }

    if (file.size > MAX_ATTACHMENT_SIZE_MB * 1024 * 1024) {
      setAttachmentError(
        `"${file.name}" exceeds the ${MAX_ATTACHMENT_SIZE_MB} MB limit.`,
      );
      return;
    }

    setForm((prev) => ({ ...prev, attachments: [file] }));
    // reset so same file can be re-added after removal
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAttachment(index: number) {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      category_id: true,
      title: true,
      description: true,
    });

    const newErrors = validate(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const submittedTitle = form.title.trim();
      const submittedDescription = form.description.trim();
      const ticket = await createStudentTicket({
        category: Number(form.category_id),
        title: submittedTitle,
        description: submittedDescription,
        is_anonymous: form.is_anonymous,
        attachments: form.attachments,
      });
      setSubmittedTicket(ticket);
      setContentWasCensored(
        ticket.title !== submittedTitle ||
          ticket.description !== submittedDescription,
      );
      setSubmitted(true);
    } catch (error) {
      setSubmitError(extractApiError(error, "Failed to submit report."));
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
        <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="w-full max-w-lg rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Report Submitted
            </h1>
            <p className="mt-3 text-slate-600">
              Your report has been received. You can track its status from your
              dashboard.
            </p>
            {contentWasCensored && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left">
                <p className="flex items-start gap-2 text-sm font-medium text-amber-800">
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  Some wording was automatically masked before your report was
                  saved.
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  You can review the final version from your dashboard.
                </p>
              </div>
            )}
            {submittedTicket && (
              <p className="mt-3 text-xs font-medium text-slate-500">
                Ticket ID: {submittedTicket.public_ticket_id}
              </p>
            )}
            <p className="mt-2 text-sm text-slate-500">
              Redirecting to your dashboard in a few seconds...
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/student/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-3 font-medium text-white transition hover:bg-blue-900"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/student/dashboard"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* Header */}
          <div className="border-b border-slate-100 p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Anonymous report submission
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              Submit New Report
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Fill in the details below. Your identity is kept private — only
              the report content and category are shared with staff.
            </p>
          </div>

          {/* Form body */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="divide-y divide-slate-100"
          >
            {/* ── Section 1: Category ── */}
            <div className="p-6 sm:p-8">
              <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                <Tag className="h-4 w-4" />
                Classification
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    What area does this report relate to?
                    <span className="ml-1 text-red-500">*</span>
                  </p>
                  <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 sm:grid-cols-2">
                    {ISSUE_TYPE_OPTIONS.map(({ value, label, description, Icon }) => {
                      const isActive = activeIssueType === value;
                      const count = categoryCounts[value] ?? 0;

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleIssueTypeChange(value)}
                          disabled={isLoadingCategories || Boolean(categoryError) || count === 0}
                          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-55 ${
                            isActive
                              ? "border-teal-300 bg-white shadow-sm"
                              : "border-transparent bg-transparent hover:bg-white"
                          }`}
                        >
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              isActive
                                ? "bg-teal-600 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-900">
                              {label}
                            </span>
                            <span className="mt-0.5 hidden text-xs leading-5 text-slate-600 sm:block">
                              {description}
                            </span>
                            <span className="mt-1 block text-xs font-medium text-slate-500">
                              {isLoadingCategories
                                ? "Loading..."
                                : `${count} categor${count === 1 ? "y" : "ies"}`}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-slate-700">
                      Choose the closest category
                      <span className="ml-1 text-red-500">*</span>
                    </p>
                    <label className="relative block sm:w-64">
                      <span className="sr-only">Search categories</span>
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="search"
                        value={categorySearch}
                        onChange={(event) => setCategorySearch(event.target.value)}
                        placeholder="Search categories"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </label>
                  </div>

                  {isLoadingCategories ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div
                          key={index}
                          className="h-14 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
                        />
                      ))}
                    </div>
                  ) : categoryError ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      <AlertTriangle className="mr-1.5 inline h-4 w-4" />
                      {categoryError}
                    </p>
                  ) : visibleCategories.length === 0 ? (
                    <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      No matching categories are available for this area.
                    </p>
                  ) : (
                    <div
                      className={`max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2 ${
                        touched.category_id && errors.category_id
                          ? "ring-2 ring-red-100"
                          : ""
                      }`}
                      role="radiogroup"
                      aria-label="Report category"
                    >
                      {visibleCategories.map((category) => {
                        const isSelected = form.category_id === String(category.id);

                        return (
                          <button
                            key={category.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => handleCategoryChange(String(category.id))}
                            onBlur={() => handleBlur("category_id")}
                            className={`w-full rounded-xl border px-3 py-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-teal-500/30 ${
                              isSelected
                                ? "border-teal-400 bg-white shadow-sm"
                                : "border-transparent bg-white hover:border-teal-200"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                  isSelected
                                    ? "border-teal-600 bg-teal-600"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected && (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                )}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-slate-900">
                                  {category.name}
                                </span>
                                {category.description && (
                                  <span className="mt-0.5 block line-clamp-1 text-xs leading-5 text-slate-600">
                                    {category.description}
                                  </span>
                                )}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedCategory && (
                    <p className="mt-2 rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-xs text-teal-800">
                      Selected:{" "}
                      <span className="font-semibold">{selectedCategory.name}</span>
                    </p>
                  )}
                  {touched.category_id && (
                    <FieldError message={errors.category_id} />
                  )}
                </div>
              </div>
            </div>

            {/* ── Section 2: Report Details ── */}
            <div className="p-6 sm:p-8">
              <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                <FileText className="h-4 w-4" />
                Report Details
              </h2>

              <div className="space-y-5">
                {/* Title */}
                <div>
                  <FormLabel htmlFor="title" required>
                    Report Title
                  </FormLabel>
                  <input
                    id="title"
                    type="text"
                    name="title"
                    placeholder="Brief summary of the issue (e.g., Broken fire exit on Floor 3)"
                    maxLength={255}
                    value={form.title}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    onBlur={() => handleBlur("title")}
                    className={`w-full rounded-xl border px-3.5 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:ring-2 focus:ring-teal-500/40 ${
                      touched.title && errors.title
                        ? "border-red-300 bg-red-50/40"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300 focus:border-teal-400 focus:bg-white"
                    }`}
                  />
                  <div className="mt-1 flex items-start justify-between">
                    <FieldError
                      message={touched.title ? errors.title : undefined}
                    />
                    <span className="ml-auto text-xs text-slate-400">
                      {form.title.length}/255
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <FormLabel htmlFor="description" required>
                    Description
                  </FormLabel>
                  <textarea
                    id="description"
                    name="description"
                    rows={6}
                    placeholder="Describe the incident in detail — what happened, when, where, and any relevant context that might help staff investigate…"
                    value={form.description}
                    onChange={(e) =>
                      handleFieldChange("description", e.target.value)
                    }
                    onBlur={() => handleBlur("description")}
                    className={`w-full resize-none rounded-xl border px-3.5 py-3 text-sm leading-relaxed text-slate-900 outline-none placeholder:text-slate-400 transition focus:ring-2 focus:ring-teal-500/40 ${
                      touched.description && errors.description
                        ? "border-red-300 bg-red-50/40"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300 focus:border-teal-400 focus:bg-white"
                    }`}
                  />
                  <FieldError
                    message={
                      touched.description ? errors.description : undefined
                    }
                  />
                  <p className="mt-2 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
                    Inappropriate language may be automatically masked before
                    the report is saved.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Section 3: Privacy ── */}
            <div className="p-6 sm:p-8">
              <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                <ShieldCheck className="h-4 w-4" />
                Privacy
              </h2>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label
                  htmlFor="is_anonymous"
                  className="flex cursor-pointer items-start gap-3"
                >
                  <input
                    id="is_anonymous"
                    name="is_anonymous"
                    type="checkbox"
                    checked={form.is_anonymous}
                    onChange={(e) => handleAnonymousChange(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-800">
                      Hide my identity from staff and admins
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">
                      Your account remains linked privately so you can track
                      this ticket, but staff-facing views will show the
                      submitter as anonymous.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {/* ── Section 4: Attachments ── */}
            <div className="p-6 sm:p-8">
              <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                <Paperclip className="h-4 w-4" />
                Attachments
                <span className="ml-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
                  Optional
                </span>
              </h2>

              {/* Drop zone */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group w-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-8 text-center transition hover:border-teal-400 hover:bg-teal-50/30 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              >
                <Paperclip className="mx-auto mb-2 h-6 w-6 text-slate-400 transition group-hover:text-teal-500" />
                <p className="text-sm font-medium text-slate-700 group-hover:text-teal-700">
                  Click to attach files
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  PDF, DOC, DOCX, JPG, or PNG — up to {MAX_ATTACHMENT_SIZE_MB}{" "}
                  MB
                </p>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(",")}
                className="hidden"
                onChange={handleFileChange}
              />

              {attachmentError && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {attachmentError}
                </p>
              )}

              {/* Attachment list */}
              {form.attachments.length > 0 && (
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {form.attachments.map((file, i) => (
                    <li
                      key={`${file.name}-${i}`}
                      className="rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <AttachmentPreview file={file} />
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="min-w-0 truncate text-xs text-slate-500">
                          {formatBytes(file.size)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeAttachment(i)}
                          className="flex-shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ── Footer / Submit ── */}
            <div className="flex flex-col gap-3 rounded-b-3xl bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                  {form.is_anonymous
                    ? "Your identity will be hidden from staff and admins."
                    : "Staff and admins will be able to see your account email for this report."}
                </p>
                {submitError && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    {submitError}
                  </p>
                )}
              </div>
              <div className="flex gap-2 sm:flex-shrink-0">
                <Link
                  href="/student/dashboard"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    isLoadingCategories ||
                    Boolean(categoryError)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray="32"
                          strokeDashoffset="12"
                        />
                      </svg>
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

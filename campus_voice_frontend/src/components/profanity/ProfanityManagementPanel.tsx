"use client";

import axios from "axios";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Ban,
  CheckCircle2,
  Filter,
  LockKeyhole,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import {
  createAdminProfanityWord,
  deleteAdminProfanityWord,
  listAdminProfanityWords,
  type AdminProfanityWord,
} from "@/lib/admin-api";
import { RBAC_PERMISSIONS } from "@/lib/dashboard-access";
import { useRbacPermissions } from "@/lib/rbac";

function extractApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    if ("word" in data && Array.isArray(data.word)) {
      return data.word.join(" ");
    }
    if ("error" in data && typeof data.error === "string") return data.error;
    if ("detail" in data && typeof data.detail === "string") return data.detail;
  }

  return fallback;
}

function formatWordDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProfanityManagementPanel() {
  const { hasPermission, isLoading: isPermissionLoading } = useRbacPermissions();
  const canView = hasPermission(RBAC_PERMISSIONS.profanity.view);
  const canCreate = hasPermission(RBAC_PERMISSIONS.profanity.create);
  const canDelete = hasPermission(RBAC_PERMISSIONS.profanity.delete);

  const [words, setWords] = useState<AdminProfanityWord[]>([]);
  const [newWord, setNewWord] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [wordPendingDelete, setWordPendingDelete] =
    useState<AdminProfanityWord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogError, setDeleteDialogError] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const normalizedWords = useMemo(
    () => new Set(words.map((item) => item.word.trim().toLowerCase())),
    [words],
  );

  const filteredWords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return words;
    return words.filter((item) => item.word.toLowerCase().includes(query));
  }, [search, words]);

  const newestWord = words[0];

  useEffect(() => {
    if (isPermissionLoading) return;
    if (!canView) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadWords() {
      setLoading(true);
      setError(null);

      try {
        const data = await listAdminProfanityWords();
        if (isMounted) {
          setWords(
            [...data].sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            ),
          );
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            extractApiError(loadError, "Unable to load profanity filter words."),
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadWords();

    return () => {
      isMounted = false;
    };
  }, [canView, isPermissionLoading]);

  function flashNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2500);
  }

  async function handleAddWord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreate) return;

    const word = newWord.trim();
    if (!word) {
      setError("Enter a word to add to the profanity filter.");
      return;
    }

    if (normalizedWords.has(word.toLowerCase())) {
      setError("That word is already in the profanity filter.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const created = await createAdminProfanityWord(word);
      setWords((current) => [created, ...current]);
      setNewWord("");
      flashNotice("Word added to the profanity filter.");
    } catch (saveError) {
      setError(extractApiError(saveError, "Unable to add profanity word."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteWord(word: AdminProfanityWord) {
    if (!canDelete) return;

    setDeletingId(word.id);
    setError(null);
    setDeleteDialogError("");

    try {
      await deleteAdminProfanityWord(word.id);
      setWords((current) => current.filter((item) => item.id !== word.id));
      setWordPendingDelete(null);
      flashNotice("Word removed from the profanity filter.");
    } catch (deleteError) {
      const message = extractApiError(
        deleteError,
        "Unable to delete profanity word.",
      );
      setDeleteDialogError(message);
      setError(message);
    } finally {
      setDeletingId(null);
    }
  }

  if (!isPermissionLoading && !canView) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-amber-950">
              Profanity management unavailable
            </h2>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              Your current role needs the profanity.view permission to access
              this dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-500">Custom words</p>
            <Ban className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {words.length}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Added on top of the backend default filter.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-emerald-800">Filter status</p>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-emerald-950">
            Active
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            Applies to ticket titles, descriptions, and messages.
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-blue-800">Latest update</p>
            <ShieldAlert className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-3 truncate text-2xl font-semibold tracking-tight text-blue-950">
            {newestWord ? newestWord.word : "None"}
          </p>
          <p className="mt-1 text-sm text-blue-700">
            {newestWord
              ? `Added ${formatWordDate(newestWord.created_at)}`
              : "No custom words added yet."}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <Plus className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Add custom word
              </h2>
              <p className="mt-0.5 text-sm leading-6 text-slate-500">
                New entries take effect immediately after the backend cache is
                refreshed.
              </p>
            </div>
          </div>

          {!canCreate && (
            <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Your role can view this dashboard, but needs profanity.create to
              add new words.
            </p>
          )}

          <form onSubmit={handleAddWord} className="space-y-3">
            <div>
              <label htmlFor="profanity-word" className="sr-only">
                Profanity word
              </label>
              <input
                id="profanity-word"
                type="text"
                value={newWord}
                onChange={(event) => {
                  setNewWord(event.target.value);
                  if (error) setError(null);
                }}
                placeholder="Add a custom word"
                disabled={loading || saving || !canCreate}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              disabled={loading || saving || !canCreate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {saving ? "Adding..." : "Add word"}
            </button>
          </form>

          {error && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {notice && (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {notice}
            </p>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Filter words
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {filteredWords.length} of {words.length} custom words shown
                </p>
              </div>
              <div className="relative sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search words"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {loading || isPermissionLoading ? (
            <div className="px-5 py-8 text-sm text-slate-500">
              Loading profanity words...
            </div>
          ) : words.length === 0 ? (
            <div className="px-5 py-8">
              <div className="flex items-start gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <Filter className="mt-0.5 h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    No custom words yet
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    The backend default profanity list still applies.
                  </p>
                </div>
              </div>
            </div>
          ) : filteredWords.length === 0 ? (
            <div className="px-5 py-8 text-sm text-slate-500">
              No words match your search.
            </div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {filteredWords.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {item.word}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Added {formatWordDate(item.created_at)}
                    </p>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteDialogError("");
                        setWordPendingDelete(item);
                      }}
                      disabled={deletingId === item.id}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Delete ${item.word}`}
                      title={`Delete ${item.word}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {wordPendingDelete && (
        <DeleteConfirmDialog
          title="Delete profanity word?"
          description="This removes the custom word from the moderation filter. This cannot be undone."
          itemLabel={wordPendingDelete.word}
          isDeleting={deletingId === wordPendingDelete.id}
          error={deleteDialogError}
          confirmLabel="Delete Word"
          onClose={() => {
            if (deletingId === null) {
              setDeleteDialogError("");
              setWordPendingDelete(null);
            }
          }}
          onConfirm={() => void handleDeleteWord(wordPendingDelete)}
        />
      )}
    </div>
  );
}

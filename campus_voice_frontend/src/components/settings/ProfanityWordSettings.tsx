"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Ban, Plus, ShieldAlert, Trash2 } from "lucide-react";
import {
  createAdminProfanityWord,
  deleteAdminProfanityWord,
  listAdminProfanityWords,
  type AdminProfanityWord,
} from "@/lib/admin-api";

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

export function ProfanityWordSettings() {
  const [words, setWords] = useState<AdminProfanityWord[]>([]);
  const [newWord, setNewWord] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const normalizedWords = useMemo(
    () => new Set(words.map((item) => item.word.trim().toLowerCase())),
    [words],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadWords() {
      setLoading(true);
      setError(null);

      try {
        const data = await listAdminProfanityWords();
        if (isMounted) setWords(data);
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
  }, []);

  function flashNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2500);
  }

  async function handleAddWord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
    setDeletingId(word.id);
    setError(null);

    try {
      await deleteAdminProfanityWord(word.id);
      setWords((current) => current.filter((item) => item.id !== word.id));
      flashNotice("Word removed from the profanity filter.");
    } catch (deleteError) {
      setError(extractApiError(deleteError, "Unable to delete profanity word."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <ShieldAlert className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Profanity Filter
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage custom words automatically masked in student ticket titles
            and descriptions.
          </p>
        </div>
      </div>

      <form onSubmit={handleAddWord} className="flex flex-col gap-3 sm:flex-row">
        <div className="min-w-0 flex-1">
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
            disabled={loading || saving}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={loading || saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
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

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-800">Custom words</p>
            <p className="text-xs text-slate-500">
              {words.length} {words.length === 1 ? "word" : "words"} configured
            </p>
          </div>
          <Ban className="h-4 w-4 text-slate-400" />
        </div>

        {loading ? (
          <div className="px-4 py-5 text-sm text-slate-500">
            Loading profanity words...
          </div>
        ) : words.length === 0 ? (
          <div className="px-4 py-5 text-sm text-slate-500">
            No custom words have been added yet. The backend default profanity
            list still applies.
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {words.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {item.word}
                  </p>
                  <p className="text-xs text-slate-500">
                    Added {formatWordDate(item.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteWord(item)}
                  disabled={deletingId === item.id}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Delete ${item.word}`}
                  title={`Delete ${item.word}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

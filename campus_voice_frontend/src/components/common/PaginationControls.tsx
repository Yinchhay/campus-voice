import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationControlsProps = {
  page: number;
  pageSize: number;
  total: number;
  isLoading?: boolean;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function PaginationControls({
  page,
  pageSize,
  total,
  isLoading = false,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  const canGoPrevious = page > 1 && !isLoading;
  const canGoNext = page < totalPages && !isLoading;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 bg-white px-5 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <span className="font-medium text-slate-900">{start}-{end}</span>
        <span> of </span>
        <span className="font-medium text-slate-900">{total}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="page-size" className="text-xs font-medium text-slate-500">
          Rows
        </label>
        <select
          id="page-size"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          disabled={isLoading}
          className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none transition focus:border-[#1E3A8A] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <div className="flex items-center overflow-hidden rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoPrevious}
            className="inline-flex h-9 w-9 items-center justify-center bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex h-9 min-w-24 items-center justify-center border-x border-slate-200 px-3 text-xs font-medium text-slate-700">
            {page} / {totalPages}
          </div>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoNext}
            className="inline-flex h-9 w-9 items-center justify-center bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

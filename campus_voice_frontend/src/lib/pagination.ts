export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ListQueryParams = {
  page?: number;
  page_size?: number;
  filters?: string;
  status?: string;
  sort_by?: string;
  sort_desc?: boolean;
  date_range?: string;
};

export function unwrapPaginated<T>(data: T[] | PaginatedResponse<T>): T[] {
  return Array.isArray(data) ? data : data.results;
}

export function toPaginatedResponse<T>(
  data: T[] | PaginatedResponse<T>,
): PaginatedResponse<T> {
  if (!Array.isArray(data)) return data;
  return {
    count: data.length,
    next: null,
    previous: null,
    results: data,
  };
}

export function withDefaultPageSize(params: ListQueryParams = {}) {
  return {
    page_size: 100,
    ...params,
  };
}

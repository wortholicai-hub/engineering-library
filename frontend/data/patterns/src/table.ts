/**
 * INTERNAL CODE — safe to edit.
 *
 * TanStack Table is headless: it ships logic, no markup and no defaults. That
 * is the right trade-off, but it means every project otherwise re-decides page
 * size, how sorting maps to an API query, and how to render "Showing 1–25 of
 * 312". Those decisions are made once, here.
 *
 * Pair with shadcn/ui's data-table block for the markup:
 *   frontend/shadcn/upstream/ui (pinned) — read, never edit.
 *
 * Upstream reference for the API: frontend/data/upstream/table (pinned).
 */

import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type InitialTableState,
  type PaginationState,
  type SortingState,
  type TableOptions,
} from '@tanstack/react-table';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './schemas.js';

export { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE };

/** Typed column builder for a row shape: `const col = columnsFor<User>()`. */
export const columnsFor = <TData,>() => createColumnHelper<TData>();

/**
 * Initial table state with our defaults applied.
 * Keeps page size consistent across every table in every product.
 */
export function initialTableState(overrides: InitialTableState = {}): InitialTableState {
  return {
    pagination: { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE },
    sorting: [],
    columnFilters: [],
    ...overrides,
  };
}

/**
 * Everything `useReactTable` needs for a table that sorts, filters and
 * paginates in the browser:
 *
 *   const table = useReactTable(clientTable({ data, columns }));
 *
 * Use this when the dataset is already fully loaded. Past a few thousand rows,
 * move sorting and pagination to the server and use `sortingToQuery` below.
 */
export function clientTable<TData>({
  data,
  columns,
  initialState,
}: {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  initialState?: InitialTableState;
}): TableOptions<TData> {
  return {
    data,
    columns,
    initialState: initialTableState(initialState),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  };
}

/**
 * Translate table state into API query parameters.
 *
 * TanStack sorting is an array (multi-column). Our list endpoints accept a
 * single sort field, so only the primary sort is sent — deliberately, rather
 * than silently dropping the rest somewhere further down the stack.
 */
export function sortingToQuery(
  sorting: SortingState,
  pagination?: PaginationState,
): { page?: number; pageSize?: number; sort?: string; order?: 'asc' | 'desc' } {
  const query: { page?: number; pageSize?: number; sort?: string; order?: 'asc' | 'desc' } = {};
  const [primary] = sorting;
  if (primary) {
    query.sort = primary.id;
    query.order = primary.desc ? 'desc' : 'asc';
  }
  if (pagination) {
    // Tables are zero-indexed; APIs and humans are one-indexed.
    query.page = pagination.pageIndex + 1;
    query.pageSize = pagination.pageSize;
  }
  return query;
}

/** The inverse: restore table sorting from a URL or API query. */
export function queryToSorting(query: { sort?: string; order?: string }): SortingState {
  if (!query.sort) return [];
  return [{ id: query.sort, desc: query.order === 'desc' }];
}

/**
 * The numbers behind "Showing 1–25 of 312".
 *
 * `from` and `to` are one-indexed and inclusive; an empty result gives
 * `from === 0`, so the caller can render "No results" instead of "0–0 of 0".
 */
export function pageInfo(
  pagination: PaginationState,
  totalRows: number,
): { from: number; to: number; total: number; pageCount: number; isEmpty: boolean } {
  const total = Math.max(0, totalRows);
  const pageSize = Math.max(1, pagination.pageSize);
  const pageCount = Math.ceil(total / pageSize);
  // A page index past the end (stale URL, rows deleted) must not render
  // "Showing 51–50 of 40" — it collapses to the empty case instead.
  const firstRow = pagination.pageIndex * pageSize + 1;
  const from = total === 0 || firstRow > total ? 0 : firstRow;
  const to = from === 0 ? 0 : Math.min(total, pagination.pageIndex * pageSize + pageSize);
  return { from, to, total, pageCount, isEmpty: total === 0 };
}

// ---------------------------------------------------------------------------
// Cell formatters — pure string functions, so they are testable and reusable
// outside a table (exports, PDFs, emails).
// ---------------------------------------------------------------------------

/** Money stored in MINOR units rendered in the user's locale. */
export function formatMoney(
  minorUnits: number,
  { currency = 'USD', locale = 'en-US' }: { currency?: string; locale?: string } = {},
): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minorUnits / 100);
}

export function formatDate(
  value: string | number | Date,
  { locale = 'en-US', style = 'medium' }: { locale?: string; style?: 'short' | 'medium' | 'long' } = {},
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, { dateStyle: style }).format(date);
}

/** `0.0731` → `7.3%`. Takes a ratio, not an already-multiplied number. */
export function formatPercent(ratio: number, { locale = 'en-US', digits = 1 } = {}): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(ratio);
}

/** Large counts, compactly: `12_400` → `12.4K`. */
export function formatCompact(value: number, { locale = 'en-US' } = {}): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

import { describe, expect, it } from 'vitest';
import type { PaginationState } from '@tanstack/react-table';
import {
  clientTable,
  columnsFor,
  formatCompact,
  formatDate,
  formatMoney,
  formatPercent,
  initialTableState,
  pageInfo,
  queryToSorting,
  sortingToQuery,
  DEFAULT_PAGE_SIZE,
} from './table.js';

type User = { id: string; name: string; spendMinor: number };

describe('initialTableState', () => {
  it('applies the house page size', () => {
    expect(initialTableState().pagination).toEqual({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });
  });

  it('lets a caller override without losing the other defaults', () => {
    const state = initialTableState({ pagination: { pageIndex: 2, pageSize: 10 } });
    expect(state.pagination).toEqual({ pageIndex: 2, pageSize: 10 });
    expect(state.sorting).toEqual([]);
  });
});

describe('clientTable', () => {
  const columns = (() => {
    const col = columnsFor<User>();
    return [col.accessor('name', { header: 'Name' }), col.accessor('spendMinor', { header: 'Spend' })];
  })();

  it('supplies every row model a client-side table needs', () => {
    const options = clientTable<User>({ data: [], columns });
    expect(typeof options.getCoreRowModel).toBe('function');
    expect(typeof options.getSortedRowModel).toBe('function');
    expect(typeof options.getFilteredRowModel).toBe('function');
    expect(typeof options.getPaginationRowModel).toBe('function');
  });

  it('passes data and columns through with our initial state', () => {
    const data: User[] = [{ id: '1', name: 'Ada', spendMinor: 1999 }];
    const options = clientTable<User>({ data, columns });
    expect(options.data).toBe(data);
    expect(options.columns).toHaveLength(2);
    expect(options.initialState?.pagination?.pageSize).toBe(DEFAULT_PAGE_SIZE);
  });
});

describe('sortingToQuery / queryToSorting', () => {
  it('converts the primary sort and one-indexes the page', () => {
    expect(
      sortingToQuery([{ id: 'name', desc: true }], { pageIndex: 2, pageSize: 25 }),
    ).toEqual({ sort: 'name', order: 'desc', page: 3, pageSize: 25 });
  });

  it('omits sort entirely when nothing is sorted', () => {
    expect(sortingToQuery([])).toEqual({});
  });

  it('round-trips through a query object', () => {
    const sorting = [{ id: 'createdAt', desc: true }];
    expect(queryToSorting(sortingToQuery(sorting))).toEqual(sorting);
  });

  it('treats a missing sort field as unsorted', () => {
    expect(queryToSorting({ order: 'desc' })).toEqual([]);
  });
});

describe('pageInfo', () => {
  const page = (pageIndex: number, pageSize = 25): PaginationState => ({ pageIndex, pageSize });

  it('describes a full first page', () => {
    expect(pageInfo(page(0), 312)).toEqual({ from: 1, to: 25, total: 312, pageCount: 13, isEmpty: false });
  });

  it('stops at the total on the last page', () => {
    expect(pageInfo(page(12), 312)).toMatchObject({ from: 301, to: 312 });
  });

  it('reports empty rather than "0-0 of 0"', () => {
    expect(pageInfo(page(0), 0)).toMatchObject({ from: 0, to: 0, isEmpty: true, pageCount: 0 });
  });

  it('collapses a page index past the end instead of inverting the range', () => {
    // Stale URL, or rows deleted while someone was on page 9.
    expect(pageInfo(page(8), 40)).toMatchObject({ from: 0, to: 0 });
  });
});

describe('formatters', () => {
  it('renders minor units as currency', () => {
    expect(formatMoney(129900)).toBe('$1,299.00');
    expect(formatMoney(129900, { currency: 'EUR', locale: 'de-DE' })).toContain('1.299,00');
  });

  it('renders a ratio as a percentage', () => {
    expect(formatPercent(0.0731)).toBe('7.3%');
  });

  it('compacts large counts', () => {
    expect(formatCompact(12_400)).toBe('12.4K');
  });

  it('formats dates and degrades to a dash on garbage', () => {
    expect(formatDate('2026-03-04T00:00:00.000Z')).toMatch(/2026/);
    expect(formatDate('not a date')).toBe('—');
  });
});

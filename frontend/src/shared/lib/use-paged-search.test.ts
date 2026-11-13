import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PAGE_SIZE, usePagedSearch } from './use-paged-search';

const matches = (item: string, term: string) =>
  item.toLowerCase().includes(term);
const items = Array.from(
  { length: 25 },
  (_, i) => `item-${String(i + 1).padStart(2, '0')}`,
);

describe('usePagedSearch', () => {
  it('shows the first page of a long list', () => {
    const { result } = renderHook(() => usePagedSearch(items, matches));
    expect(result.current.rows).toHaveLength(25);
    expect(result.current.visible).toHaveLength(PAGE_SIZE);
    expect(result.current.page).toBe(1);
  });

  it('is empty while the list has not loaded', () => {
    const { result } = renderHook(() => usePagedSearch(undefined, matches));
    expect(result.current.rows).toEqual([]);
    expect(result.current.visible).toEqual([]);
  });

  it('moves between pages, and the last one is short', () => {
    const { result } = renderHook(() => usePagedSearch(items, matches));
    act(() => result.current.setPage(3));
    expect(result.current.visible).toHaveLength(5);
    expect(result.current.page).toBe(3);
  });

  it('goes back to page 1 on a new search, ignoring case and spaces around it', () => {
    const { result } = renderHook(() => usePagedSearch(items, matches));
    act(() => result.current.setPage(3));
    act(() => result.current.setSearch('  ITEM-1 '));
    expect(result.current.page).toBe(1);
    expect(result.current.rows).toHaveLength(10); // item-10 to item-19
  });

  it('goes back to page 1 when a filter changes (the reset key)', () => {
    const { result, rerender } = renderHook(
      ({ key }) => usePagedSearch(items, matches, key),
      { initialProps: { key: 'a' } },
    );
    act(() => result.current.setPage(2));
    expect(result.current.page).toBe(2);
    rerender({ key: 'b' });
    expect(result.current.page).toBe(1);
  });

  it('never shows a page past the end when the list shrinks', () => {
    const { result, rerender } = renderHook(
      ({ list }) => usePagedSearch(list, matches),
      {
        initialProps: { list: items },
      },
    );
    act(() => result.current.setPage(3));
    rerender({ list: items.slice(0, 12) });
    expect(result.current.page).toBe(2);
  });
});

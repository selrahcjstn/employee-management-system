import { useMemo, useState } from 'react';

export const PAGE_SIZE = 10;

/**
 * Search and pages over a list that is already loaded. A new search starts on page 1 without an
 * effect: the page belongs to the search (and filters) it was chosen in. `matches` should be a stable function
 * (declared outside the component) and receives the trimmed, lower-cased search.
 */
export function usePagedSearch<T>(
  items: T[] | undefined,
  matches: (item: T, term: string) => boolean,
  /** Changes when a filter changes, so the list goes back to page 1 like it does for a new search. */
  resetKey = '',
) {
  const [search, setSearch] = useState('');
  const term = search.trim().toLowerCase();
  const view = `${term}|${resetKey}`;
  const [pageState, setPageState] = useState({ view: '|', page: 1 });

  const rows = useMemo(() => {
    if (!items) return [];
    return term ? items.filter((item) => matches(item, term)) : items;
  }, [items, term, matches]);

  const lastPage = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const requested = pageState.view === view ? pageState.page : 1;
  const page = Math.min(requested, lastPage);

  return {
    search,
    setSearch,
    term,
    /** Everything that matches the search. */
    rows,
    /** The rows of the current page. */
    visible: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    page,
    setPage: (next: number) => setPageState({ view, page: next }),
  };
}

import type { ReactNode } from 'react';
import { SearchIcon } from './icons';
import { TextField } from './TextField';

interface ListCardProps {
  /** Names the search field for screen readers (it has no visible label). */
  searchLabel: string;
  placeholder: string;
  search: string;
  onSearch: (value: string) => void;
  /** Something beside the search field, such as a filter. */
  toolbar?: ReactNode;
  /** The table, or the state that replaces it (loading, empty, error). */
  children: ReactNode;
  /** Pagination under the table. */
  footer?: ReactNode;
}

/** The card every list page shares: a search bar on top, the table (or its state) in the middle, pages below. */
export function ListCard({
  searchLabel,
  placeholder,
  search,
  onSearch,
  toolbar,
  children,
  footer,
}: ListCardProps) {
  return (
    <section className="mt-6 rounded-lg border border-neutral-200 bg-neutral-0 shadow-sm">
      <div className="flex flex-wrap items-center gap-4 border-b border-neutral-200 p-4">
        <TextField
          type="search"
          label={searchLabel}
          hideLabel
          placeholder={placeholder}
          autoComplete="off"
          startAdornment={<SearchIcon />}
          className="w-full max-w-sm"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
        {toolbar}
      </div>
      {children}
      {footer}
    </section>
  );
}

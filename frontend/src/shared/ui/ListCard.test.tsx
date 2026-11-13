import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ListCard } from './ListCard';

function renderCard() {
  return render(
    <ListCard
      searchLabel="Search things"
      placeholder="Search"
      search=""
      onSearch={() => {}}
      toolbar={<button>Filter</button>}
      footer={<p>Footer</p>}
    >
      <p>Body</p>
    </ListCard>,
  );
}

describe('ListCard', () => {
  it('puts the search, the toolbar, the body and the footer in the card', () => {
    renderCard();
    expect(
      screen.getByRole('searchbox', { name: 'Search things' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('keeps the search and the filters on one row: it never wraps, it scrolls sideways instead', () => {
    renderCard();
    const bar = screen.getByRole('button', { name: 'Filter' }).parentElement!;
    expect(bar.className).toMatch(/\bflex-nowrap\b/);
    expect(bar.className).toMatch(/\boverflow-x-auto\b/);
    expect(bar.className).not.toMatch(/\bflex-wrap\b/);
  });

  it('lets the search take the leftover width, up to a sensible size', () => {
    renderCard();
    const search = screen.getByRole('searchbox').closest('div.min-w-40');
    expect(search).not.toBeNull();
    expect(search!.className).toMatch(/\bflex-1\b/);
    // Alone in the bar (no filters beside it) it must not stretch across the whole card.
    expect(search!.className).toMatch(/\bmax-w-sm\b/);
  });
});

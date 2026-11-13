import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePageTitle } from './use-page-title';

describe('usePageTitle', () => {
  it('joins the parts, most specific first, and ends with the app name', () => {
    renderHook(() => usePageTitle('Salary', 'Ana Reyes'));
    expect(document.title).toBe(
      'Salary | Ana Reyes | Employee & Salary Management',
    );
  });

  it('leaves out parts that are not known yet', () => {
    renderHook(() => usePageTitle('Salary', undefined));
    expect(document.title).toBe('Salary | Employee & Salary Management');
  });

  it('follows a change, and puts the previous title back when the page goes away', () => {
    document.title = 'Before';
    const { rerender, unmount } = renderHook(
      ({ name }) => usePageTitle('Salary', name),
      { initialProps: { name: 'Ana' } },
    );
    rerender({ name: 'Ben' });
    expect(document.title).toBe('Salary | Ben | Employee & Salary Management');
    unmount();
    expect(document.title).toBe('Before');
  });
});
